"use client"

import useNDK from "@/hooks/useNDK"
import { NDKAuctionContent, getParsedAuctionContent, getParsedBidContent } from "@/utils/ndk"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"

export type NDKParsedAuctionEvent = ReturnType<typeof addContentToAuctionEvent>

const getAuctionEndDate = (auction: NDKParsedAuctionEvent) => auction.content.start_date + auction.content.duration

const AuctionCountdown = ({ auction }: { auction: NDKAuctionContent }) => {
    const until = new Date((auction.start_date + auction.duration) * 1000)

    const [secondsLeft, setTimeLeft] = useState(new Date(until.getTime() - Date.now()).getTime() / 1000)

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)

        return () => clearInterval(timer)
    }, [])

    const days = secondsLeft / 86400
    const hours = (days % 1) * 24
    const minutes = (hours % 1) * 60
    const seconds = (minutes % 1) * 60

    return (
        <div className="grid grid-cols-4 gap-x-4 neon-text text-lg font-bold *:w-12 *:flex *:items-center *:justify-center">
            <span>D</span>
            <span>H</span>
            <span>M</span>
            <span>S</span>
            <span>{Math.floor(days)}</span>
            <span>{Math.floor(hours)}</span>
            <span>{Math.floor(minutes)} </span>
            <span>{Math.floor(seconds)}</span>
        </div>
    )
}

const AuctionCard = ({ event, highestBid }: { event: NDKParsedAuctionEvent; highestBid?: number }) => {
    if (!event.content) return null

    return (
        <div className="flex gap-4">
            <div className="h-24 w-24 flex-shrink-0 flex items-center p-2">
                {event.content.images ? (
                    <img className="w-full max-w-24" src={event.content.images[0]} alt={event.content.name} width={48} height={48} />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <span className="font-semibold">{event.content.name}</span>
                <span className="line-clamp-2 text-sm">{event.content.description}</span>
            </div>
            <AuctionCountdown auction={event.content} />
        </div>
    )
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

export default function Auctions() {
    const { subscribeAndHandle } = useNDK()

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

    return (
        <main className="flex items-center justify-center p-16">
            <div className="px-4 divide-y divide-nostr shadow-nostr shadow-sm rounded-lg">
                {/* TODO: Handle auction limiting better, maybe paginate */}
                {auctions.slice(0, 50).map((auctionEvent, index) => (
                    <AuctionCard key={auctionEvent.id + index} event={auctionEvent} highestBid={bids.get(auctionEvent.id)} />
                ))}
            </div>
        </main>
    )
}
