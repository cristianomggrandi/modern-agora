import { useEffect } from "react"
import useNDKStore from "./useNDKStore"

export default function useProducts() {
    const products = useNDKStore(s => s.products)
    const subscribeToProducts = useNDKStore(s => s.subscribeToProducts)

    useEffect(() => {
        subscribeToProducts()
    }, [])

    return products
}

export function useProductsByStall(stallId?: string) {
    // Test: http://localhost:3000/stall/73507d8e7cb979a2e0dc21902529a674639e7890e221555945ea3f377e803fdc
    const productsByStall = useNDKStore(s => s.productsByStall)
    const subscribeToProducts = useNDKStore(s => s.subscribeToProducts)

    useEffect(() => {
        subscribeToProducts()
    }, [])

    if (!stallId) return undefined

    return productsByStall.get(stallId)
}
