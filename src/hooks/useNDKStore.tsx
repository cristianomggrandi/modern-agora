"use client"

import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKSubscription, NDKSubscriptionOptions, NDKUser } from "@nostr-dev-kit/ndk"
import { create } from "zustand"
import { addContentToProductEvent, NDKParsedProductEvent } from "./useNDK"

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
    ndk: NDK
    setNDK: (ndk: NDK) => void
    user?: NDKUser
    loginWithNIP07: () => void

    subscribeAndHandle: (
        filters: NDKFilter | NDKFilter[],
        handler: (event: NDKEvent) => void,
        opts?: NDKSubscriptionOptions
    ) => NDKSubscription | undefined

    products: NDKParsedProductEvent[]
    productsTemp: NDKParsedProductEvent[]
    subscriptionToProducts: NDKSubscription | undefined
    // isSubscribedToProducts: boolean
    subscribeToProducts: () => void
    unSubscribeToProducts: () => void

    // productsByStall: Map<string, NDKParsedProductEvent[]>
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
    setNDK: ndk => set({ ndk }),
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

    subscribeAndHandle: (filters, handler?, opts?) => {
        if (!ndk) return

        const sub = ndk.subscribe(filters, opts)

        if (handler) sub.on("event", handler)

        sub.on("eose", () => {
            console.log("CHEGOU NO EOSE")
        })

        return sub
    },

    products: [],
    productsTemp: [],
    subscriptionToProducts: undefined,
    subscribeToProducts: () => {
        if (get().subscriptionToProducts) return

        set({
            subscriptionToProducts: get().subscribeAndHandle(
                { kinds: [NDKKind.MarketProduct] },
                (productEvent: NDKEvent) => {
                    try {
                        const parsedProduct = addContentToProductEvent(productEvent)

                        if (!parsedProduct) return

                        set(prev => ({ productsTemp: [...prev.productsTemp, parsedProduct] }))

                        // fetchedProducts.current.push(parsedProduct)
                        // addProductToStall(parsedProduct, productsByStall.current)
                    } catch (error) {}
                },
                { closeOnEose: true }
            ),
        })

        const productsInterval = setInterval(() => {
            set({ products: get().productsTemp })

            if (get().products === get().productsTemp) {
                clearInterval(productsInterval)
                get().unSubscribeToProducts()
            }
        }, 1000)
    },
    unSubscribeToProducts: () => get().subscriptionToProducts?.stop(),
}))

export default useNDKStore
