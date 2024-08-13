"use client"

import ParsedDescription from "@/app/components/ParsedDescription"
import ProductImages from "@/app/components/ProductImages"
import ProductTags from "@/app/components/ProductTags"
import useAuction from "@/hooks/useAuction"
import { useBidStatus, useBids } from "@/hooks/useNDK"
import useStall from "@/hooks/useStall"
import { NDKAuctionContent } from "@/utils/ndk"
import NDK, { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"

function sendBid(e: React.FormEvent<HTMLFormElement>, auctionId: string, ndk?: NDK) {
    // TODO: Maybe move to NDKContext
    e.preventDefault()

    if (!ndk) return

    const target = e.currentTarget

    const bid = target.bid.value

    if (!bid) return

    const ndkEvent = new NDKEvent(ndk)

    ndkEvent.kind = 1021 as NDKKind
    ndkEvent.content = bid
    ndkEvent.tags = [["e", auctionId]]
    ndkEvent.publish()
}

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
        <div className="hidden md:grid lg:grid-cols-4 gap-x-4 text-lg font-bold *:w-12 text-center *:m-auto">
            <span className="hidden lg:block neon-text-sm">D</span>
            <span className="hidden lg:block neon-text-sm">H</span>
            <span className="hidden lg:block neon-text-sm">M</span>
            <span className="hidden lg:block neon-text-sm">S</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(days)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(hours)}</span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(minutes)} </span>
            <span className="hidden lg:block neon-text-sm">{Math.floor(seconds)}</span>
        </div>
    )
}

export default function Auction(props: { params: { auctionId: string } }) {
    const auction = useAuction(props.params.auctionId)
    const bids = useBids()
    const bidStatus = useBidStatus()

    const stall = useStall(auction?.content.stall_id)

    if (!auction) return <div>Loading...</div>

    const auctionBids = bids.get(String(auction.id))
    const highestBid = auctionBids?.reduce(
        (max, curr) => {
            if (auction.pubkey !== curr.pubkey) return max // Confirmation came from someone else
            if (bidStatus.get(max.id) === "winner") return max // Already found the winner
            if (bidStatus.get(curr.id) === "winner") return curr // Is the winner
            if (bidStatus.get(curr.id) === "pending" || bidStatus.get(curr.id) === "rejected") return max

            if (!max) return curr

            if (curr.amount > max.amount) return curr

            return max
        },
        { id: "0", amount: 0, pubkey: "default" }
    )

    return (
        <main className="flex flex-col justify-center p-6 sm:p-[4%] gap-8 min-h-full">
            <h1 className="text-xl sm:text-2xl neon-text-2lg font-semibold text-center">{auction.content.name}</h1>
            <div className="product-details grid gap-8">
                <ProductImages images={auction.content.images} name={auction.content.name} />
                <ParsedDescription description={auction.content.description} />
                <ProductTags tags={auction.tags} />
                {/* TODO: Include link to stall */}
                <div className="product-price-buy flex gap-4">
                    <AuctionCountdown auction={auction.content} />
                </div>
                {/* TODO: Show highest bid and create button to bid */}
            </div>
        </main>
    )
}
