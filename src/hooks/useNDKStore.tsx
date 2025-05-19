"use client"

import {
    addContentToAuctionEvent,
    addContentToProductEvent,
    addContentToStallEvent,
    getAuctionEndDate,
    NDKParsedAuctionEvent,
    NDKParsedPMEvent,
    NDKParsedProductEvent,
    NDKParsedStallEvent,
} from "@/utils/ndk"
import NDK, {
    NDKEvent,
    NDKFilter,
    NDKKind,
    NDKNip07Signer,
    NDKSubscription,
    NDKSubscriptionOptions,
    NDKTag,
    NDKUser,
} from "@nostr-dev-kit/ndk"
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

    publishEvent: ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => void
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

    messages: NDKParsedPMEvent[]
    messagesTemp: NDKParsedPMEvent[]
    messagesByPubkey: Map<string, NDKParsedPMEvent[]>
    subscriptionToMessages: NDKSubscription | undefined
    handleNewPM: (e: NDKParsedPMEvent, user: NDKUser) => Promise<void>
    subscribeToMessages: () => void
    unSubscribeToMessages: () => void
}

let ndk: NDK | undefined = undefined

try {
    ndk = window.nostr
        ? new NDK({
              explicitRelayUrls: defaultRelays,
              signer: new NDKNip07Signer(),
          })
        : new NDK({
              explicitRelayUrls: defaultRelays,
          })
} catch (error) {}

ndk?.connect().catch(error => console.error("ndk error connecting", error))

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

    publishEvent: ({ content, kind, tags }: { content: string; kind: NDKKind; tags: NDKTag[] }) => {
        const ndkEvent = new NDKEvent(get().ndk)

        ndkEvent.content = content
        ndkEvent.kind = kind
        ndkEvent.tags = tags
        ndkEvent.publish()
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

    messages: [],
    messagesTemp: [],
    messagesByPubkey: new Map(),
    subscriptionToMessages: undefined,
    handleNewPM: async (e: NDKParsedPMEvent, user: NDKUser) => {
        if (!e.created_at) return

        // TODO: Parse sales and other events
        // const parsedPM = addContentToPMEvent(auctionEvent)
        const isSentByUser = e.pubkey === user!.pubkey
        // if (!messageTargetPubkey) {
        console.log("error:", e)
        // return
        // }
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
    subscribeToMessages: () => {
        const user = get().user

        if (get().subscriptionToMessages || !user) return

        set({
            subscriptionToMessages: get().subscribeAndHandle(
                [
                    { kinds: [NDKKind.EncryptedDirectMessage], authors: [user.pubkey] },
                    { kinds: [NDKKind.EncryptedDirectMessage], "#p": [user.pubkey] },
                ],
                e => get().handleNewPM(e, user),
                { closeOnEose: false }
            ),
        })

        const startTime = Date.now()

        const messagesInterval = setInterval(() => {
            set({ messages: get().messagesTemp })

            if (Date.now() > startTime + 15000 && get().messages === get().messagesTemp) {
                clearInterval(messagesInterval)
                get().unSubscribeToMessages()
            }
        }, 1000)
    },
    unSubscribeToMessages: () => get().subscriptionToMessages?.stop(),
}))

export default useNDKStore
