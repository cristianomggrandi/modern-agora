"use client"

import { NDKParsedProductEvent } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
import Link from "next/link"
import LastItemWrapper from "../components/LastItemWrapper"

export default function ProductCard({
    product,
    isLastProduct,
    onView,
}: {
    product: NDKParsedProductEvent
    isLastProduct: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) {
    if (!product.content) return null

    return (
        <LastItemWrapper isLastItem={isLastProduct} onView={onView}>
            <Link
                className="w-full max-w-52 h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
                href={"/product/" + product.content.id}
            >
                <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                    <div
                        className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: product.content.images ? `url(${product.content.images[0]})` : undefined }}
                    />
                    {/* TODO: Expand image on mobile  */}
                    {product.content.images?.length ? (
                        <img
                            className="z-10 max-h-full max-w-full"
                            src={product.content.images[0]}
                            alt={product.content.name}
                            height={96}
                            // width={96}
                        />
                    ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <span className="line-clamp-2 text-sm font-semibold">{product.content.name}</span>
                    <span className="text-sm font-bold uppercase neon-text-sm text-right">
                        {nFormatter(product.content.price, 2)} {product.content.currency}
                    </span>
                </div>
            </Link>
        </LastItemWrapper>
    )
}
