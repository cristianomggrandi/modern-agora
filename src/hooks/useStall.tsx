import { getCookie, setCookie } from "@/utils/functions"
import { deserialize, NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK, { addContentToStallEvent, NDKParsedStallEvent } from "./useNDK"

export default function useStall(stallId?: string) {
    const ndk = useNDK()

    const [stall, setStall] = useState<NDKParsedStallEvent>()

    const getStallById = async (id: string) => {
        console.log("useStall", id, ndk)

        if (!ndk) return undefined

        const storedStall = getCookie(id)

        if (storedStall) return addContentToStallEvent(deserialize(storedStall) as unknown as NDKEvent)

        const event = await ndk.fetchEvent({ "#d": [id], kinds: [NDKKind.MarketStall] })

        if (!event) return undefined

        setCookie(id, event.serialize(), 0.05)

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
