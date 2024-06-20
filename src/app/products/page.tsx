"use client"

import { NDKParsedProductEvent, useProducts, useStalls } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
import Link from "next/link"
import { useState } from "react"
import PagesOptions from "../components/PagesOptions"

const ProductCard = ({ event }: { event: NDKParsedProductEvent }) => {
    if (!event.content) return null

    return (
        <Link
            className="flex flex-col gap-2 md:gap-0 p-1 md:p-0 md:flex-row md:w-auto justify-center md:divide-x divide-nostr border md:border-x-0 md:first:border-none border-nostr rounded-lg md:rounded-none *:px-1 md:*:px-3"
            href={"/product/" + event.content.id}
        >
            <div className="h-24 w-full md:w-24 flex-shrink-0 flex items-center justify-center md:p-2">
                {event.content.images?.length ? (
                    <img
                        className="max-h-24 max-w-full md:max-w-20 md:max-h-20 rounded"
                        src={event.content.images[0]}
                        alt={event.content.name}
                        height={96}
                        // width={96}
                    />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between md:justify-around">
                <span className="line-clamp-2 font-semibold">{event.content.name}</span>
                <span className="line-clamp-3 md:line-clamp-2 text-sm">{event.content.description}</span>
            </div>
            <div className="flex md:flex-col justify-end items-center md:justify-around md:w-28">
                <span className="font-bold uppercase neon-text-sm">
                    {nFormatter(event.content.price, 2)} {event.content.currency}
                </span>
            </div>
        </Link>
    )
}

const ITEMS_PER_PAGE = 5

export default function Products() {
    const products = useProducts()
    const stalls = useStalls()

    const productsWithStalls = products.filter(p => stalls.get(p.content.stall_id))

    const [page, setPage] = useState(1)
    const pages = Array.from({ length: Math.floor(productsWithStalls.length / ITEMS_PER_PAGE) }, (v, i) => i + 1)
    const prevPage = () => setPage(prev => prev - 1)
    const nextPage = () => setPage(prev => prev + 1)

    return (
        <main className="flex flex-col items-center justify-center p-8 md:p-12">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 md:gap-0 md:block md:divide-y divide-nostr md:border border-nostr shadow-nostr md:shadow-sm rounded-lg">
                {productsWithStalls.slice(ITEMS_PER_PAGE * (page - 1), ITEMS_PER_PAGE * page).map(event => (
                    <ProductCard key={event.id} event={event} />
                ))}
            </div>
            {productsWithStalls.length ? (
                <PagesOptions page={page} setPage={setPage} prevPage={prevPage} nextPage={nextPage} pages={pages} />
            ) : null}
        </main>
    )
}
