import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function useProducts() {
    // TODO: Maybe remove ndk on all dependency arrays and change to an interval on "subscribeToProducts"
    const { ndk, products, subscribeToProducts } = useNDKContext()

    useEffect(() => {
        subscribeToProducts()
    }, [ndk])

    return products
}

export function useProductsByStall(stallId?: string) {
    // Test: http://localhost:3000/stall/73507d8e7cb979a2e0dc21902529a674639e7890e221555945ea3f377e803fdc
    const { ndk, productsByStall, subscribeToProducts } = useNDKContext()

    useEffect(() => {
        subscribeToProducts()
    }, [ndk])

    if (!stallId) return undefined

    return productsByStall.get(stallId)
}
