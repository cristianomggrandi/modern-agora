"use client"

import { useAuctions, useBids } from "@/hooks/useNDK"
import { NDKAuctionContent } from "@/utils/ndk"
import Link from "next/link"
import { useEffect, useState } from "react"

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
        <div className="grid grid-cols-4 gap-x-4 text-lg font-bold *:w-12 *:flex *:items-center *:justify-center">
            <span className="neon-text-sm">D</span>
            <span className="neon-text-sm">H</span>
            <span className="neon-text-sm">M</span>
            <span className="neon-text-sm">S</span>
            <span className="neon-text-sm">{Math.floor(days)}</span>
            <span className="neon-text-sm">{Math.floor(hours)}</span>
            <span className="neon-text-sm">{Math.floor(minutes)} </span>
            <span className="neon-text-sm">{Math.floor(seconds)}</span>
        </div>
    )
}

const AuctionCard = ({ event, highestBid }: { event: NDKParsedAuctionEvent; highestBid?: number }) => {
    if (!event.content) return null

    return (
        <Link className="flex gap-4" href={"/auction/" + event.content.id}>
            <div className="h-24 w-24 flex-shrink-0 flex items-center p-2">
                {event.content.images ? (
                    <img
                        className="w-full max-w-20 max-h-20 rounded"
                        src={event.content.images[0]}
                        alt={event.content.name}
                        width={48}
                        height={48}
                    />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <span className="font-semibold">{event.content.name}</span>
                <span className="line-clamp-2 text-sm">{event.content.description}</span>
            </div>
            {/* TODO: Add highest bid  */}
            <AuctionCountdown auction={event.content} />
        </Link>
    )
}

export default function Auctions() {
    const auctions = useAuctions()
    const bids = useBids()

    return (
        <main className="flex items-center justify-center p-16">
            <div className="px-4 divide-y divide-nostr border border-nostr shadow-nostr shadow-sm rounded-lg">
                {/* TODO: Handle auction limiting better, maybe paginate */}
                {auctions.slice(0, 20).map((auctionEvent, index) => (
                    <AuctionCard key={auctionEvent.id + index} event={auctionEvent} highestBid={bids.get(auctionEvent.id)} />
                ))}
            </div>
        </main>
    )
}
