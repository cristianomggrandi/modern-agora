"use client"

import {
    addContentToAuctionEvent,
    addContentToProductEvent,
    addContentToStallEvent,
    getAuctionEndDate,
    NDKParsedAuctionEvent,
    NDKParsedProductEvent,
    NDKParsedStallEvent,
} from "@/utils/ndk"
import NDK, { NDKEvent, NDKFilter, NDKKind, NDKNip07Signer, NDKSubscription, NDKSubscriptionOptions, NDKUser } from "@nostr-dev-kit/ndk"
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
    productsByStall: Map<string, NDKParsedProductEvent[]>
    subscriptionToProducts: NDKSubscription | undefined
    subscribeToProducts: () => void
    unSubscribeToProducts: () => void

    auctions: NDKParsedAuctionEvent[]
    auctionsTemp: NDKParsedAuctionEvent[]
    auctionsByStall: Map<string, NDKParsedAuctionEvent[]>
    subscriptionToAuctions: NDKSubscription | undefined
    subscribeToAuctions: () => void
    unSubscribeToAuctions: () => void

    stalls: NDKParsedStallEvent[]
    stallsTemp: NDKParsedStallEvent[]
    subscriptionToStalls: NDKSubscription | undefined
    subscribeToStalls: () => void
    unSubscribeToStalls: () => void
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

const orderAuctions = (event: NDKParsedAuctionEvent, prev: NDKParsedAuctionEvent[]) => {
    if (!event.content) return prev

    const newFinishDate = getAuctionEndDate(event)

    // TODO: Toggle to get only active auctions
    // if (newFinishDate < currentDate) return prev

    for (let i = 0; i < prev.length; i++) {
        const currFinishDate = getAuctionEndDate(prev[i])

        if (newFinishDate > currFinishDate) {
            prev.splice(i, 0, event)
            return [...prev]
        }
    }

    return [...prev, event]
}

const addProductToStall = (productEvent: NDKParsedProductEvent, productsByStall: Map<string, NDKParsedProductEvent[]>) => {
    const stallProducts = productsByStall.get(productEvent.content.stall_id) ?? []

    stallProducts.push(productEvent)

    productsByStall.set(productEvent.content.stall_id, stallProducts)
}

const addAuctionToStall = (auctionEvent: NDKParsedAuctionEvent, auctionsByStall: Map<string, NDKParsedAuctionEvent[]>) => {
    const stallAuctions = auctionsByStall.get(auctionEvent.content.stall_id) ?? []

    stallAuctions.push(auctionEvent)

    auctionsByStall.set(auctionEvent.content.stall_id, stallAuctions)
}

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
    productsByStall: new Map(),
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

                        addProductToStall(parsedProduct, get().productsByStall)
                    } catch (error) {}
                },
                { closeOnEose: true }
            ),
        })

        const startTime = Date.now()

        const productsInterval = setInterval(() => {
            set({ products: get().productsTemp })

            if (Date.now() > startTime + 15000 && get().products === get().productsTemp) {
                clearInterval(productsInterval)
                get().unSubscribeToProducts()
            }
        }, 1000)
    },
    unSubscribeToProducts: () => get().subscriptionToProducts?.stop(),

    auctions: [],
    auctionsTemp: [],
    auctionsByStall: new Map(),
    subscriptionToAuctions: undefined,
    subscribeToAuctions: () => {
        if (get().subscriptionToAuctions) return

        set({
            subscriptionToAuctions: get().subscribeAndHandle(
                { kinds: [30020 as NDKKind] },
                (auctionEvent: NDKEvent) => {
                    try {
                        const parsedAuction = addContentToAuctionEvent(auctionEvent)

                        if (!parsedAuction) return

                        set(prev => ({ auctionsTemp: orderAuctions(parsedAuction, prev.auctionsTemp) }))

                        addAuctionToStall(parsedAuction, get().auctionsByStall)
                    } catch (error) {}
                },
                { closeOnEose: true }
            ),
        })

        const startTime = Date.now()

        const auctionsInterval = setInterval(() => {
            set({ auctions: get().auctionsTemp })

            if (Date.now() > startTime + 15000 && get().auctions === get().auctionsTemp) {
                clearInterval(auctionsInterval)
                get().unSubscribeToAuctions()
            }
        }, 1000)
    },
    unSubscribeToAuctions: () => get().subscriptionToAuctions?.stop(),

    stalls: [],
    stallsTemp: [],
    subscriptionToStalls: undefined,
    subscribeToStalls: () => {
        if (get().subscriptionToStalls) return

        set({
            subscriptionToStalls: get().subscribeAndHandle(
                { kinds: [NDKKind.MarketStall] },
                (stallEvent: NDKEvent) => {
                    try {
                        const parsedStall = addContentToStallEvent(stallEvent)

                        if (!parsedStall) return

                        set(prev => ({ stallsTemp: [...prev.stallsTemp, parsedStall] }))
                    } catch (error) {}
                },
                { closeOnEose: true }
            ),
        })

        const startTime = Date.now()

        const stallsInterval = setInterval(() => {
            set({ stalls: get().stallsTemp })

            if (Date.now() > startTime + 15000 && get().stalls === get().stallsTemp) {
                clearInterval(stallsInterval)
                get().unSubscribeToStalls()
            }
        }, 1000)
    },
    unSubscribeToStalls: () => get().subscriptionToStalls?.stop(),
}))

export default useNDKStore
