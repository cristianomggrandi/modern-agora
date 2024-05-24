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
        <div className="hidden sm:grid md:grid-cols-4 gap-x-4 text-lg font-bold *:w-12 text-center *:m-auto">
            <span className="hidden md:block neon-text-sm">D</span>
            <span className="hidden md:block neon-text-sm">H</span>
            <span className="hidden md:block neon-text-sm">M</span>
            <span className="hidden md:block neon-text-sm">S</span>
            <span className="md:hidden">{significantTimerName}</span>
            <span className="hidden md:block neon-text-sm">{Math.floor(days)}</span>
            <span className="hidden md:block neon-text-sm">{Math.floor(hours)}</span>
            <span className="hidden md:block neon-text-sm">{Math.floor(minutes)} </span>
            <span className="hidden md:block neon-text-sm">{Math.floor(seconds)}</span>
            <span className="md:hidden">{Math.floor(significantTimer)}</span>
        </div>
    )
}

const AuctionCard = ({ event, highestBid }: { event: NDKParsedAuctionEvent; highestBid?: number }) => {
    if (!event.content) return null

    // TODO: Avaliate: When on mobile, make img the background so the text is over it

    return (
        <Link
            className="flex flex-col grow gap-2 sm:gap-0 p-1 sm:p-0 sm:flex-row w-40 sm:w-auto justify-center sm:divide-x divide-nostr border sm:border-x-0 sm:first:border-none border-nostr rounded-lg sm:rounded-none *:px-1 md:*:px-3"
            href={"/auction/" + event.content.id}
        >
            <div className="h-24 w-full sm:w-24 flex-shrink-0 flex items-center justify-center sm:p-2">
                {event.content.images ? (
                    <img
                        className="h-24 max-w-full sm:max-w-20 sm:max-h-20 rounded"
                        src={event.content.images[0]}
                        alt={event.content.name}
                        height={96}
                        // width={96}
                    />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between sm:justify-around">
                <span className="line-clamp-2 font-semibold">{event.content.name}</span>
                <span className="line-clamp-3 sm:line-clamp-2 text-sm">{event.content.description}</span>
            </div>
            <div className="flex sm:flex-col items-center sm:justify-around sm:w-16">
                <span className="font-bold uppercase neon-text-sm">Bid</span>
                <span className="font-bold uppercase neon-text-sm sm:hidden mr-1">:</span>
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
        <main className="flex items-center justify-center p-8 sm:p-16">
            <div className="flex flex-wrap gap-4 sm:gap-0 sm:block sm:divide-y divide-nostr sm:border border-nostr shadow-nostr sm:shadow-sm rounded-lg">
                {/* TODO: Handle auction limiting better, maybe paginate */}
                {auctions.slice(0, 10).map((event, index) => (
                    <AuctionCard key={event.id + index} event={event} highestBid={bids.get(event.id)} />
                ))}
            </div>
        </main>
    )
}
