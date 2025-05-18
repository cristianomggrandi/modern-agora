"use client"

import {
    getAuctionEndDate,
    getBidStatus,
    getParsedBidContent,
    NDKParsedAuctionEvent,
    NDKParsedProductEvent,
    NDKParsedStallEvent,
} from "@/utils/ndk"
import { NDKEvent, NDKKind, NDKTag } from "@nostr-dev-kit/ndk"
import { createContext, useContext, useRef, useState } from "react"
import useNDKStore from "./useNDKStore"

export type NDKParsedPMEvent = NDKEvent

export type MessageByPubkeyMap = Map<string, { messages: NDKParsedPMEvent[] }>

type NDKContextType = {
    bids: AuctionBids
    bidStatus: Map<string, "accepted" | "rejected" | "pending" | "winner">

    publishEvent: ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => void
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

    const publishEvent = ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => {
        const ndkEvent = new NDKEvent(ndk)

        ndkEvent.content = content
        ndkEvent.kind = kind
        ndkEvent.tags = tags
        ndkEvent.publish()
    }

    return (
        <NDKContext.Provider
            value={{
                bids,
                bidStatus,

                publishEvent,
            }}
        >
            {children}
        </NDKContext.Provider>
    )
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

export function usePublishEvent() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("usePublishEvent must be within a Context Provider")

    return context.publishEvent
}
