"use client"

import { NDKParsedProductEvent, addContentToProductEvent, orderProducts, subscribeAndHandle } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import PagesOptions from "../components/PagesOptions"

const ProductCard = ({ event }: { event: NDKParsedProductEvent }) => {
    if (!event.content) return null

    return (
        <Link
            className="relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
            href={"/product/" + event.content.id}
        >
            <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                <div
                    className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: event.content.images ? `url(${event.content.images[0]})` : undefined }}
                />
                {event.content.images?.length ? (
                    <img
                        className="z-10 max-h-full max-w-full rounded"
                        src={event.content.images[0]}
                        alt={event.content.name}
                        height={96}
                        // width={96}
                    />
                ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <span className="line-clamp-2 text-sm font-semibold">{event.content.name}</span>
                <span className="text-sm font-bold uppercase neon-text-sm text-right">
                    {nFormatter(event.content.price, 2)} {event.content.currency}
                </span>
            </div>
        </Link>
    )

    // return (
    //     <Link
    //         className="flex flex-col gap-2 md:gap-0 p-1 md:p-0 md:flex-row md:w-auto justify-center md:divide-x divide-nostr border md:border-x-0 md:first:border-none border-nostr rounded-lg md:rounded-none *:px-1 md:*:px-3"
    //         href={"/product/" + event.content.id}
    //     >
    //         <div className="h-24 w-full md:w-24 flex-shrink-0 flex items-center justify-center md:p-2">
    //             {event.content.images?.length ? (
    //                 <img
    //                     className="max-h-24 max-w-full md:max-w-20 md:max-h-20 rounded"
    //                     src={event.content.images[0]}
    //                     alt={event.content.name}
    //                     height={96}
    //                     // width={96}
    //                 />
    //             ) : null}
    //         </div>
    //         <div className="flex-1 flex flex-col justify-between md:justify-around">
    //             <span className="line-clamp-2 font-semibold">{event.content.name}</span>
    //             <span className="line-clamp-3 md:line-clamp-2 text-sm">{event.content.description}</span>
    //         </div>
    //         <div className="flex md:flex-col justify-end items-center md:justify-around md:w-28">
    //             <span className="font-bold uppercase neon-text-sm">
    //                 {nFormatter(event.content.price, 2)} {event.content.currency}
    //             </span>
    //         </div>
    //     </Link>
    // )
}

const ITEMS_PER_PAGE = 12

export default function Products() {
    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const fetchedProducts = useRef<NDKParsedProductEvent[]>([])

    const updateFetchedProducts = (event: NDKEvent) => {
        fetchedProducts.current = !fetchedProducts.current.find(e => e.id === event.id)
            ? orderProducts(addContentToProductEvent(event), fetchedProducts.current)
            : fetchedProducts.current
    }

    useEffect(() => {
        subscribeAndHandle({ kinds: [NDKKind.MarketProduct] }, updateFetchedProducts)

        const productsInterval = setInterval(() => {
            setProducts(prev => {
                if (fetchedProducts.current === prev) clearInterval(productsInterval)

                return fetchedProducts.current
            })
        }, 1000)

        return () => {
            clearInterval(productsInterval)
        }
    }, [])

    const [page, setPage] = useState(1)
    const pages = Array.from({ length: Math.floor(products.length / ITEMS_PER_PAGE) }, (v, i) => i + 1)
    const prevPage = () => setPage(prev => prev - 1)
    const nextPage = () => setPage(prev => prev + 1)

    return (
        <main className="flex flex-col items-center justify-stretch p-4">
            <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-6 rounded-lg">
                {/* <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4 md:block md:divide-y divide-nostr md:border border-nostr shadow-nostr md:shadow-sm rounded-lg"> */}
                {products.slice(ITEMS_PER_PAGE * (page - 1), ITEMS_PER_PAGE * page).map(event => (
                    <ProductCard key={event.id} event={event} />
                ))}
            </div>
            {products.length ? <PagesOptions page={page} setPage={setPage} prevPage={prevPage} nextPage={nextPage} pages={pages} /> : null}
        </main>
    )
}
