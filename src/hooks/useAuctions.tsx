import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function useAuctions() {
    // TODO: Create function to get only active auctions
    const { auctions, subscribeToAuctions } = useNDKContext()

    useEffect(() => {
        subscribeToAuctions()
    }, [])

    return auctions
}

export function useAuctionsByStall(stallId?: string) {
    const { , auctionsByStall, subscribeToAuctions } = useNDKContext()

    useEffect(() => {
        subscribeToAuctions()
    }, [])

    if (!stallId) return undefined

    return auctionsByStall.get(stallId)
}
