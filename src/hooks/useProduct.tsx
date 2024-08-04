import { getCookie, setCookie } from "@/utils/functions"
import { deserialize, NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK, { addContentToProductEvent, NDKParsedProductEvent } from "./useNDK"

export default function useProduct(productId: string) {
    const ndk = useNDK()

    const getProductById = async (id: string) => {
        if (!ndk) return undefined

        const storedProduct = getCookie(id)

        if (storedProduct) return addContentToProductEvent(deserialize(storedProduct) as unknown as NDKEvent)

        const event = await ndk.fetchEvent({ "#d": [id], kinds: [NDKKind.MarketProduct] })

        if (!event) return undefined

        setCookie(id, event.serialize(), 0.05)

        return addContentToProductEvent(event)
    }

    const [product, setProduct] = useState<NDKParsedProductEvent>()

    useEffect(() => {
        if (ndk)
            getProductById(productId).then(product => {
                if (product) setProduct(product)
            })
    }, [ndk])

    return product
}
