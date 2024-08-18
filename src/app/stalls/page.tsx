"use client"

import useCurrencyOptions from "@/hooks/useCurrencyOptions"
import { NDKParsedAuctionEvent, NDKParsedProductEvent, NDKParsedStallEvent, useNDKContext } from "@/hooks/useNDK"
import useStalls from "@/hooks/useStalls"
import { faAngleRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import { SyntheticEvent, useEffect, useState } from "react"
import LastItemWrapper from "../components/LastItemWrapper"
import SearchField from "../components/SearchField"

const StallCard = ({
    stall,
    isLastStall,
    productQuantity,
    auctionQuantity,
    onView,
}: {
    stall: NDKParsedStallEvent
    isLastStall: boolean
    productQuantity?: number
    auctionQuantity?: number
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    if (!stall.content) return null

    return (
        <LastItemWrapper isLastItem={isLastStall} onView={onView}>
            <Link
                className="w-full h-full relative flex flex-col gap-2 p-2 justify-between hover:outline bg-light outline-nostr rounded-lg"
                href={"/stall/" + stall.content.id}
            >
                <div className="flex justify-between text-xl font-semibold">
                    <span>{stall.content.name}</span>
                    <span className="uppercase">{stall.content.currency}</span>
                </div>
                <div className="flex justify-between">
                    <div className="flex flex-col items-end justify-end">
                        {auctionQuantity ? <span>{auctionQuantity} Auctions</span> : null}
                        {productQuantity ? <span>{productQuantity} Products</span> : null}
                    </div>
                    <div className="flex flex-col items-end justify-end gap-1">
                        {stall.content.shipping
                            .map(s => [s.regions, s.cost] as [string[], number])
                            .map(([regions, cost]: [string[], number]) =>
                                regions.map(region => (
                                    <span key={region} className="text-sm">
                                        {region} - {cost} {stall.content.currency}
                                    </span>
                                ))
                            )}
                    </div>
                </div>
            </Link>
        </LastItemWrapper>
    )
}

const filterStalls = (
    stalls: NDKParsedStallEvent[],
    search: string,
    numberOfStallsToShow: number,
    currencyFilter: string | undefined,
    sortFunction: ((a: NDKParsedStallEvent, b: NDKParsedStallEvent) => number) | null,
    onlyShowStallsWithProducts: boolean,
    productsByStall: Map<string, NDKParsedProductEvent[]>,
    auctionsByStall: Map<string, NDKParsedAuctionEvent[]>
) => {
    const formattedSearch = search.toLocaleLowerCase()

    const filteredStalls = stalls.filter(s => {
        const searchCheck = (s.content.name + (s.content.description ?? "")).toLocaleLowerCase().includes(formattedSearch)
        const currencyCheck = currencyFilter ? s.content.currency === currencyFilter : true
        const hasProductsCheck = onlyShowStallsWithProducts
            ? Boolean(productsByStall.get(s.content.id)?.length) || Boolean(auctionsByStall.get(s.content.id)?.length)
            : true

        return currencyCheck && searchCheck && hasProductsCheck
    })

    const sortedStalls = sortFunction ? filteredStalls.sort(sortFunction) : filteredStalls

    return sortedStalls.slice(0, numberOfStallsToShow)
}

export default function Stalls() {
    const stalls = useStalls()
    const { productsByStall, auctionsByStall } = useNDKContext()
    const [numberOfStallsToShow, setNumberOfStallsToShow] = useState(24)

    const currencyOptions = useCurrencyOptions()
    const [currencyFilter, setCurrencyFilter] = useState<string>()

    const sortingFunctions: {
        label: string
        function: ((a: NDKParsedStallEvent, b: NDKParsedStallEvent) => number) | null
    }[] = [
        {
            label: "No ordering",
            function: null,
        },
        {
            label: "Item quantity (+)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = (productsByStall.get(a.content.id)?.length ?? 0) + (auctionsByStall.get(a.content.id)?.length ?? 0)
                const quantityB = (productsByStall.get(b.content.id)?.length ?? 0) + (auctionsByStall.get(b.content.id)?.length ?? 0)

                if (!quantityB) return -1
                if (!quantityA) return 1

                return quantityB - quantityA
            },
        },
        {
            label: "Item quantity (-)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = (productsByStall.get(a.content.id)?.length ?? 0) + (auctionsByStall.get(a.content.id)?.length ?? 0)
                const quantityB = (productsByStall.get(b.content.id)?.length ?? 0) + (auctionsByStall.get(b.content.id)?.length ?? 0)

                if (!quantityA) return -1
                if (!quantityB) return 1

                return quantityA - quantityB
            },
        },
        {
            label: "Product quantity (+)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = productsByStall.get(a.content.id)?.length
                const quantityB = productsByStall.get(b.content.id)?.length

                if (!quantityB) return -1
                if (!quantityA) return 1

                return quantityB - quantityA
            },
        },
        {
            label: "Product quantity (-)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = (productsByStall.get(a.content.id)?.length ?? 0) + (auctionsByStall.get(a.content.id)?.length ?? 0)
                const quantityB = (productsByStall.get(b.content.id)?.length ?? 0) + (auctionsByStall.get(b.content.id)?.length ?? 0)

                if (!quantityA) return -1
                if (!quantityB) return 1

                return quantityA - quantityB
            },
        },
        {
            label: "Auction quantity (+)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = auctionsByStall.get(a.content.id)?.length
                const quantityB = auctionsByStall.get(b.content.id)?.length

                if (!quantityB) return -1
                if (!quantityA) return 1

                return quantityB - quantityA
            },
        },
        {
            label: "Auction quantity (-)",
            function: (a: NDKParsedStallEvent, b: NDKParsedStallEvent) => {
                const quantityA = auctionsByStall.get(a.content.id)?.length
                const quantityB = auctionsByStall.get(b.content.id)?.length

                if (!quantityA) return -1
                if (!quantityB) return 1

                return quantityA - quantityB
            },
        },
    ]
    const [sortFunction, setSortFunction] = useState(0)

    const [onlyShowStallsWithProducts, setOnlyShowStallsWithProducts] = useState(true)

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfStallsToShow(s => Math.min(s + 24, stalls.length))
    }

    useEffect(() => {
        setNumberOfStallsToShow(24)
    }, [search, currencyFilter, onlyShowStallsWithProducts, sortFunction])

    return (
        // TODO: Create a way to search/filter by shipping region/cost
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex flex-col-reverse sm:flex-row justify-end items-stretch gap-4">
                <input id="stall-menu-options" type="checkbox" tabIndex={-1} aria-hidden="true" className="hidden stall-menu-options" />
                <div className="flex flex-col sm:flex-row text-nowrap gap-2 options-menu transition-all duration-300">
                    <div className="flex items-center gap-2 bg-nostr rounded">
                        <label className="square-checkbox rounded p-2">
                            <input
                                type="checkbox"
                                id="show-only-stalls-with-products"
                                checked={onlyShowStallsWithProducts}
                                onChange={e => setOnlyShowStallsWithProducts(e.target.checked)}
                            />
                            Show only stalls with products
                        </label>
                    </div>
                    {/* TODO: Add label */}
                    <select onChange={e => setCurrencyFilter(e.target.value)} className="rounded p-2 bg-nostr">
                        <option value="" className="bg-nostr">
                            All currencies
                        </option>
                        {currencyOptions.map(op => (
                            <option key={op} value={op} className="bg-nostr">
                                {op}
                            </option>
                        ))}
                    </select>
                    {/* TODO: Add label */}
                    <select onChange={e => setSortFunction(Number(e.target.value))} className="rounded p-2 bg-nostr">
                        {sortingFunctions.map((op, i) => (
                            <option key={op.label} value={i} className="bg-nostr">
                                {op.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <label htmlFor="stall-menu-options" className="w-8 h-8 flex justify-center checkbox sm:hidden">
                        <FontAwesomeIcon icon={faAngleRight} size="2xl" className="transition-transform duration-300" />
                    </label>
                    <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
                </div>
            </div>
            <div className="w-full grid auto-rows-fr grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] justify-items-center gap-6 rounded-lg">
                {/* TODO: Create a onView to revert the maximum number of stalls shown */}
                {filterStalls(
                    stalls,
                    search,
                    numberOfStallsToShow,
                    currencyFilter,
                    sortingFunctions[sortFunction].function,
                    onlyShowStallsWithProducts,
                    productsByStall,
                    auctionsByStall
                ).map((stall, i, array) => {
                    return (
                        <StallCard
                            key={stall.id}
                            stall={stall}
                            isLastStall={i === array.length - 1}
                            productQuantity={productsByStall.get(stall.content.id)?.length}
                            auctionQuantity={auctionsByStall.get(stall.content.id)?.length}
                            onView={onView}
                        />
                    )
                })}
            </div>
        </main>
    )
}
