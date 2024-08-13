import { NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useAuctions from "./useAuctions"
import useNDK, { addContentToAuctionEvent, NDKParsedAuctionEvent } from "./useNDK"

export default function useAuction(auctionId: string) {
    const ndk = useNDK()
    const { auctionsMap } = useAuctions()

    const getAuctionById = async (id: string) => {
        if (!ndk) return undefined

        const storedAuction = auctionsMap.get(id)

        if (storedAuction) return storedAuction

        const event = await ndk.fetchEvent({ "#d": [id], kinds: [30020 as NDKKind] })

        if (!event) return undefined

        return addContentToAuctionEvent(event)
    }

    const [auction, setAuction] = useState<NDKParsedAuctionEvent>()

    useEffect(() => {
        if (ndk)
            getAuctionById(auctionId).then(auction => {
                if (auction) setAuction(auction)
            })
    }, [ndk])

    return auction
}
