"use client"

import { getAuctionEndDate, getParsedAuctionContent, getParsedBidContent } from "@/utils/ndk"
import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKSubscriptionOptions } from "@nostr-dev-kit/ndk"
import { createContext, useContext, useEffect, useState } from "react"

type NDKContextType = {
    subscribeAndHandle: (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => void
    auctions: NDKParsedAuctionEvent[]
    bids: Map<string, number>
}

export type NDKParsedAuctionEvent = ReturnType<typeof addContentToAuctionEvent>

const defaultRelays = [
    "wss://relay.damus.io",
    "wss://relay.nostr.bg",
    "wss://nostr.mom",
    "wss://nos.lol",
    "wss://nostr.bitcoiner.social",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.wine",
    "wss://eden.nostr.land",
    "wss://relay.orangepill.dev",
    "wss://puravida.nostr.land",
    "wss://relay.nostr.com.au",
    "wss://nostr.inosta.cc",
]

const nip07signer = new NDKNip07Signer()

const ndk = new NDK({
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

function handleBid(event: NDKEvent, bids: Map<any, any>) {
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

const NDKContext = createContext<NDKContextType | null>(null)

export function NDKContextProvider({ children }: { children: any }) {
    ndk.connect()
        .then(() => console.log("ndk connected"))
        .catch(error => console.log("ndk error connecting", error))

    const [auctions, setAuctions] = useState<NDKParsedAuctionEvent[]>([])
    const [bids] = useState(new Map<string, number>())

    useEffect(() => {
        subscribeAndHandle(
            { kinds: [30020 as NDKKind] }, // NDK doesn't have auction types
            // (event: NDKEvent) => setAuctions(prev => orderAuctions(addContentToAuctionEvent(event), prev))
            (event: NDKEvent) =>
                setAuctions(prev => (!prev.find(e => e.id === event.id) ? orderAuctions(addContentToAuctionEvent(event), prev) : prev))
        )
        subscribeAndHandle(
            { kinds: [1021 as NDKKind] }, // NDK doesn't have bid types
            event => handleBid(event, bids)
        )
    }, [])

    return <NDKContext.Provider value={{ subscribeAndHandle, auctions, bids }}>{children}</NDKContext.Provider>
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
export function useBids() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useBids must be within a Context Provider")

    return context.bids
}
