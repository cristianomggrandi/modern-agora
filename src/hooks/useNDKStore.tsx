"use client"

import NDK, { NDKNip07Signer, NDKUser } from "@nostr-dev-kit/ndk"
import { create } from "zustand"

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

const ndk = window.nostr
    ? new NDK({
          explicitRelayUrls: defaultRelays,
          signer: new NDKNip07Signer(),
      })
    : new NDK({
          explicitRelayUrls: defaultRelays,
      })

ndk.connect().catch(error => console.error("ndk error connecting", error))

const useNDKStore = create<NDKStoreType>()((set, get) => ({
    ndk,
    setNDK: (ndk: NDK) => set({ ndk }),
    loginWithNIP07: () => {
        const ndk = get().ndk

        if (!ndk?.signer) throw new Error("No NDK NIP-07 Signer")

        ndk.signer.user().then(user => {
            if (!user.npub) throw new Error("Failed to fetch for your user")

            user.fetchProfile().then(userProfile => {
                if (!userProfile) throw new Error("User profile not found")

                set({ user })
            })
        })
    },
}))

export default useNDKStore
