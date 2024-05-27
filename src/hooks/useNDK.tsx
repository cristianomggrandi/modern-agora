"use client"

import { getAuctionEndDate, getParsedAuctionContent, getParsedBidContent, getParsedStallContent } from "@/utils/ndk"
import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKSubscriptionOptions } from "@nostr-dev-kit/ndk"
import { createContext, useContext, useEffect, useRef, useState } from "react"

type NDKContextType = {
    subscribeAndHandle: (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => void
    auctions: NDKParsedAuctionEvent[]
    stalls: Map<string, NDKParsedStallEvent>
    bids: Map<string, number>
}

export type NDKParsedAuctionEvent = ReturnType<typeof addContentToAuctionEvent>

export type NDKParsedStallEvent = ReturnType<typeof addContentToStallEvent>

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

function handleBid(event: NDKEvent, bids: Map<string, number>) {
    const auctionIdTag = event.tags.find(t => t[0] === "e")

    if (!auctionIdTag) return

    const auctionId = auctionIdTag[1] as string

    const bidAmount = getParsedBidContent(event)
    const highestBid = bids.get(auctionId)

    if (highestBid) bids.set(auctionId, Math.max(bidAmount, highestBid))
    else bids.set(auctionId, bidAmount)
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

    const [bids] = useState(new Map<string, number>())

    const [stalls] = useState(new Map<string, NDKParsedStallEvent>())

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

        return () => {
            clearInterval(auctionsInterval)
        }
    }, [])

    useEffect(() => {
        subscribeAndHandle({ kinds: [30020 as NDKKind] }, updateFetchedAuctions)

        subscribeAndHandle({ kinds: [30017 as NDKKind] }, event => handleStall(event, stalls))

        // TODO: Confirm bids with 1022 events
        subscribeAndHandle({ kinds: [1021 as NDKKind] }, event => handleBid(event, bids))
    }, [])

    return <NDKContext.Provider value={{ subscribeAndHandle, auctions, stalls, bids }}>{children}</NDKContext.Provider>
}

export default function useNDK() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useNDK must be within a Context Provider")

    return context
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

    return context.bids
}
