import { NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK, { addContentToStallEvent, NDKParsedStallEvent } from "./useNDK"
import useStalls from "./useStalls"

export default function useStall(stallId?: string) {
    const ndk = useNDK()
    const { stallsMap } = useStalls()

    const [stall, setStall] = useState<NDKParsedStallEvent>()

    const getStallById = async (id: string) => {
        if (!ndk) return undefined

        const storedStall = stallsMap.get(id)

        if (storedStall) return storedStall

        const event = await ndk.fetchEvent({ "#d": [id], kinds: [NDKKind.MarketStall] })

        if (!event) return undefined

        return addContentToStallEvent(event)
    }

    useEffect(() => {
        if (ndk && stallId)
            getStallById(stallId).then(stall => {
                if (stall) setStall(stall)
            })
    }, [ndk, stallId])

    return stall
}
