import { useEffect } from "react"
import useNDKStore from "./useNDKStore"

export default function useStalls() {
    const subscribeToStalls = useNDKStore(s => s.subscribeToStalls)
    const stalls = useNDKStore(s => s.stalls)

    useEffect(() => {
        subscribeToStalls()
    }, [])

    return stalls
}

export function useStallsByUser(pubkey?: string) {
    const subscribeToStalls = useNDKStore(s => s.subscribeToStalls)
    const stalls = useNDKStore(s => s.stalls)

    useEffect(() => {
        subscribeToStalls()
    }, [])

    if (!pubkey) return []

    return stalls.filter(s => s.pubkey === pubkey)
}
