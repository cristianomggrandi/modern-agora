import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { useEffect, useRef, useState } from "react"
import { addContentToProductEvent, NDKParsedProductEvent, useNDKContext } from "./useNDK"

export default function useProducts() {
    const { ndk, subscribeAndHandle } = useNDKContext()

    // TODO: Create map to access with id of product
    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const fetchedProducts = useRef<NDKParsedProductEvent[]>([])

    const handleNewProduct = (productEvent: NDKEvent) => {
        try {
            const parsedProduct = addContentToProductEvent(productEvent)

            if (!parsedProduct) return

            fetchedProducts.current.push(parsedProduct)
        } catch (error) {}
    }

    useEffect(() => {
        let sub: NDKSubscription | undefined

        if (ndk) sub = subscribeAndHandle({ kinds: [NDKKind.MarketProduct] }, handleNewProduct)

        const productsInterval = setInterval(() => {
            setProducts(prev => {
                if (fetchedProducts.current === prev) clearInterval(productsInterval)

                return fetchedProducts.current
            })
        }, 1000)

        return () => {
            if (sub) sub?.stop()
            clearInterval(productsInterval)
        }
    }, [ndk])

    return products
}
