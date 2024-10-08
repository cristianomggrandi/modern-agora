"use client"

import AuctionCard from "@/app/components/AuctionCard"
import ProductCard from "@/app/components/ProductCard"
import SearchField from "@/app/components/SearchField"
import { useAuctionsByStall } from "@/hooks/useAuctions"
import { useProductsByStall } from "@/hooks/useProducts"
import useStall from "@/hooks/useStall"
import { filterAuctionsWithSearch, filterProductsWithSearch } from "@/utils/functions"
import Link from "next/link"
import { SyntheticEvent, useEffect, useState } from "react"

export default function Stall(props: { params: { stallId: string } }) {
    const stall = useStall(props.params.stallId)
    const products = useProductsByStall(stall?.content.id)
    const auctions = useAuctionsByStall(stall?.content.id)

    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)
    const [numberOfAuctionsToShow, setNumberOfAuctionsToShow] = useState(24)

    const [completedSearch, setCompletedSearch] = useState(false)
    useEffect(() => {
        setTimeout(() => setCompletedSearch(true), 10000)
    }, [])

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    if (!stall) return <div>Loading...</div>

    const onProductView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => Math.min(p + 24, products?.length ?? 0))
    }
    const onAuctionView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfAuctionsToShow(p => Math.min(p + 24, auctions?.length ?? 0))
    }

    const hasProductsOrAuctions = products?.length || auctions?.length

    return (
        <main className="flex flex-col p-6 sm:p-[4%] gap-8 min-h-full">
            {/* TODO: Check if spacing is fine */}
            <div className="flex flex-col gap-2">
                <h1 className="text-xl sm:text-2xl neon-text-2lg font-semibold text-center">{stall.content.name}</h1>
                <h2 className="sm:text-lg neon-text-sm text-center break-words break-all">{stall.content.description}</h2>
            </div>
            <Link href={"/profile/" + stall.pubkey}>Check out more my profile</Link>
            {hasProductsOrAuctions ? (
                <div className="w-full flex justify-end mb-2">
                    <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
                </div>
            ) : null}
            {!hasProductsOrAuctions ? (
                <span className="text-2xl neon-text-sm flex-1 flex justify-center items-center">
                    {completedSearch ? "No products found" : "Loading products..."}
                </span>
            ) : null}
            {products?.length ? (
                <div>
                    {auctions?.length ? <h3 className="text-2xl sm:text-2xl neon-text-sm mb-2 text-center">Products</h3> : null}
                    <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                        {(search ? filterProductsWithSearch(products, search) : products)
                            .slice(0, numberOfProductsToShow)
                            .map((product, i, array) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isLastProduct={i === array.length - 1}
                                    onView={onProductView}
                                />
                            ))}
                    </div>
                </div>
            ) : null}
            {auctions?.length ? (
                <div>
                    {products?.length ? <h3 className="text-2xl sm:text-2xl neon-text-sm mb-2 text-center">Auctions</h3> : null}
                    <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                        {(search ? filterAuctionsWithSearch(auctions, search) : auctions)
                            .slice(0, numberOfAuctionsToShow)
                            .map((auction, i, array) => (
                                <AuctionCard
                                    key={auction.id}
                                    auction={auction}
                                    isLastAuction={i === array.length - 1}
                                    onView={onAuctionView}
                                />
                            ))}
                    </div>
                </div>
            ) : null}
        </main>
    )
}
