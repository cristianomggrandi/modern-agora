"use client"

import ParsedDescription from "@/app/components/ParsedDescription"
import ProductImages from "@/app/components/ProductImages"
import ProductTags from "@/app/components/ProductTags"
import useNDK from "@/hooks/useNDK"
import useProduct from "@/hooks/useProduct"
import useStall from "@/hooks/useStall"
import { NDKCheckoutContent } from "@/utils/ndk"
import NDK, { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { useRef } from "react"
import { v4 as uuidv4 } from "uuid"

const handleBuy = async (e: React.FormEvent<HTMLFormElement>, ndk?: NDK) => {
    // TODO: Move to NDKContext
    e.preventDefault()

    if (!ndk) return

    const target = e.currentTarget

    const ndkEvent = new NDKEvent(ndk)

    const pubkey = await window.nostr?.getPublicKey()

    if (!pubkey) throw new Error("Pubkey not found!")

    if (!target.shipping.value) throw new Error("Please, select a shipping option")

    const eventContent: NDKCheckoutContent = {
        type: 0,
        id: uuidv4(),
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
    const ndk = useNDK()
    const product = useProduct(props.params.productId)
    const stall = useStall(product?.content.stall_id)

    const modalRef = useRef<HTMLDialogElement>(null)

    if (!product) return <div>Loading...</div>

    const openModal = () => modalRef.current?.showModal()
    const closeModal = () => modalRef.current?.close()

    return (
        <main className="flex flex-col justify-center p-6 sm:p-[4%] gap-8 min-h-full">
            <h1 className="text-xl sm:text-2xl neon-text-2lg font-semibold text-center">{product.content.name}</h1>
            <div className="product-details grid gap-8">
                <ProductImages images={product.content.images} name={product.content.name} />
                <ParsedDescription description={product.content.description} />
                <ProductTags tags={product.tags} />
                <div className="product-price-buy text-nowrap flex flex-wrap gap-4">
                    <Link
                        href={stall ? `/stall/${stall?.content.id}` : ""}
                        className="flex-1 text-center px-4 bg-white text-nostr uppercase font-semibold rounded py-1 sm:py-2"
                    >
                        Checkout stall
                    </Link>
                    <span className="flex-1 text-center px-4 bg-white text-nostr uppercase font-semibold rounded py-1 sm:py-2">
                        {product.content.price} {product.content.currency}
                    </span>
                    <button
                        onClick={openModal}
                        disabled={!stall}
                        className={`flex-1 basis-48 p-1 sm:p-2 rounded bg-nostr shadow-nostr text-white uppercase font-semibold ${
                            stall ? "" : "opacity-50"
                        }`}
                    >
                        Buy
                    </button>
                </div>
            </div>
            {stall ? (
                <dialog
                    ref={modalRef}
                    className="h-full sm:h-fit w-full sm:max-w-[36rem] bg-black text-white border sm:border-none border-nostr shadow sm:shadow-none shadow-nostr rounded-xl sm:backdrop:bg-gradient-radial backdrop:from-nostr backdrop:to-80%"
                >
                    <form
                        onSubmit={e => handleBuy(e, ndk)}
                        method="dialog"
                        className="h-full p-[5%] flex gap-6 flex-col sm:flex-row sm:flex-wrap sm:justify-between text-black"
                    >
                        <input hidden readOnly name="product" value={product.content.id} />
                        <input hidden readOnly name="merchant" value={stall.pubkey} />
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
                                        <option key={shipping.id} value={shipping.id}>
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
            ) : null}
        </main>
    )
}
