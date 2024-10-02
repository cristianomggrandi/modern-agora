"use client"

import { NDKEvent, NDKKind, NDKSubscription, NDKUser } from "@nostr-dev-kit/ndk"
import { createContext, ReactNode, useContext, useEffect, useRef } from "react"
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"
import { NDKParsedPMEvent, useSubscribe } from "./useNDK"
import useNDKStore from "./useNDKStore"

type PMStoreType = {
    messagesByPubkey: Map<string, NDKParsedPMEvent[]>
    handleNewPM: (event: NDKEvent, user: NDKUser) => Promise<void>
}

const createPMStore = () =>
    createStore<PMStoreType>()((set, get) => ({
        messagesByPubkey: new Map(),
        handleNewPM: async (e: NDKParsedPMEvent, user: NDKUser) => {
            if (!e.created_at) return

            // TODO: Parse sales and other events
            // const parsedPM = addContentToPMEvent(auctionEvent)
            const isSentByUser = e.pubkey === user!.pubkey
            const messageTargetPubkey = e.tags.find(([k, v]) => k === "p" && v && v !== "")![1]

            const decryptPubkey = isSentByUser ? messageTargetPubkey : e.pubkey

            const decryptedContent = await window!.nostr!.nip04!.decrypt(decryptPubkey, e.content)

            const prevMessages = get().messagesByPubkey

            // If it's sent by me to myself and already is on the array
            if (user!.pubkey === messageTargetPubkey && prevMessages.get(decryptPubkey)?.find(m => m.id === e.id)) return

            e.content = decryptedContent

            const storedMessages = prevMessages.get(decryptPubkey)
            const messages = storedMessages ?? []

            const insertIndex = messages.findIndex(m => m.created_at! < e.created_at!)

            if (insertIndex === -1) messages.push(e)
            else messages.splice(insertIndex, 0, e)

            if (!storedMessages) prevMessages.set(decryptPubkey, messages)
            set(prev => ({ messagesByPubkey: new Map(prev.messagesByPubkey) }))
        },
    }))

type PMStoreAPI = ReturnType<typeof createPMStore>

const PMContext = createContext<PMStoreAPI | undefined>(undefined)

export function PMContextProvider(props: { children: ReactNode }) {
    const ndk = useNDKStore(state => state.ndk)
    const user = useNDKStore(state => state.user)
    const subscribeAndHandle = useSubscribe()
    const subscriptionRef = useRef<NDKSubscription>()

    const storeAPI = useRef<PMStoreAPI>()

    if (!storeAPI.current) {
        storeAPI.current = createPMStore()
    }

    const store = useStore(storeAPI.current)

    useEffect(() => {
        if (!subscriptionRef.current && ndk && user && store) {
            subscriptionRef.current = subscribeAndHandle(
                [
                    { kinds: [NDKKind.EncryptedDirectMessage], authors: [user.pubkey] },
                    { kinds: [NDKKind.EncryptedDirectMessage], "#p": [user.pubkey] },
                ],
                e => store.handleNewPM(e, user),
                { closeOnEose: false }
            )
        }
    }, [ndk, user])

    return <PMContext.Provider value={storeAPI.current}>{props.children}</PMContext.Provider>
}

export default function usePMStore<T>(selector: (store: PMStoreType) => T): T {
    const PMStoreContext = useContext(PMContext)

    if (!PMStoreContext) {
        throw new Error(`usePMStore must be used within a Context Provider`)
    }

    return useStore(PMStoreContext, selector)
}
