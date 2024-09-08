import { useEffect } from "react"
import { useNDKContext } from "./useNDK"

export default function usePrivateMessages() {
    const { privateMessages, subscribeToPrivateMessages } = useNDKContext()

    useEffect(() => {
        subscribeToPrivateMessages()
    }, [])

    return privateMessages
}
