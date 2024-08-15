import { NDKAuctionContent } from "@/utils/ndk"
import { useEffect, useState } from "react"

export default function AuctionCountdown({ auction }: { auction: NDKAuctionContent }) {
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
