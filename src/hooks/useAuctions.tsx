import { getAuctionEndDate } from "@/utils/ndk"
import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { useEffect, useRef, useState } from "react"
import { addContentToAuctionEvent, NDKParsedAuctionEvent, useNDKContext } from "./useNDK"

const addAuctionToStall = (auctionEvent: NDKParsedAuctionEvent, auctionsByStall: Map<string, NDKParsedAuctionEvent[]>) => {
    const stallAuctions = auctionsByStall.get(auctionEvent.content.stall_id) ?? []

    stallAuctions.push(auctionEvent)

    auctionsByStall.set(auctionEvent.content.stall_id, stallAuctions)
}

const orderAuctions = (event: NDKParsedAuctionEvent, prev: NDKParsedAuctionEvent[]) => {
    if (!event.content) return prev

    const newFinishDate = getAuctionEndDate(event)

    // TODO: Toggle to get only active auctions
    // if (newFinishDate < currentDate) return prev

    for (let i = 0; i < prev.length; i++) {
        const currFinishDate = getAuctionEndDate(prev[i])

        if (newFinishDate > currFinishDate) {
            prev.splice(i, 0, event)
            return [...prev]
        }
    }

    return [...prev, event]
}

export default function useAuctions() {
    // TODO: Create function to get only active auctions
    const { ndk, subscribeAndHandle } = useNDKContext()

    const [auctions, setAuctions] = useState<NDKParsedAuctionEvent[]>([])
    const auctionsByStall = useRef<Map<string, NDKParsedAuctionEvent[]>>(new Map())
    const auctionsMap = useRef<Map<string, NDKParsedAuctionEvent>>(new Map())
    const fetchedAuctions = useRef<NDKParsedAuctionEvent[]>([])

    const handleNewAuction = (auctionEvent: NDKEvent) => {
        try {
            const parsedAuction = addContentToAuctionEvent(auctionEvent)

            if (!parsedAuction) return

            fetchedAuctions.current = orderAuctions(parsedAuction, fetchedAuctions.current)
            addAuctionToStall(parsedAuction, auctionsByStall.current)
            auctionsMap.current.set(parsedAuction.id, parsedAuction)
        } catch (error) {}
    }

    useEffect(() => {
        let sub: NDKSubscription | undefined

        if (ndk) sub = subscribeAndHandle({ kinds: [30020 as NDKKind] }, handleNewAuction)

        const auctionsInterval = setInterval(() => {
            setAuctions(prev => {
                if (fetchedAuctions.current === prev) clearInterval(auctionsInterval)

                return fetchedAuctions.current
            })
        }, 1000)

        return () => {
            if (sub) sub.stop()
            clearInterval(auctionsInterval)
        }
    }, [ndk])

    return { auctions, auctionsMap: auctionsMap.current, auctionsByStall: auctionsByStall.current }
}
