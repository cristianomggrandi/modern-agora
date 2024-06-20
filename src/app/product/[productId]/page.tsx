"use client"

import { ndk, useProducts, useStalls } from "@/hooks/useNDK"
import { NDKCheckoutContent, parseDescription } from "@/utils/ndk"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useRef, useState } from "react"

function ParsedDescription({ description }: { description: string | undefined }) {
    if (!description) return null

    const parsedDescription = parseDescription(description).split("\n")

    return (
        // TODO: Create scroller for description (http://localhost:3000/product/90cb2433-6d75-468b-b0b6-7d40ac209bc7)
        <div className="flex-1 justify-center text-justify flex flex-col gap-1">
            {parsedDescription.map((desc, i) => (
                <p key={i} className="neon-text-sm">
                    {desc}
                </p>
            ))}
        </div>
    )
}

function sendBid(e: React.FormEvent<HTMLFormElement>, auctionId: string) {
    e.preventDefault()

    const target = e.currentTarget

    const bid = target.bid.value

    if (!bid) return

    const ndkEvent = new NDKEvent(ndk)

    ndkEvent.kind = 1021 as NDKKind
    ndkEvent.content = bid
    ndkEvent.tags = [["e", auctionId]]
    ndkEvent.publish()
}

const handleBuy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const target = e.currentTarget

    const ndkEvent = new NDKEvent(ndk)

    const pubkey = await window.nostr?.getPublicKey()

    if (!pubkey) throw new Error("Pubkey not found!")

    if (!target.shipping.value) throw new Error("Please, select a shipping option")

    const eventContent: NDKCheckoutContent = {
        type: 0,
        id: "teste",
        name: target.customer.value,
        address: target.address.value,
        message: target.message.value,
        contact: {
            nostr: pubkey,
            phone: target.phone.value,
            email: target.email.value,
        },
        items: [
            {
                product_id: target.product.value,
                quantity: 1, // TODO: Add field
            },
        ],
        shipping_id: target.shipping.value,
    }

    ndkEvent.kind = NDKKind.EncryptedDirectMessage
    ndkEvent.content = JSON.stringify(eventContent)
    ndkEvent.tags = [["p", target.merchant.value]]
    ndkEvent.publish()
}

export default function Product(props: { params: { productId: string } }) {
    const products = useProducts()
    const stalls = useStalls()

    const [imageIndex, setImageIndex] = useState(0)
    const modalRef = useRef<HTMLDialogElement>(null)

    const product = products.find(a => a.content.id === props.params.productId)

    if (!product) return <div>Loading...</div>

    const stall = stalls.get(product.content.stall_id)

    if (!stall) return <div>Loading...</div>

    const nextImage = () => (product.content.images ? setImageIndex(prev => (prev + 1) % product.content.images!.length) : 0)
    const prevImage = () => (product.content.images ? setImageIndex(prev => (prev > 0 ? prev - 1 : product.content.images!.length - 1)) : 0)

    const openModal = () => modalRef.current?.showModal()
    const closeModal = () => modalRef.current?.close()

    return (
        <main className="flex flex-col justify-center p-6 sm:p-[4%] gap-8 min-h-full">
            <h1 className="text-lg sm:text-2xl neon-text-2lg font-semibold text-center">{product.content.name}</h1>
            <div className="flex flex-col-reverse md:flex-row items-center sm:items-stretch justify-center gap-8">
                <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-center gap-4">
                    <div className="flex md:flex-col gap-2 justify-center">
                        {product.content.images?.length! > 1
                            ? product.content.images!.map((img, index) => (
                                  <div
                                      className="h-12 w-12 border border-nostr shadow-nostr shadow rounded overflow-hidden flex items-center cursor-pointer"
                                      onClick={() => setImageIndex(index)}
                                      key={index}
                                  >
                                      <img src={img} alt={"Image " + index} height={48} width={48} />
                                  </div>
                              ))
                            : null}
                    </div>
                    <div className="flex w-[90%] md:h-96 items-center justify-center relative">
                        {product.content.images ? (
                            <>
                                <div className="border border-nostr bg-center shadow-md shadow-nostr">
                                    <img
                                        src={product.content.images[imageIndex]}
                                        alt={product.content.name}
                                        className="max-w-full max-h-96"
                                    />
                                </div>
                                {product.content.images?.length > 1 ? (
                                    <>
                                        <button
                                            className="absolute top-1/2 left-0 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                            onClick={prevImage}
                                        >
                                            {"<"}
                                        </button>
                                        <button
                                            className="absolute top-1/2 right-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                            onClick={nextImage}
                                        >
                                            {">"}
                                        </button>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            "No images"
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between gap-6">
                    <ParsedDescription description={product.content.description} />
                    <div>
                        {product.content.price} {product.content.currency}
                    </div>
                    <button onClick={openModal} className="p-2 rounded bg-nostr shadow-nostr text-white uppercase font-semibold">
                        Buy Product
                    </button>
                </div>
            </div>
            <dialog
                ref={modalRef}
                className="h-full sm:h-fit w-full sm:max-w-[36rem] bg-black text-white border sm:border-none border-nostr shadow sm:shadow-none shadow-nostr rounded-xl sm:backdrop:bg-gradient-radial backdrop:from-nostr backdrop:to-80%"
            >
                <form
                    onSubmit={handleBuy}
                    method="dialog"
                    className="h-full p-[5%] flex gap-6 flex-col sm:flex-row sm:flex-wrap sm:justify-between text-black"
                >
                    <input hidden name="product" value={product.content.id} />
                    <input hidden name="merchant" value={stall.pubkey} />
                    <div className="flex flex-col flex-1">
                        <label className="text-white" htmlFor="customer">
                            Name
                        </label>
                        <input className="rounded" type="text" id="customer" name="customer" placeholder="Optional" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className="text-white" htmlFor="address">
                            Address
                        </label>
                        <input className="rounded" type="text" id="address" name="address" placeholder="Required for physical goods" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className="text-white" htmlFor="phone">
                            Phone number
                        </label>
                        <input className="rounded" type="text" id="phone" name="phone" placeholder="Optional" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className="text-white" htmlFor="email">
                            E-mail
                        </label>
                        <input className="rounded" type="email" id="email" name="email" placeholder="Optional" />
                    </div>
                    <div className="flex flex-col flex-1 max-w-full">
                        <label className="text-white" htmlFor="shipping">
                            Shipping Option
                        </label>
                        <select className="rounded" id="shipping" name="shipping">
                            <option disabled selected value="">
                                Select a shipping option
                            </option>
                            {stall.content.shipping
                                .filter(s => product.content.shipping.find(ps => ps.id === s.id))
                                .map(shipping => (
                                    <option value={shipping.id}>
                                        {shipping.regions.join(", ") ?? shipping.id} - {shipping.cost} {stall.content.currency}{" "}
                                        {"(" + (shipping.name ?? shipping.id) + ")"}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="flex flex-col flex-1 sm:basis-full">
                        <label className="text-white" htmlFor="message">
                            Message
                        </label>
                        <textarea
                            className="rounded"
                            id="message"
                            name="message"
                            rows={5}
                            placeholder="Message to the merchant (optional)"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row-reverse flex-wrap gap-4 flex-1 justify-end basis-full">
                        <button
                            type="submit"
                            className="sm:flex-1 p-2 rounded bg-nostr shadow shadow-nostr text-white uppercase font-semibold"
                        >
                            Buy
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
        </main>
    )
}
