import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { useEffect, useRef, useState } from "react"
import { addContentToProductEvent, NDKParsedProductEvent, useNDKContext } from "./useNDK"

const addProductToStall = (productEvent: NDKParsedProductEvent, productsByStall: Map<string, NDKParsedProductEvent[]>) => {
    const stallProducts = productsByStall.get(productEvent.content.stall_id) ?? []

    stallProducts.push(productEvent)

    productsByStall.set(productEvent.content.stall_id, stallProducts)
}

export default function useProducts() {
    const { ndk, subscribeAndHandle } = useNDKContext()

    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const productsByStall = useRef<Map<string, NDKParsedProductEvent[]>>(new Map())
    const productsMap = useRef<Map<string, NDKParsedProductEvent>>(new Map())
    const fetchedProducts = useRef<NDKParsedProductEvent[]>([])

    const handleNewProduct = (productEvent: NDKEvent) => {
        try {
            const parsedProduct = addContentToProductEvent(productEvent)

            if (!parsedProduct) return

            fetchedProducts.current.push(parsedProduct)
            addProductToStall(parsedProduct, productsByStall.current)
            productsMap.current.set(parsedProduct.id, parsedProduct)
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
            if (sub) sub.stop()
            clearInterval(productsInterval)
        }
    }, [ndk])

    return { products, productsMap: productsMap.current, productsByStall: productsByStall.current }
}
