import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function useStalls() {
    const { stalls, subscribeToStalls } = useNDKContext()

    useEffect(() => {
        subscribeToStalls()
    }, [])

    return stalls
}

export function useStallsByUser(pubkey?: string) {
    const { stalls, subscribeToStalls } = useNDKContext()

    useEffect(() => {
        subscribeToStalls()
    }, [])

    if (!pubkey) return []

    return stalls.filter(s => s.pubkey === pubkey)
}
