"use client"

import useNDK, { NDKParsedProductEvent } from "@/hooks/useNDK"
import useProducts from "@/hooks/useProducts"
import { nFormatter, setCookie } from "@/utils/functions"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { ReactNode, SyntheticEvent, useState } from "react"
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
    product,
    isLastProduct,
    onView,
}: {
    product: NDKParsedProductEvent
    isLastProduct: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    if (!product.content) return null

    return (
        <LastProductWrapper isLastProduct={isLastProduct} onView={onView}>
            <Link
                className="w-full max-w-52 h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
                href={"/product/" + product.content.id}
                onClick={() => {
                    const originalEvent = { ...product, content: JSON.stringify(product.content) }
                    setCookie(product.content.id, (originalEvent as NDKEvent).serialize(), 0.05)
                }}
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
    const ndk = useNDK()

    const products = useProducts()
    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => p + 24)
    }

    return (
        // TODO: Create a way to search/filter by tag
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex justify-end">
                <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
            </div>
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                {/* TODO: Create a onView to revert the maximum number of products shown */}
                {(search ? filterProductsWithSearch(products, search) : products)
                    .slice(0, numberOfProductsToShow)
                    .map((product, i, array) => {
                        return <ProductCard key={product.id} product={product} isLastProduct={i === array.length - 1} onView={onView} />
                    })}
            </div>
        </main>
    )
}
