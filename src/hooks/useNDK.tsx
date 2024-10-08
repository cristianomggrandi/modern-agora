"use client"

import {
    getAuctionEndDate,
    getBidStatus,
    getParsedAuctionContent,
    getParsedBidContent,
    getParsedProductContent,
    getParsedStallContent,
} from "@/utils/ndk"
import { NDKEvent, NDKFilter, NDKKind, NDKSubscription, NDKSubscriptionOptions, NDKTag } from "@nostr-dev-kit/ndk"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import useNDKStore from "./useNDKStore"

export type NDKParsedProductEvent = ReturnType<typeof addContentToProductEvent>

export type NDKParsedAuctionEvent = ReturnType<typeof addContentToAuctionEvent>

export type NDKParsedStallEvent = ReturnType<typeof addContentToStallEvent>

export type NDKParsedPMEvent = NDKEvent

export type MessageByPubkeyMap = Map<string, { messages: NDKParsedPMEvent[] }>

type NDKContextType = {
    subscribeAndHandle: (
        filters: NDKFilter | NDKFilter[],
        handler: (event: NDKEvent) => void,
        opts?: NDKSubscriptionOptions
    ) => NDKSubscription | undefined
    bids: AuctionBids
    bidStatus: Map<string, "accepted" | "rejected" | "pending" | "winner">

    publishEvent: ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => void

    stalls: NDKParsedStallEvent[]
    subscribeToStalls: () => void

    products: NDKParsedProductEvent[]
    productsByStall: Map<string, NDKParsedProductEvent[]>
    subscribeToProducts: () => void

    auctions: NDKParsedAuctionEvent[]
    auctionsByStall: Map<string, NDKParsedAuctionEvent[]>
    subscribeToAuctions: () => void
}

// export type NDKParsedConfirmationBidEvent = ReturnType<typeof addContentToConfirmationBidEvent>

export type AuctionBids = Map<string, { id: string; amount: number; pubkey: string }[]>

const defaultRelays = [
    "wss://relay.damus.io",
    "wss://relay.nostr.bg",
    "wss://nostr.mom",
    "wss://nos.lol",
    "wss://nostr.bitcoiner.social",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.wine",
    "wss://eden.nostr.land",
    // TODO: Seems to be paid (https://orangepill.dev/)
    // "wss://relay.orangepill.dev",
    "wss://puravida.nostr.land",
    "wss://relay.nostr.com.au",
    "wss://nostr.inosta.cc",
]

export const orderProducts = (event: NDKParsedProductEvent, prev: NDKParsedProductEvent[]) => {
    if (!event.content || !event.created_at || Object.keys(event.content).length === 0) return prev

    for (let i = 0; i < prev.length; i++) {
        const e = prev[i]

        if (event.created_at > e.created_at!) {
            prev.splice(i, 0, event)
            return [...prev]
        }
    }

    return [...prev, event]
}

export function handleStall(event: NDKEvent, stalls: Map<string, NDKParsedStallEvent>) {
    const parsedStall = addContentToStallEvent(event)

    if (!parsedStall) return

    stalls.set(parsedStall.content.id, parsedStall)
}

export function handleBid(event: NDKEvent, bids: AuctionBids) {
    const auctionIdTag = event.tags.find(t => t[0] === "e")

    if (!auctionIdTag) return

    const auctionId = auctionIdTag[1] as string

    const bidAmount = getParsedBidContent(event)
    const prevBids = bids.get(auctionId)

    bids.set(
        auctionId,
        [...(prevBids ?? []), { id: event.id, amount: bidAmount, pubkey: event.pubkey }].sort((a, b) => b.amount - a.amount)
    )
}

export function handleConfirmBid(event: NDKEvent, bidStatus: Map<string, string>) {
    // TODO: Check if it is the right pubkey

    const bidIdTag = event.tags[0]
    const auctionIdTag = event.tags[1]

    if (!bidIdTag || !auctionIdTag) return

    const bidId = bidIdTag[1] as string
    // const auctionId = auctionIdTag[1] as string

    const status = getBidStatus(event)

    bidStatus.set(bidId, status)
}

export function addContentToProductEvent(event: NDKEvent) {
    const content = getParsedProductContent(event)

    return { ...event, content }
}

export function addContentToAuctionEvent(event: NDKEvent) {
    const content = getParsedAuctionContent(event)

    return { ...event, content }
}

export function addContentToStallEvent(event: NDKEvent) {
    const content = getParsedStallContent(event)

    return { ...event, content }
}

const addProductToStall = (productEvent: NDKParsedProductEvent, productsByStall: Map<string, NDKParsedProductEvent[]>) => {
    const stallProducts = productsByStall.get(productEvent.content.stall_id) ?? []

    stallProducts.push(productEvent)

    productsByStall.set(productEvent.content.stall_id, stallProducts)
}

const addAuctionToStall = (auctionEvent: NDKParsedAuctionEvent, auctionsByStall: Map<string, NDKParsedAuctionEvent[]>) => {
    const stallAuctions = auctionsByStall.get(auctionEvent.content.stall_id) ?? []

    stallAuctions.push(auctionEvent)

    auctionsByStall.set(auctionEvent.content.stall_id, stallAuctions)
}

const addMessageToPubkey = (privateMessageEvent: NDKParsedPMEvent, messagesByPubkey: MessageByPubkeyMap, pubkey: string) => {
    const chat = messagesByPubkey.get(pubkey) ?? { messages: [] }

    if (chat) chat.messages.push(privateMessageEvent)

    // TODO: Check if it is necessary to always set or only when there isn't one already
    messagesByPubkey.set(pubkey, chat)
}

const orderAuctions = (event: NDKParsedAuctionEvent, prev: NDKParsedAuctionEvent[]) => {
    if (!event.content) return prev

    const newFinishDate = getAuctionEndDate(event)

    // TODO: Toggle to get only active auctions
    // if (newFinishDate < currentDate) return prev

    for (let i = 0; i < prev.length; i++) {
        const currFinishDate = getAuctionEndDate(prev[i])

        if (newFinishDate > currFinishDate) {
            prev.splice(i, 0, event)
            return [...prev]
        }
    }

    return [...prev, event]
}

const NDKContext = createContext<NDKContextType | null>(null)

export function OLD_NDKContextProvider({ children }: { children: any }) {
    const ndk = useNDKStore(state => state.ndk)
    const user = useNDKStore(state => state.user)

    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const productsByStall = useRef<Map<string, NDKParsedProductEvent[]>>(new Map())

    const [stalls, setStalls] = useState<NDKParsedStallEvent[]>([])

    const [auctions, setAuctions] = useState<NDKParsedAuctionEvent[]>([])
    const auctionsByStall = useRef<Map<string, NDKParsedAuctionEvent[]>>(new Map())

    const [bids] = useState<AuctionBids>(new Map())
    const [bidStatus] = useState(new Map<string, "accepted" | "rejected" | "pending" | "winner">())

    const subscribeAndHandle = (
        filters: NDKFilter | NDKFilter[],
        handler?: (event: NDKEvent) => void,
        opts: NDKSubscriptionOptions = { closeOnEose: true }
    ) => {
        if (!ndk) return

        const sub = ndk.subscribe(filters, opts)

        if (handler)
            sub.on("event", (e: NDKEvent) => {
                handler(e)
            })

        sub.on("eose", () => {})

        return sub
    }

    const [isSubscribedToStalls, setIsSubscribedToStalls] = useState(false)
    const fetchedStalls = useRef<NDKParsedStallEvent[]>([])
    const stallsSubscription = useRef<NDKSubscription | undefined>(undefined)

    const subscribeToStalls = () => setIsSubscribedToStalls(true)

    const handleNewStall = (stallEvent: NDKEvent) => {
        try {
            const parsedStall = addContentToStallEvent(stallEvent)

            if (!parsedStall) return

            fetchedStalls.current.push(parsedStall)
        } catch (error) {}
    }

    const [isSubscribedToProducts, setIsSubscribedToProducts] = useState(false)
    const fetchedProducts = useRef<NDKParsedProductEvent[]>(products ?? [])
    const productsSubscription = useRef<NDKSubscription | undefined>(undefined)

    const subscribeToProducts = () => setIsSubscribedToProducts(true)

    const handleNewProduct = (productEvent: NDKEvent) => {
        try {
            const parsedProduct = addContentToProductEvent(productEvent)

            if (!parsedProduct) return

            fetchedProducts.current.push(parsedProduct)
            addProductToStall(parsedProduct, productsByStall.current)
        } catch (error) {}
    }

    const [isSubscribedToAuctions, setIsSubscribedToAuctions] = useState(false)
    const fetchedAuctions = useRef<NDKParsedAuctionEvent[]>([])
    const auctionsSubscription = useRef<NDKSubscription | undefined>(undefined)

    const subscribeToAuctions = () => setIsSubscribedToAuctions(true)

    const handleNewAuction = (auctionEvent: NDKEvent) => {
        try {
            const parsedAuction = addContentToAuctionEvent(auctionEvent)

            if (!parsedAuction) return

            fetchedAuctions.current = orderAuctions(parsedAuction, fetchedAuctions.current)
            addAuctionToStall(parsedAuction, auctionsByStall.current)
        } catch (error) {}
    }

    const publishEvent = ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => {
        const ndkEvent = new NDKEvent(ndk)

        ndkEvent.content = content
        ndkEvent.kind = kind
        ndkEvent.tags = tags
        ndkEvent.publish()
    }

    // TODO: Maybe center all intervals in only one
    useEffect(() => {
        let stallsInterval: NodeJS.Timeout | undefined
        let productsInterval: NodeJS.Timeout | undefined
        let auctionsInterval: NodeJS.Timeout | undefined

        if (ndk) {
            if (isSubscribedToStalls && !stallsSubscription.current) {
                stallsSubscription.current = subscribeAndHandle({ kinds: [NDKKind.MarketStall] }, handleNewStall, { closeOnEose: true })

                stallsInterval = setInterval(() => {
                    setStalls(prev => {
                        if (fetchedStalls.current.length && fetchedStalls.current.length === prev.length) clearInterval(stallsInterval)

                        return fetchedStalls.current
                    })
                }, 1000)
            }

            if (isSubscribedToProducts && !productsSubscription.current) {
                productsSubscription.current = subscribeAndHandle({ kinds: [NDKKind.MarketProduct] }, handleNewProduct, {
                    closeOnEose: true,
                })

                productsInterval = setInterval(() => {
                    setProducts(prev => {
                        if (fetchedProducts.current === prev) clearInterval(productsInterval)

                        return fetchedProducts.current
                    })
                }, 1000)
            }

            if (isSubscribedToAuctions && !auctionsSubscription.current) {
                auctionsSubscription.current = subscribeAndHandle({ kinds: [30020 as NDKKind] }, handleNewAuction)

                auctionsInterval = setInterval(() => {
                    setAuctions(prev => {
                        if (fetchedAuctions.current === prev) clearInterval(auctionsInterval)

                        return fetchedAuctions.current
                    })
                }, 1000)
            }
        }

        return () => {
            stallsSubscription.current?.stop()
            clearInterval(stallsInterval)

            productsSubscription.current?.stop()
            clearInterval(productsInterval)

            auctionsSubscription.current?.stop()
            clearInterval(auctionsInterval)
        }
    }, [user, isSubscribedToStalls, isSubscribedToProducts, isSubscribedToAuctions])

    return (
        <NDKContext.Provider
            value={{
                // ndk,
                subscribeAndHandle,
                bids,
                bidStatus,
                // loginWithNIP07,
                // user,

                publishEvent,

                stalls,
                subscribeToStalls,

                products,
                productsByStall: productsByStall.current,
                subscribeToProducts,

                auctions,
                auctionsByStall: auctionsByStall.current,
                subscribeToAuctions,
            }}
        >
            {children}
        </NDKContext.Provider>
    )
}

// export default function useNDK() {
//     const context = useContext(NDKContext)

//     if (!context) throw new Error("useNDK must be within a Context Provider")

//     return context.ndk
// }

export function useNDKContext() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useNDKContext must be within a Context Provider")

    return context
}

export function useSubscribe() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useNDK must be within a Context Provider")

    return context.subscribeAndHandle
}

export function useBids() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useBids must be within a Context Provider")

    // TODO: Filter bids that are confirmed

    return context.bids
}

export function useBidStatus() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useBidStatus must be within a Context Provider")

    // TODO: Filter bids that are confirmed

    return context.bidStatus
}

// export function useLogin() {
//     const context = useContext(NDKContext)

//     if (!context) throw new Error("useLogin must be within a Context Provider")

//     return context.loginWithNIP07
// }

// export function useUser() {
//     const context = useContext(NDKContext)

//     if (!context) throw new Error("useUser must be within a Context Provider")

//     return context.user
// }

export function usePublishEvent() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("usePublishEvent must be within a Context Provider")

    return context.publishEvent
}
