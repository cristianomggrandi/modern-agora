"use client"

import { NDKParsedProductEvent, addContentToProductEvent, orderProducts, subscribeAndHandle } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SyntheticEvent, useEffect, useRef, useState } from "react"
import SearchField from "../components/SearchField"

const ProductCard = ({ event }: { event: NDKParsedProductEvent }) => {
    if (!event.content) return null

    return (
        <Link
            className="max-w-52 relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
            href={"/product/" + event.content.id}
        >
            <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                <div
                    className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: event.content.images ? `url(${event.content.images[0]})` : undefined }}
                />
                {event.content.images?.length ? (
                    <img
                        className="z-10 max-h-full max-w-full"
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
}

const filterProductsWithSearch = (products: NDKParsedProductEvent[], search: string) => {
    const formattedSearch = search.toLocaleLowerCase()

    return products.filter(p => {
        const compareString = (p.content.name + (p.content.description ?? "")).toLocaleLowerCase()

        return compareString.includes(formattedSearch)
    })
}

export default function Products() {
    const [products, setProducts] = useState<NDKParsedProductEvent[]>([])
    const fetchedProducts = useRef<NDKParsedProductEvent[]>([])

    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get("search") ?? "")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

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

    return (
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex justify-end">
                <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
            </div>
            <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] auto-rows-min gap-6 rounded-lg">
                {/* TODO: Limit amount of products and show button for "Show More" on the bottom with grandient (transparent on top and filled on the bottom) */}
                {(search ? filterProductsWithSearch(products, search) : products).slice(0, 12).map(event => (
                    <ProductCard key={event.id} event={event} />
                ))}
            </div>
        </main>
    )
}
