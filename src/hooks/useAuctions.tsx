import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function useAuctions() {
    // TODO: Create function to get only active auctions
    const { ndk, auctions, subscribeToAuctions } = useNDKContext()

    useEffect(() => {
        subscribeToAuctions()
    }, [ndk])

    return auctions
}

export function useAuctionsByStall(stallId?: string) {
    const { ndk, auctionsByStall, subscribeToAuctions } = useNDKContext()

    useEffect(() => {
        subscribeToAuctions()
    }, [ndk])

    if (!stallId) return undefined

    return auctionsByStall.get(stallId)
}
