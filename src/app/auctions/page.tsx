"use client"

import { NDKParsedAuctionEvent, useAuctions, useBids, useStalls } from "@/hooks/useNDK"
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
        <div className="hidden md:grid lg:grid-cols-4 gap-x-4 text-lg font-bold *:w-12 text-center *:m-auto">
            <span className="hidden lg:block neon-text-sm">D</span>
            <span className="hidden lg:block neon-text-sm">H</span>
            <span className="hidden lg:block neon-text-sm">M</span>
            <span className="hidden lg:block neon-text-sm">S</span>
            <span className="lg:hidden neon-text-sm">{significantTimerName}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(days)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(hours)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(minutes)} </span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(seconds)}</span>
            <span className="lg:hidden neon-text-sm">{Math.floor(significantTimer)}</span>
        </div>
    )
}

const AuctionCard = ({ event, highestBid }: { event: NDKParsedAuctionEvent; highestBid?: number }) => {
    const stalls = useStalls()

    if (!event.content) return null

    const stall = stalls.find(s => event.content.stall_id === s.content.id)

    if (!stall) return null

    // TODO: Avaliate: When on mobile, make img the background so the text is over it

    return (
        <Link
            className="flex flex-col grow gap-2 md:gap-0 p-1 md:p-0 md:flex-row w-40 md:w-auto justify-center md:divide-x divide-nostr border md:border-x-0 md:first:border-none border-nostr rounded-lg md:rounded-none *:px-1 md:*:px-3"
            href={"/auction/" + event.content.id}
        >
            <div className="h-24 w-full md:w-24 flex-shrink-0 flex items-center justify-center md:p-2">
                {event.content.images ? (
                    <img
                        className="h-24 max-w-full md:max-w-20 md:max-h-20 rounded"
                        src={event.content.images[0]}
                        alt={event.content.name}
                        height={96}
                        // width={96}
                    />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between md:justify-around">
                <span className="line-clamp-2 font-semibold">{event.content.name}</span>
                <span className="line-clamp-3 md:line-clamp-2 text-sm">{event.content.description}</span>
            </div>
            <div className="flex md:flex-col items-center md:justify-around md:w-28">
                <span className="font-bold uppercase neon-text-sm">Bid</span>
                <span className="font-bold uppercase neon-text-sm md:hidden mr-1">:</span>
                <span className="font-bold uppercase neon-text-sm">
                    {nFormatter(highestBid ?? event.content.starting_bid, 2)} {stall.content.currency}
                </span>
            </div>
            <AuctionCountdown auction={event.content} />
        </Link>
    )
}

export default function Auctions() {
    const auctions = useAuctions()
    const bids = useBids()

    return (
        <main className="flex items-center justify-center p-8 md:p-16">
            <div className="flex flex-wrap gap-4 md:gap-0 md:block md:divide-y divide-nostr md:border border-nostr shadow-nostr md:shadow-sm rounded-lg">
                {/* TODO: Handle auction limiting better, maybe paginate */}
                {auctions.slice(0, 10).map((event, index) => (
                    <AuctionCard key={event.id + index} event={event} highestBid={bids.get(event.id)} />
                ))}
            </div>
        </main>
    )
}
