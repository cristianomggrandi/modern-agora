import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { useEffect, useRef, useState } from "react"
import { addContentToStallEvent, NDKParsedStallEvent, useNDKContext } from "./useNDK"

export default function useStalls() {
    const { ndk, subscribeAndHandle } = useNDKContext()

    const [stalls, setStalls] = useState<NDKParsedStallEvent[]>([])
    const stallsMap = useRef<Map<string, NDKParsedStallEvent>>(new Map())
    const fetchedStalls = useRef<NDKParsedStallEvent[]>([])

    const handleNewStall = (stallEvent: NDKEvent) => {
        try {
            const parsedStall = addContentToStallEvent(stallEvent)

            if (!parsedStall) return

            fetchedStalls.current.push(parsedStall)
            stallsMap.current.set(parsedStall.id, parsedStall)
        } catch (error) {}
    }

    useEffect(() => {
        let sub: NDKSubscription | undefined

        if (ndk) sub = subscribeAndHandle({ kinds: [NDKKind.MarketStall] }, handleNewStall)

        const productsInterval = setInterval(() => {
            setStalls(prev => {
                if (fetchedStalls.current === prev) clearInterval(productsInterval)

                return fetchedStalls.current
            })
        }, 1000)

        return () => {
            if (sub) sub?.stop()
            clearInterval(productsInterval)
        }
    }, [ndk])

    return { stalls, setStalls, stallsMap: stallsMap.current }
}
