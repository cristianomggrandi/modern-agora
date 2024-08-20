import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function useStalls() {
    const { ndk, stalls, subscribeToStalls } = useNDKContext()

    useEffect(() => {
        subscribeToStalls()
    }, [ndk])

    return stalls
}

export function useStallsByUser(pubkey?: string) {
    const { ndk, stalls, subscribeToStalls } = useNDKContext()

    useEffect(() => {
        subscribeToStalls()
    }, [ndk])

    if (!pubkey) return []

    return stalls.filter(s => s.pubkey === pubkey)
}
