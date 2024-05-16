"use client"

import { NDKAuctionContent } from "@/utils/ndk"
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

export default function Teste() {
    const event = {
        content: {
            id: "dc321960-e704-4152-abeb-06289392a65f",
            stall_id: "1cec08027d825fbd1bc099f2741c6d08206e73fb6b1c95751ca56eb3b2b18136",
            name: "Bitcoin wizard mosaic artwork ",
            description:
                "This Handmade Bitcoin Wizard Artwork serves as a captivating conversation starter, a statement piece for your home or office, or a remarkable gift for the discerning art enthusiast. Its versatile size and impeccable craftsmanship make it an ideal addition to any space, bringing an air of enchantment and sophistication.\n\nSizes:\n\nArtwork-\nheight: 20 cm\nwidth: 29,5 cm\n\nFrame-\nheight: 46 cm\nwidth: 31 cm",
            images: [
                "https://f004.backblazeb2.com/file/plebeian-market/P_auction_BGBA_media_1.jpeg",
                "https://f004.backblazeb2.com/file/plebeian-market/P_auction_BGBA_media_2.jpeg",
                "https://f004.backblazeb2.com/file/plebeian-market/P_auction_BGBA_media_3.jpeg",
            ],
            shipping: [
                { id: "b2c01c8a8a0d9a99f145f099a963021f010dc608a8e992bd1a2aec958b48f32d", cost: 0.0 },
                { id: "WORLD", cost: 0.0 },
            ],
            starting_bid: 0,
            start_date: 1685870636,
            duration: 604800.0,
        },
        created_at: 1705996272,
        id: "bffdfe9cfa952348f13c9a374f49aa1ee9568f961eb51240266464e2bb397e98",
        kind: 30020,
        pubkey: "bc3be76ba7c82d22e47c4cfeda57aa5bfa8b8781831325cd934f8ceed5d55f29",
        sig: "5cb7651a1dc0ceea55a593e21f50b01cb274da8d189158d6bba2b2a64b002e0a074604502768a29a855b843184d6a311c21d43b6c9f4900520b183b81d86d12c",
        tags: [["d", "dc321960-e704-4152-abeb-06289392a65f"]],
    }

    return (
        <div className="m-12 px-4 divide-y divide-nostr shadow-nostr shadow-sm rounded-lg">
            <div className="flex gap-4">
                <div className="h-24 w-24 flex-shrink-0 flex items-center p-2">
                    <img className="w-full max-w-24" src={event.content.images[0]} alt={event.content.name} width={48} height={48} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <span className="font-semibold">{event.content.name}</span>
                    <span className="line-clamp-2 text-sm">{event.content.description}</span>
                </div>
                <AuctionCountdown auction={event.content} />
            </div>
            <div className="flex gap-4">
                <div className="h-24 w-24 flex-shrink-0 flex items-center p-2">
                    <img className="w-full max-w-24" src={event.content.images[0]} alt={event.content.name} width={48} height={48} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <span className="font-semibold">{event.content.name}</span>
                    <span className="line-clamp-2 text-sm">{event.content.description}</span>
                </div>
                <AuctionCountdown auction={event.content} />
            </div>
        </div>
    )
}
