"use client"

import useNDKStore from "@/hooks/useNDKStore"
import { useEffect, useState } from "react"
import AuctionCard from "../components/AuctionCard"

export default function Auctions() {
    const auctions = useNDKStore(s => s.auctions)
    const subscribeToAuctions = useNDKStore(s => s.subscribeToAuctions)
    const [numberOfAuctionsToShow, setNumberOfAuctionsToShow] = useState(24)

    useEffect(() => {
        subscribeToAuctions()
    }, [])

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfAuctionsToShow(p => Math.min(p + 24, auctions.length))
    }

    return (
        <main className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                {auctions.slice(0, numberOfAuctionsToShow).map((auction, i, array) => (
                    <AuctionCard key={auction.id} auction={auction} isLastAuction={i === array.length - 1} onView={onView} />
                ))}
            </div>
        </main>
    )
}
