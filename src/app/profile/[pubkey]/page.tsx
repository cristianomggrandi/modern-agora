"use client"

import AuctionCard from "@/app/components/AuctionCard"
import ProductCard from "@/app/components/ProductCard"
import { useAuctionsByStall } from "@/hooks/useAuctions"
import { NDKParsedStallEvent, useUser } from "@/hooks/useNDK"
import { useProductsByStall } from "@/hooks/useProducts"
import { useStallsByUser } from "@/hooks/useStalls"
import useUserByPubkey from "@/hooks/useUserByPubkey"
import { generateRandomId } from "@/utils/functions"
import { faCopy, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { RefObject, useRef, useState } from "react"
import { z, ZodError } from "zod"

type ShippingInfoType = {
    id: string
    name: string
    cost: number
    regions: string[]
}

const stallShippingInfoParser = z.object({
    id: z.string(),
    name: z.string().optional(),
    cost: z.number().nonnegative(),
    regions: z.array(z.string()),
})

const stallParser = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    currency: z.string(),
    shipping: z.array(stallShippingInfoParser),
})

function UserStall({ stall }: { stall: NDKParsedStallEvent }) {
    const products = useProductsByStall(stall.content.id)
    const auctions = useAuctionsByStall(stall.content.id)

    return (
        <div>
            <span className="text-lg font-semibold neon-text-sm">{stall.content.name}</span>
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6">
                {products?.map(product => (
                    <ProductCard key={product.content.id} product={product} isLastProduct={false} />
                ))}
                {auctions?.map(auction => (
                    <AuctionCard key={auction.content.id} auction={auction} isLastAuction={false} />
                ))}
            </div>
        </div>
    )
}

function NewStallDialog(props: { modalRef: RefObject<HTMLDialogElement> }) {
    const closeModal = () => props.modalRef.current?.close()

    const [newStallShippingInfo, setNewStallShippingInfo] = useState<ShippingInfoType[]>([])

    const addShippingInfo = (newShippingInfo: ShippingInfoType) => {
        setNewStallShippingInfo(prev => [...prev, newShippingInfo])
    }

    const removeStallInfo = (index: number) => setNewStallShippingInfo(p => p.toSpliced(index, 1))

    const handleNewShippingInfo = (e: any) => {
        try {
            e.preventDefault()

            const id = e.target["shipping-id"].value
            const name = e.target["shipping-name"].value
            const cost = parseInt(e.target["shipping-cost"].value)
            const regions = e.target["shipping-regions"].value.split(",").map((region: string) => region.trim())

            if (newStallShippingInfo.findIndex(shippingInfo => shippingInfo.id === id) !== -1)
                throw new Error("Id of new shipping already registered")

            if (name && newStallShippingInfo.findIndex(shippingInfo => shippingInfo.name === name) !== -1)
                throw new Error("Name of new shipping already registered")

            const newShippingInfo: ShippingInfoType = {
                id,
                name: name ? name : undefined, // Undefined if the string is empty
                cost,
                regions,
            }

            stallShippingInfoParser.parse(newShippingInfo)

            addShippingInfo(newShippingInfo)

            e.target.reset()
        } catch (error) {
            if (error instanceof ZodError)
                error.issues.forEach(issue => {
                    const errorMessage = `${issue.message} (${issue.path[0]})`
                    throw new Error(errorMessage)
                })
            else throw error
        }
    }

    const handleNewStall = (e: any) => {
        try {
            e.preventDefault()

            const name = e.target["name"].value
            const id = e.target["id"].value
            const currency = e.target["currency"].value
            const description = e.target["description"].value
            const shipping = JSON.parse(e.target["shipping"].value)

            const newStall = {
                id,
                name,
                currency,
                description,
                shipping,
            }

            const parsedStall = stallParser.parse(newStall)

            console.log(parsedStall)

            e.target.reset()
            closeModal()
        } catch (error) {
            if (error instanceof ZodError)
                error.issues.forEach(issue => {
                    const errorMessage = `${issue.message} (${issue.path[0]})`
                    throw new Error(errorMessage)
                })
            else throw error
        }
    }

    return (
        <dialog
            ref={props.modalRef}
            className="h-full sm:h-fit w-full sm:max-w-[36rem] bg-black text-white border sm:border-none border-nostr shadow sm:shadow-none shadow-nostr rounded-xl sm:backdrop:bg-gradient-radial backdrop:from-nostr backdrop:to-80%"
        >
            <form onSubmit={handleNewShippingInfo} id="shipping-form" />
            <form
                onSubmit={handleNewStall}
                method="dialog"
                className="h-full p-[5%] flex gap-2 sm:gap-6 flex-col sm:flex-row sm:flex-wrap sm:justify-between text-black"
            >
                <input name="shipping" value={JSON.stringify(newStallShippingInfo)} className="hidden" />
                <div className="flex flex-col flex-1">
                    <label htmlFor="name" className="text-white">
                        Name
                    </label>
                    <input id="name" name="name" type="text" className="rounded" required />
                </div>
                <div className="flex flex-col flex-1">
                    <label htmlFor="currency" className="text-white">
                        Currency
                    </label>
                    <input id="currency" name="currency" type="text" className="rounded" required />
                </div>
                <div className="flex flex-col flex-1 basis-full">
                    <label htmlFor="description" className="text-white">
                        Description (optional)
                    </label>
                    <input id="description" name="description" type="text" className="rounded" />
                </div>
                <div className="flex flex-col flex-1 basis-full">
                    <label htmlFor="id" className="text-white">
                        Stall Id
                    </label>
                    <input id="id" name="id" type="text" className="rounded" required defaultValue={generateRandomId()} />
                </div>
                <div className="p-2 border-nostr border shadow shadow-nostr rounded-lg">
                    <div className="flex flex-col text-white">
                        {/* TODO: Allow removing and changing indexes */}
                        {newStallShippingInfo.map((info, index) => (
                            <div className="relative flex flex-col flex-1 mb-2 border border-nostr rounded px-1">
                                <span>
                                    {info.name ? info.name : info.id} - {info.cost}
                                </span>
                                <span>{info.regions.join(", ")}</span>
                                <FontAwesomeIcon icon={faXmark} onClick={() => removeStallInfo(index)} className="absolute top-1 right-1" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <label htmlFor="shipping-name" className="text-white text-sm">
                                    Name (optional)
                                </label>
                                <input
                                    id="shipping-name"
                                    form="shipping-form"
                                    name="shipping-name"
                                    type="text"
                                    className="bg-secondary rounded px-1"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="shipping-id" className="text-white text-sm">
                                    Id
                                </label>
                                <input
                                    id="shipping-id"
                                    form="shipping-form"
                                    name="shipping-id"
                                    type="text"
                                    className="bg-secondary rounded px-1"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="shipping-cost" className="text-white text-sm">
                                    Cost
                                </label>
                                <input
                                    id="shipping-cost"
                                    form="shipping-form"
                                    name="shipping-cost"
                                    type="number"
                                    className="bg-secondary rounded px-1"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="shipping-regions" className="text-white text-sm">
                                    Regions (separated by comma)
                                </label>
                                <input
                                    id="shipping-regions"
                                    form="shipping-form"
                                    name="shipping-regions"
                                    type="text"
                                    className="bg-secondary rounded px-1"
                                    required
                                    placeholder="USA, Canada, Mexico"
                                />
                            </div>
                        </div>
                        <button type="submit" form="shipping-form" className="flex-1 text-white bg-nostr p-1 rounded">
                            Add Shipping
                        </button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row-reverse flex-wrap gap-4 flex-1 justify-end basis-full">
                    <button type="submit" className="sm:flex-1 p-2 rounded bg-nostr shadow shadow-nostr text-white uppercase font-semibold">
                        Create
                    </button>
                    <button
                        onClick={closeModal}
                        type="button"
                        className="sm:flex-1 p-2 rounded shadow shadow-nostr text-nostr border border-nostr uppercase font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </dialog>
    )
}

export default function Profile(props: { params: { pubkey: string } }) {
    if (!props.params.pubkey) throw new Error("No pubkey found")

    const user = useUserByPubkey(props.params.pubkey)
    const stalls = useStallsByUser(props.params.pubkey)

    const connectedUser = useUser()

    const newStallModalRef = useRef<HTMLDialogElement>(null)
    const openNewStall = () => newStallModalRef.current?.showModal()

    const newProductModalRef = useRef<HTMLDialogElement>(null)
    const openNewProduct = () => newProductModalRef.current?.showModal()
    const closeNewProduct = () => newProductModalRef.current?.close()

    if (!user || !user.profile) return <span>Loading...</span>

    const displayName = user.profile.displayName ?? user.profile.name

    const isUsersProfile = connectedUser && connectedUser?.npub === user.npub

    return (
        <main className="p-8">
            <div className="grid grid-cols-[min-content,1fr] gap-y-6">
                {user.profile.image ? (
                    <div className="self-center sm:row-start-1 sm:row-end-4 h-32 max-h-[15vw] sm:max-h-[15vw] aspect-square mr-6">
                        <img src={user.profile.image} alt="" />
                    </div>
                ) : null}
                <span className="col-start-2 col-end-3 text-[5vw] sm:text-3xl neon-text-2lg">{displayName}</span>
                <span className="col-start-1 col-span-2 sm:col-start-2 sm:text-lg text-justify">{user?.profile?.about} </span>
                <span
                    className="col-start-1 col-span-2 sm:col-start-2 text-sm sm:text-base flex gap-2 truncate cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(user.npub)}
                >
                    <FontAwesomeIcon icon={faCopy} className="bg-nostr p-1 rounded-full" />
                    {user.npub}
                </span>
            </div>
            {isUsersProfile ? (
                <div className="flex flex-wrap gap-4 mt-8 w-full">
                    <button
                        className="flex-1 text-nowrap flex items-center justify-center gap-4 bg-nostr text-white uppercase font-semibold rounded px-6 py-2"
                        onClick={openNewStall}
                    >
                        <FontAwesomeIcon
                            icon={faPlus}
                            size="lg"
                            className="hidden sm:inline-block rounded-full text-nostr bg-white w-5 h-5 p-1"
                        />
                        Create Stall
                    </button>
                    <button className="flex-1 text-nowrap flex items-center justify-center gap-4 bg-nostr text-white uppercase font-semibold rounded px-6 py-2">
                        <FontAwesomeIcon
                            icon={faPlus}
                            size="lg"
                            className="hidden sm:inline-block rounded-full text-nostr bg-white w-5 h-5 p-1"
                        />
                        Create Product
                    </button>
                </div>
            ) : null}
            <div className="mt-8 flex flex-col gap-12">
                {stalls.map(stall => (
                    <UserStall key={stall.content.id} stall={stall} />
                ))}
            </div>
            <NewStallDialog modalRef={newStallModalRef} />
        </main>
    )
}
