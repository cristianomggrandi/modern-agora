"use client"

import NDK, { NDKNip07Signer, NDKUser } from "@nostr-dev-kit/ndk"
import { createContext, ReactNode, useContext, useEffect, useRef } from "react"
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

const defaultRelays = [
    "wss://relay.damus.io",
    "wss://relay.nostr.bg",
    "wss://nostr.mom",
    "wss://nos.lol",
    "wss://nostr.bitcoiner.social",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.wine",
    "wss://eden.nostr.land",
    // TODO: Seems to be paid (https://orangepill.dev/)
    // "wss://relay.orangepill.dev",
    "wss://puravida.nostr.land",
    "wss://relay.nostr.com.au",
    "wss://nostr.inosta.cc",
]

type NDKStoreType = {
    ndk?: NDK
    setNDK: (ndk: NDK) => void
    user?: NDKUser
    loginWithNIP07: () => void
}

const createNDKStore = () =>
    createStore<NDKStoreType>()(set => ({
        setNDK: (ndk: NDK) => set({ ndk }),
        loginWithNIP07: () => {
            set(prev => {
                const ndk = prev.ndk

                if (!ndk?.signer) throw new Error("No NDK NIP-07 Signer")

                ndk.signer.user().then(user => {
                    if (!user.npub) throw new Error("Failed to fetch for your user")

                    user.fetchProfile().then(userProfile => {
                        if (!userProfile) throw new Error("User profile not found")

                        set({ user })
                    })
                })

                return {}
            })
        },
    }))

type NDKStoreAPI = ReturnType<typeof createNDKStore>

const NDKContext = createContext<NDKStoreAPI | undefined>(undefined)

export function NDKContextProvider({ children }: { children: ReactNode }) {
    const storeAPI = useRef<NDKStoreAPI>()

    if (!storeAPI.current) {
        storeAPI.current = createNDKStore()
    }

    const store = useStore(storeAPI.current)

    useEffect(() => {
        if (store) {
            const ndk = window.nostr
                ? new NDK({
                      explicitRelayUrls: defaultRelays,
                      signer: new NDKNip07Signer(),
                  })
                : new NDK({
                      explicitRelayUrls: defaultRelays,
                  })

            ndk.connect()
                .then(() => store.loginWithNIP07())
                .catch(error => console.error("ndk error connecting", error))

            store.setNDK(ndk)
        }
    }, [])

    return <NDKContext.Provider value={storeAPI.current}>{children}</NDKContext.Provider>
}

export default function useNDKStore<T>(selector: (store: NDKStoreType) => T): T {
    const NDKStoreContext = useContext(NDKContext)

    if (!NDKStoreContext) {
        throw new Error(`usePMStore must be used within a Context Provider`)
    }

    return useStore(NDKStoreContext, selector)
}
