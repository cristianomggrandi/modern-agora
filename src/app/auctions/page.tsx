"use client"

import useAuctions from "@/hooks/useAuctions"
import { NDKParsedAuctionEvent, useBids, useBidStatus } from "@/hooks/useNDK"
import { NDKAuctionContent } from "@/utils/ndk"
import Link from "next/link"
import { useEffect, useState } from "react"
import LastItemWrapper from "../components/LastItemWrapper"

const AuctionCountdown = ({ auction }: { auction: NDKAuctionContent }) => {
    const until = new Date((auction.start_date + auction.duration) * 1000)

    const [secondsLeft, setTimeLeft] = useState(new Date(until.getTime() - Date.now()).getTime() / 1000)

    useEffect(() => {
        const timer = secondsLeft > 3600 ? setInterval(() => setTimeLeft(prev => prev - 1), 1000) : undefined

        return () => clearInterval(timer)
    }, [])

    const days = secondsLeft / 86400
    const hours = (days % 1) * 24
    const minutes = (hours % 1) * 60
    const seconds = (minutes % 1) * 60

    const significantTimerName = days !== 0 ? "Days" : hours !== 0 ? "Hours" : minutes !== 0 ? "Min." : "Sec."
    const significantTimer = days !== 0 ? days : hours !== 0 ? hours : minutes !== 0 ? minutes : seconds

    return (
        <div className="flex justify-end text-lg font-bold text-center">
            <span className="neon-text-sm">
                {Math.floor(significantTimer)} {significantTimerName}
            </span>

            {/* <span className="hidden lg:block neon-text-sm">D</span>
            <span className="hidden lg:block neon-text-sm">H</span>
            <span className="hidden lg:block neon-text-sm">M</span>
            <span className="hidden lg:block neon-text-sm">S</span> */}
            {/* <span className="hidden lg:block neon-text-sm">{Math.floor(days)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(hours)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(minutes)} </span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(seconds)}</span> */}
        </div>
    )
}

const AuctionCard = ({
    auction,
    isLastAuction,
    onView,
}: {
    auction: NDKParsedAuctionEvent
    isLastAuction: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    const bids = useBids()
    const bidStatus = useBidStatus()

    if (!auction.content) return null

    const highestBid = bids
        ?.get(auction.id)
        ?.find(bid => auction.pubkey === bid.pubkey && (bidStatus.get(bid.id) === "accepted" || bidStatus.get(bid.id) === "winner"))

    // TODO: Avaliate: When on mobile, make img the background so the text is over it

    return (
        <LastItemWrapper isLastItem={isLastAuction} onView={onView}>
            <Link
                className="w-full max-w-52 h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
                href={"/auction/" + auction.content.id}
            >
                <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                    <div
                        className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: auction.content.images ? `url(${auction.content.images[0]})` : undefined }}
                    />
                    {/* TODO: Expand image on mobile  */}
                    {auction.content.images?.length ? (
                        <img
                            className="z-10 max-h-full max-w-full"
                            src={auction.content.images[0]}
                            alt={auction.content.name}
                            height={96}
                            // width={96}
                        />
                    ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <span className="line-clamp-2 text-sm font-semibold">{auction.content.name}</span>
                </div>
                <AuctionCountdown auction={auction.content} />
            </Link>
            {/* <Link
                className="flex flex-col gap-2 md:gap-0 p-1 md:p-0 md:flex-row md:w-auto justify-center md:divide-x divide-nostr border md:border-x-0 md:first:border-none border-nostr rounded-lg md:rounded-none *:px-1 md:*:px-3"
                href={"/auction/" + auction.content.id}
            >
                <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                    <div
                        className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: auction.content.images ? `url(${auction.content.images[0]})` : undefined }}
                    />
                    {auction.content.images?.length ? (
                        <img
                            className="z-10 max-h-full max-w-full"
                            src={auction.content.images[0]}
                            alt={auction.content.name}
                            height={96}
                            // width={96}
                        />
                    ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between md:justify-around">
                    <span className="line-clamp-2 font-semibold">{auction.content.name}</span>
                    <span className="line-clamp-3 md:line-clamp-2 text-sm">{auction.content.description}</span>
                </div>
                {/* <div className="flex md:flex-col items-center md:justify-around md:w-28">
                    <span className="font-bold uppercase neon-text-sm">Bid</span>
                    <span className="font-bold uppercase neon-text-sm md:hidden mr-1">:</span>
                    <span className="font-bold uppercase neon-text-sm">
                        {nFormatter(highestBid?.amount ?? auction.content.starting_bid, 2)} {stall.content.currency}
                    </span>
                </div> 
             </Link> */}
        </LastItemWrapper>
    )
}

export default function Auctions() {
    const { auctions } = useAuctions()
    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => p + 24)
    }

    return (
        <main className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                {auctions.slice(0, numberOfProductsToShow).map((auction, i, array) => (
                    <AuctionCard key={auction.id} auction={auction} isLastAuction={i === array.length - 1} onView={onView} />
                ))}
            </div>
        </main>
    )
}
