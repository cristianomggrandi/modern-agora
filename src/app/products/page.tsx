"use client"

import useProducts from "@/hooks/useProducts"
import { filterProductsWithSearch } from "@/utils/functions"
import { SyntheticEvent, useState } from "react"
import ProductCard from "../components/ProductCard"
import SearchField from "../components/SearchField"

export default function Products() {
    const { products } = useProducts()
    const [numberOfProductsToShow, setNumberOfProductsToShow] = useState(24)

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfProductsToShow(p => Math.min(p + 24, products.length))
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
                    .map((product, i, array) => (
                        <ProductCard key={product.id} product={product} isLastProduct={i === array.length - 1} onView={onView} />
                    ))}
            </div>
        </main>
    )
}
