"use client"

import { NDKParsedProductEvent, addContentToProductEvent, orderProducts, subscribeAndHandle } from "@/hooks/useNDK"
import { nFormatter } from "@/utils/functions"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ReactNode, SyntheticEvent, useEffect, useRef, useState } from "react"
import { InView } from "react-intersection-observer"
import SearchField from "../components/SearchField"

const LastProductWrapper = ({
    children,
    isLastProduct,
    onView,
}: {
    children: ReactNode
    isLastProduct: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => (isLastProduct ? <InView onChange={onView}>{children}</InView> : <>{children}</>)

const ProductCard = ({
    event,
    isLastProduct,
    onView,
}: {
    event: NDKParsedProductEvent
    isLastProduct: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    if (!event.content) return null

    return (
        <LastProductWrapper isLastProduct={isLastProduct} onView={onView}>
            <Link
                className="max-w-52 h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
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
        </LastProductWrapper>
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
    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)

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

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => p + 24)
    }

    return (
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex justify-end">
                <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
            </div>
            <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] auto-rows-min gap-6 rounded-lg">
                {/* TODO: Limit amount of products and show button for "Show More" on the bottom with grandient (transparent on top and filled on the bottom) */}
                {(search ? filterProductsWithSearch(products, search) : products)
                    .slice(0, numberOfProductsToShow)
                    .map((event, i, array) => {
                        return <ProductCard key={event.id} event={event} isLastProduct={i === array.length - 1} onView={onView} />
                    })}
            </div>
        </main>
    )
}
