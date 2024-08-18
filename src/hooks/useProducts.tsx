import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { useEffect, useRef } from "react"
import { addContentToProductEvent, NDKParsedProductEvent, useNDKContext } from "./useNDK"

const addProductToStall = (productEvent: NDKParsedProductEvent, productsByStall: Map<string, NDKParsedProductEvent[]>) => {
    const stallProducts = productsByStall.get(productEvent.content.stall_id) ?? []

    stallProducts.push(productEvent)

    productsByStall.set(productEvent.content.stall_id, stallProducts)
}

export default function useProducts() {
    const { ndk, subscribeAndHandle, products, setProducts, productsByStall } = useNDKContext()

    const fetchedProducts = useRef<NDKParsedProductEvent[]>(products ?? [])

    const handleNewProduct = (productEvent: NDKEvent) => {
        try {
            const parsedProduct = addContentToProductEvent(productEvent)

            if (!parsedProduct) return

            fetchedProducts.current.push(parsedProduct)
            addProductToStall(parsedProduct, productsByStall)
        } catch (error) {}
    }

    useEffect(() => {
        let sub: NDKSubscription | undefined
        let productsInterval: NodeJS.Timeout | undefined

        if (!products.length) {
            if (ndk) sub = subscribeAndHandle({ kinds: [NDKKind.MarketProduct] }, handleNewProduct)

            productsInterval = setInterval(() => {
                setProducts(prev => {
                    if (fetchedProducts.current === prev) clearInterval(productsInterval)

                    return fetchedProducts.current
                })
            }, 1000)
        }

        return () => {
            if (sub) sub.stop()
            clearInterval(productsInterval)
        }
    }, [ndk])

    return products
}

export function useProductsByStall(stallId?: string) {
    const { productsByStall } = useNDKContext()

    if (!stallId) return undefined

    return productsByStall.get(stallId)
}
