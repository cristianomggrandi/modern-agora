"use client"

import NDK, { NDKEvent, NDKFilter, NDKNip07Signer, NDKSubscriptionOptions } from "@nostr-dev-kit/ndk"
import { createContext, useContext } from "react"

type NDKContextType = {
    subscribeAndHandle: (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => void
}

const defaultRelays = [
    "wss://relay.damus.io",
    "wss://relay.nostr.bg",
    "wss://nostr.mom",
    "wss://nos.lol",
    "wss://nostr.bitcoiner.social",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.wine",
    "wss://eden.nostr.land",
    "wss://relay.orangepill.dev",
    "wss://puravida.nostr.land",
    "wss://relay.nostr.com.au",
    "wss://nostr.inosta.cc",
]

const nip07signer = new NDKNip07Signer()

const ndk = new NDK({
    explicitRelayUrls: defaultRelays,
    signer: nip07signer,
})

const subscribeAndHandle = (filter: NDKFilter, handler: (event: NDKEvent) => void, opts?: NDKSubscriptionOptions) => {
    const sub = ndk.subscribe(filter, opts)

    sub.on("event", (e: NDKEvent) => handler(e))
}

const NDKContext = createContext<NDKContextType | null>(null)

export function NDKContextProvider({ children }: { children: any }) {
    ndk.connect()
        .then(() => console.log("ndk connected"))
        .catch(error => console.log("ndk error connecting", error))

    return <NDKContext.Provider value={{ subscribeAndHandle }}>{children}</NDKContext.Provider>
}

export default function useNDK() {
    const context = useContext(NDKContext)

    if (!context) throw new Error("useNDK must be within a Context Provider")

    return context
}
