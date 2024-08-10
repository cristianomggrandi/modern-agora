"use client"

import { NDKParsedStallEvent } from "@/hooks/useNDK"
import useStalls from "@/hooks/useStalls"
import { setCookie } from "@/utils/functions"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { ReactNode, SyntheticEvent, useEffect, useState } from "react"
import { InView } from "react-intersection-observer"
import SearchField from "../components/SearchField"

const LastStallWrapper = ({
    children,
    isLastStall,
    onView,
}: {
    children: ReactNode
    isLastStall: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => (isLastStall ? <InView onChange={onView}>{children}</InView> : <>{children}</>)

const StallCard = ({
    stall,
    isLastStall,
    onView,
}: {
    stall: NDKParsedStallEvent
    isLastStall: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    if (!stall.content) return null

    return (
        <LastStallWrapper isLastStall={isLastStall} onView={onView}>
            <Link
                className="w-full h-full relative flex flex-col gap-2 p-2 justify-between hover:outline bg-light outline-nostr rounded-lg"
                href={"/stall/" + stall.content.id}
                onClick={() => {
                    const originalEvent = { ...stall, content: JSON.stringify(stall.content) }
                    setCookie(stall.content.id, (originalEvent as NDKEvent).serialize(), 0.05)
                }}
            >
                <div className="flex justify-between text-xl font-semibold">
                    <span>{stall.content.name}</span>
                    <span className="uppercase">{stall.content.currency}</span>
                </div>
                {/* <span>{stall.content.currency}</span> */}
                <div className="flex flex-col gap-1">
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
            </Link>
        </LastStallWrapper>
    )
}

const filterStalls = (stalls: NDKParsedStallEvent[], search: string, numberOfStallsToShow: number, currencyFilter?: string) => {
    const formattedSearch = search.toLocaleLowerCase()

    return stalls
        .filter(s => {
            const searchCheck = (s.content.name + (s.content.description ?? "")).toLocaleLowerCase().includes(formattedSearch)
            const currencyCheck = currencyFilter ? s.content.currency === currencyFilter : true

            return currencyCheck && searchCheck
        })
        .slice(0, numberOfStallsToShow)
}

export default function Stalls() {
    const { stalls, setStalls } = useStalls()
    const [numberOfStallsToShow, setNumberOfStallsToShow] = useState(24)

    const [currencyOptions, setCurrencyOptions] = useState<string[]>([])
    const [currencyFilter, setCurrencyFilter] = useState<string>()

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfStallsToShow(s => s + 24)
    }

    useEffect(() => {
        let repeat = 2

        const currencyOptionsInterval = setInterval(() => {
            if (repeat-- <= 0) clearInterval(currencyOptionsInterval)

            setStalls(stalls => {
                setCurrencyOptions(
                    stalls.reduce((currencys, stall) => {
                        if (!currencys.find(c => c === stall.content.currency)) currencys.push(stall.content.currency)

                        return currencys
                    }, [] as string[])
                )

                return stalls
            })
        }, 10000)

        return () => clearInterval(currencyOptionsInterval)
    }, [])

    return (
        // TODO: Create a way to search/filter by tag
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex justify-end">
                <select onChange={e => setCurrencyFilter(e.target.value)} className="bg-nostr">
                    <option value={undefined} className="bg-nostr">
                        Teste
                    </option>
                    {currencyOptions.map(op => (
                        <option value={op} className="bg-nostr">
                            {op}
                        </option>
                    ))}
                </select>
                <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
            </div>
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] justify-items-center gap-6 rounded-lg">
                {/* TODO: Create a onView to revert the maximum number of stalls shown */}
                {filterStalls(stalls, search, numberOfStallsToShow, currencyFilter).map((stall, i, array) => {
                    return <StallCard key={stall.id} stall={stall} isLastStall={i === array.length - 1} onView={onView} />
                })}
            </div>
        </main>
    )
}
