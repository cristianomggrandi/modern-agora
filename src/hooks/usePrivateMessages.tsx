"use client"

import { NDKEvent, NDKKind, NDKSubscription } from "@nostr-dev-kit/ndk"
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react"
import { NDKParsedPMEvent, useSubscribe } from "./useNDK"
import useNDKStore from "./useNDKStore"

type NDKContextType = {
    messagesByPubkey: Map<string, NDKParsedPMEvent[]>
}

const addMessageToPubkey = (privateMessageEvent: NDKParsedPMEvent, messagesByPubkey: Map<string, NDKParsedPMEvent[]>, pubkey: string) => {
    const storedChat = messagesByPubkey.get(pubkey)
    const chat = storedChat ?? []

    const insertIndex = chat.findIndex(m => m.created_at! < privateMessageEvent.created_at!)

    // TODO: Order messages here
    // TODO: Check if it's necessary to use toSpliced and always set on map
    if (insertIndex === -1) chat.push(privateMessageEvent)
    else chat.splice(insertIndex, 0, privateMessageEvent)

    // TODO: Check if it is necessary to always set or only when there isn't one already
    if (!storedChat) messagesByPubkey.set(pubkey, chat)
}

const PrivateMessageContext = createContext<NDKContextType | null>(null)

export default function PrivateMessageContextProvider(props: { children: ReactNode }) {
    const user = useNDKStore(state => state.user)
    const subscribeAndHandle = useSubscribe()

    const fetchedPrivateMessage = useRef<string[]>([])
    const sentPrivateMessageSubscription = useRef<NDKSubscription | undefined>(undefined)

    const [messagesByPubkey, setMessagesByPubkey] = useState<Map<string, NDKParsedPMEvent[]>>(new Map())

    const handleNewPM = async (privateMessageEvent: NDKEvent) => {
        try {
            if (!privateMessageEvent.created_at) return

            // TODO: Parse sales and other events
            // const parsedPM = addContentToPMEvent(auctionEvent)
            const isSentByUser = privateMessageEvent.pubkey === user!.pubkey
            const messageTargetPubkey = privateMessageEvent.tags.find(([k, v]) => k === "p" && v && v !== "")![1]

            // If it's sent by me to myself and already is on the array
            if (
                user!.pubkey === messageTargetPubkey &&
                messagesByPubkey.get(messageTargetPubkey)?.find(m => m.id === privateMessageEvent.id)
            )
                return

            const decryptPubkey = isSentByUser ? messageTargetPubkey : privateMessageEvent.pubkey

            const decryptedContent = await window!.nostr!.nip04!.decrypt(decryptPubkey, privateMessageEvent.content)

            privateMessageEvent.content = decryptedContent

            addMessageToPubkey(privateMessageEvent, messagesByPubkey, decryptPubkey)

            setMessagesByPubkey(new Map(messagesByPubkey))
        } catch (error) {}
    }

    useEffect(() => {
        let pmsInterval: NodeJS.Timeout | undefined

        if (user && !sentPrivateMessageSubscription.current) {
            sentPrivateMessageSubscription.current = subscribeAndHandle(
                [
                    { kinds: [NDKKind.EncryptedDirectMessage], authors: [user.pubkey] },
                    { kinds: [NDKKind.EncryptedDirectMessage], "#p": [user.pubkey] },
                ],
                handleNewPM,
                { closeOnEose: false }
            )
        }

        // const updateInterval = setInterval(() => {
        //     setMessagesByPubkey(prev => new Map(prev))
        // }, 10000)

        // TODO: Test
        // return () => sentPrivateMessageSubscription.current?.stop()

        // return () => {
        //     clearInterval(updateInterval)
        // }
    }, [user])

    return <PrivateMessageContext.Provider value={{ messagesByPubkey: messagesByPubkey }}>{props.children}</PrivateMessageContext.Provider>
}

export function useMessagesByPubkey() {
    const context = useContext(PrivateMessageContext)

    if (!context) throw new Error("useMessagesByPubkey must be within a Context Provider")

    return context.messagesByPubkey
}

export function useMessages(pubkey: string) {
    const context = useContext(PrivateMessageContext)

    if (!context) throw new Error("useMessages must be within a Context Provider")

    return context.messagesByPubkey.get(pubkey) ?? []
}
