import { NDKKind } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK, { addContentToProductEvent, NDKParsedProductEvent } from "./useNDK"
import useProducts from "./useProducts"

export default function useProduct(productId: string) {
    const ndk = useNDK()
    const products = useProducts()

    const getProductById = async (id: string) => {
        if (!ndk) return undefined

        const storedProduct = products.find(p => p.content.id === id)

        if (storedProduct) return storedProduct

        const event = await ndk.fetchEvent({ "#d": [id], kinds: [NDKKind.MarketProduct] })

        if (!event) return undefined

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
