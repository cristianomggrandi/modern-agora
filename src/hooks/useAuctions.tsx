import { useEffect } from "react"
import useNDKStore from "./useNDKStore"

export default function     useAuctions() {
    // TODO: Create function to get only active auctions
    const subscribeToAuctions = useNDKStore(s => s.subscribeToAuctions)
    const auctions = useNDKStore(s => s.auctions)

    useEffect(() => {
        subscribeToAuctions()
    }, [])

    return auctions
}

export function useAuctionsByStall(stallId?: string) {
    const subscribeToAuctions = useNDKStore(s => s.subscribeToAuctions)
    const auctionsByStall = useNDKStore(s => s.auctionsByStall)

    useEffect(() => {
        subscribeToAuctions()
    }, [])

    if (!stallId) return undefined

    return auctionsByStall.get(stallId)
}
