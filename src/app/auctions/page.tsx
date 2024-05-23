"use client"

import { NDKParsedAuctionEvent, useAuctions, useBids } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
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

    const significantTimerName = days !== 0 ? "Days" : hours !== 0 ? "Hours" : minutes !== 0 ? "Min." : "Sec."
    const significantTimer = days !== 0 ? days : hours !== 0 ? hours : minutes !== 0 ? minutes : seconds

    return (
        <div className="grid md:grid-cols-4 gap-x-4 text-lg font-bold *:w-12 text-center *:m-auto *:neon-text-sm">
            <span className="hidden md:block">D</span>
            <span className="hidden md:block">H</span>
            <span className="hidden md:block">M</span>
            <span className="hidden md:block">S</span>
            <span className="md:hidden">{significantTimerName}</span>
            <span className="hidden md:block">{Math.floor(days)}</span>
            <span className="hidden md:block">{Math.floor(hours)}</span>
            <span className="hidden md:block">{Math.floor(minutes)} </span>
            <span className="hidden md:block">{Math.floor(seconds)}</span>
            <span className="md:hidden">{Math.floor(significantTimer)}</span>
        </div>
    )
}

const AuctionCard = ({ event, highestBid }: { event: NDKParsedAuctionEvent; highestBid?: number }) => {
    if (!event.content) return null

    // TODO: Change layout to grid instead of list when on mobile

    return (
        <Link className="flex justify-center divide-x divide-nostr divide-spa *:px-1 md:*:px-3" href={"/auction/" + event.content.id}>
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
            <div className="flex flex-col items-center justify-around sm:w-16">
                <span className="font-bold uppercase neon-text-sm">Bid</span>
                {/* TODO: Add currency */}
                <span className="font-bold uppercase neon-text-sm">{nFormatter(highestBid ?? event.content.starting_bid, 2)}</span>
            </div>
            <AuctionCountdown auction={event.content} />
        </Link>
    )
}

export default function Auctions() {
    const auctions = useAuctions()
    const bids = useBids()

    return (
        <main className="flex items-center justify-center p-16">
            <div className="divide-y divide-nostr border border-nostr shadow-nostr shadow-sm rounded-lg">
                {/* TODO: Handle auction limiting better, maybe paginate */}
                {auctions.slice(0, 20).map((auctionEvent, index) => (
                    <AuctionCard key={auctionEvent.id + index} event={auctionEvent} highestBid={bids.get(auctionEvent.id)} />
                ))}
            </div>
        </main>
    )
}
