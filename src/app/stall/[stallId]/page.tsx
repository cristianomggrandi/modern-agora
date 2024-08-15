"use client"

import AuctionCard from "@/app/components/AuctionCard"
import ProductCard from "@/app/components/ProductCard"
import useAuctions from "@/hooks/useAuctions"
import useProducts from "@/hooks/useProducts"
import useStall from "@/hooks/useStall"
import { useState } from "react"

export default function Stall(props: { params: { stallId: string } }) {
    const stall = useStall(props.params.stallId)
    // TODO: Change to useProductsByStall hook
    const { productsByStall } = useProducts()
    const { auctionsByStall } = useAuctions()
    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)
    const [numberOfAuctionsToShow, setNumberOfAuctionsToShow] = useState(24)

    // const [productOrAuction, setProductOrAuction] = useState(true)
    // const toggleProductOrAuction = () => setProductOrAuction(p => !p)

    if (!stall) return <div>Loading...</div>

    const products = productsByStall.get(stall.content.id)
    const auctions = auctionsByStall.get(stall.content.id)

    const onProductView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => p + 24)
    }
    const onAuctionView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfAuctionsToShow(p => p + 24)
    }
    console.log("teste", products?.length, auctions?.length)

    return (
        <main className="flex flex-col justify-center p-6 sm:p-[4%] gap-8 min-h-full">
            {/* TODO: Check if spacing is fine */}
            <div className="flex flex-col gap-2">
                <h1 className="text-xl sm:text-2xl neon-text-2lg font-semibold text-center">{stall.content.name}</h1>
                <h2 className="sm:text-lg neon-text-sm text-center">{stall.content.description}</h2>
            </div>
            {/* {auctions?.length && products?.length ? <button onClick={toggleProductOrAuction}>Change</button> : null} */}
            {products?.length ? (
                <div>
                    {auctions?.length ? <h3 className="text-2xl sm:text-2xl neon-text-sm mb-2 text-center">Products</h3> : null}
                    <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                        {products.slice(0, numberOfProductsToShow).map((product, i, array) => (
                            <ProductCard key={product.id} product={product} isLastProduct={i === array.length - 1} onView={onProductView} />
                        ))}
                    </div>
                </div>
            ) : null}
            {auctions?.length ? (
                <div>
                    {products?.length ? <h3 className="text-2xl sm:text-2xl neon-text-sm mb-2 text-center">Auctions</h3> : null}
                    <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6 rounded-lg">
                        {auctions.slice(0, numberOfAuctionsToShow).map((auction, i, array) => (
                            <AuctionCard key={auction.id} auction={auction} isLastAuction={i === array.length - 1} onView={onAuctionView} />
                        ))}
                    </div>
                </div>
            ) : null}
        </main>
    )
}
