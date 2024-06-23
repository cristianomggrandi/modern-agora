"use client"

import {
    getAuctionEndDate,
    getBidStatus,
    getParsedAuctionContent,
    getParsedBidContent,
    getParsedProductContent,
    getParsedStallContent,
} from "@/utils/ndk"
import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKSubscriptionOptions } from "@nostr-dev-kit/ndk"
import { createContext, useContext, useEffect, useRef, useState } from "react"

type NDKContextType = {
    subscribeAndHandle: (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => void
    products: NDKParsedProductEvent[]
    auctions: NDKParsedAuctionEvent[]
    stalls: Map<string, NDKParsedStallEvent>
    bids: AuctionBids
    bidStatus: Map<string, "accepted" | "rejected" | "pending" | "winner">
}

export type NDKParsedProductEvent = ReturnType<typeof addContentToProductEvent>

export type NDKParsedAuctionEvent = ReturnType<typeof addContentToAuctionEvent>

export type NDKParsedStallEvent = ReturnType<typeof addContentToStallEvent>

// export type NDKParsedConfirmationBidEvent = ReturnType<typeof addContentToConfirmationBidEvent>

export type AuctionBids = Map<string, { id: string; amount: number; pubkey: string }[]>

const defaultRelays = [
    "wss://relay.damus.io",
    "wss://relay.nostr.bg",
    // TODO: Return with relays
    // "wss://nostr.mom",
    // "wss://nos.lol",
    // "wss://nostr.bitcoiner.social",
    // "wss://nostr-pub.wellorder.net",
    // "wss://nostr.wine",
    // "wss://eden.nostr.land",
    // "wss://relay.orangepill.dev",
    // "wss://puravida.nostr.land",
    // "wss://relay.nostr.com.au",
    // "wss://nostr.inosta.cc",
]

const nip07signer = new NDKNip07Signer()

export const ndk = new NDK({
    explicitRelayUrls: defaultRelays,
    signer: nip07signer,
})

const subscribeAndHandle = (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => {
    const sub = ndk.subscribe(filter, opts)

    sub.on("event", (e: NDKEvent) => handler(e))
}

const orderProducts = (event: NDKParsedProductEvent, prev: NDKParsedProductEvent[]) => {
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

const orderAuctions = (event: NDKParsedAuctionEvent, prev: NDKParsedAuctionEvent[]) => {
    if (!event.content) return prev

    // const currentDate = Math.floor(Date.now() / 1000)
    const newFinishDate = getAuctionEndDate(event)

    // TODO: Toggle to get only active auctions
    // if (newFinishDate < currentDate) return prev

    for (let i = 0; i < prev.length; i++) {
        const currFinishDate = getAuctionEndDate(prev[i])

        if (newFinishDate < currFinishDate) {
            prev.splice(i, 0, event)
            return [...prev]
        }
    }

    return [...prev, event]
}

function handleStall(event: NDKEvent, stalls: Map<string, NDKParsedStallEvent>) {
    const parsedStall = addContentToStallEvent(event)

    if (!parsedStall) return

    stalls.set(parsedStall.content.id, parsedStall)
}

function handleBid(event: NDKEvent, bids: AuctionBids) {
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

function handleConfirmBid(event: NDKEvent, bidStatus: Map<string, string>) {
    // TODO: Check if it is the right pubkey

    const bidIdTag = event.tags[0]
    const auctionIdTag = event.tags[1]

    if (!bidIdTag || !auctionIdTag) return

    const bidId = bidIdTag[1] as string
    // const auctionId = auctionIdTag[1] as string

    const status = getBidStatus(event)

    bidStatus.set(bidId, status)
}

function addContentToProductEvent(event: NDKEvent) {
    const content = getParsedProductContent(event)

    return { ...event, content }
}

function addContentToAuctionEvent(event: NDKEvent) {
    const content = getParsedAuctionContent(event)

    return { ...event, content }
}

function addContentToStallEvent(event: NDKEvent) {
    const content = getParsedStallContent(event)

    return { ...event, content }
}

const NDKContext = createContext<NDKContextType | null>(null)

export function NDKContextProvider({ children }: { children: any }) {
    ndk.connect()
        .then(() => console.log("ndk connected"))
        .catch(error => console.error("ndk error connecting", error))

    const [auctions, setAuctions] = useState<NDKParsedAuctionEvent[]>([])
    const fetchedAuctions = useRef<NDKParsedAuctionEvent[]>([])

    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const fetchedProducts = useRef<NDKParsedProductEvent[]>([])

    const [bids] = useState<AuctionBids>(new Map())
    const [bidStatus] = useState(new Map<string, "accepted" | "rejected" | "pending" | "winner">())

    const [stalls] = useState(new Map<string, NDKParsedStallEvent>())

    const updateFetchedProducts = (event: NDKEvent) => {
        fetchedProducts.current = !fetchedProducts.current.find(e => e.id === event.id)
            ? orderProducts(addContentToProductEvent(event), fetchedProducts.current)
            : fetchedProducts.current
    }

    const updateFetchedAuctions = (event: NDKEvent) => {
        fetchedAuctions.current = !fetchedAuctions.current.find(e => e.id === event.id)
            ? orderAuctions(addContentToAuctionEvent(event), fetchedAuctions.current)
            : fetchedAuctions.current
    }

    useEffect(() => {
        const auctionsInterval = setInterval(() => {
            setAuctions(prev => {
                if (fetchedAuctions.current === prev) clearInterval(auctionsInterval)

                return fetchedAuctions.current
            })
        }, 1000)

        const productsInterval = setInterval(() => {
            setProducts(prev => {
                if (fetchedProducts.current === prev) clearInterval(productsInterval)

                return fetchedProducts.current
            })
        }, 1000)

        return () => {
            clearInterval(auctionsInterval)
            clearInterval(productsInterval)
        }
    }, [])

    useEffect(() => {
        // subscribeAndHandle({ kinds: [30018 as NDKKind] }, updateFetchedProducts)

        // subscribeAndHandle({ kinds: [30020 as NDKKind] }, updateFetchedAuctions)

        // subscribeAndHandle({ kinds: [30017 as NDKKind] }, event => handleStall(event, stalls))

        // subscribeAndHandle({ kinds: [1021 as NDKKind] }, event => handleBid(event, bids))
        // subscribeAndHandle({ kinds: [1022 as NDKKind] }, event => handleConfirmBid(event, bidStatus))
    }, [])

    return <NDKContext.Provider value={{ subscribeAndHandle, products, auctions, stalls, bids, bidStatus }}>{children}</NDKContext.Provider>
}

export default function useNDK() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useNDK must be within a Context Provider")

    return context
}

export function useProducts() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useProducts must be within a Context Provider")

    return context.products
}

export function useAuctions() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useAuctions must be within a Context Provider")

    return context.auctions
}

export function useStalls() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useStalls must be within a Context Provider")

    return context.stalls
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
