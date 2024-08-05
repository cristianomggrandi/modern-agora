"use client"

import { NDKParsedStallEvent } from "@/hooks/useNDK"
import useStalls from "@/hooks/useStalls"
import { setCookie } from "@/utils/functions"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import Link from "next/link"
import { ReactNode, SyntheticEvent, useState } from "react"
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
    event,
    isLastStall,
    onView,
}: {
    event: NDKParsedStallEvent
    isLastStall: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => {
    if (!event.content) return null

    return (
        <LastStallWrapper isLastStall={isLastStall} onView={onView}>
            <Link
                className="w-full h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
                href={"/stall/" + event.content.id}
                onClick={() => {
                    const originalEvent = { ...event, content: JSON.stringify(event.content) }
                    setCookie(event.content.id, (originalEvent as NDKEvent).serialize(), 0.05)
                }}
                onMouseOver={() => console.log(event)}
            >
                <span>{event.content.name}</span>
                <span>{event.content.currency}</span>
                <span>{JSON.stringify(event.content.shipping)}</span>
            </Link>
        </LastStallWrapper>
    )
}

const filterStallsWithSearch = (stalls: NDKParsedStallEvent[], search: string) => {
    const formattedSearch = search.toLocaleLowerCase()

    return stalls.filter(p => {
        const compareString = (p.content.name + (p.content.description ?? "")).toLocaleLowerCase()

        return compareString.includes(formattedSearch)
    })
}

export default function Stalls() {
    const stalls = useStalls()
    const [numberOfStallsToShow, setNumberOfStallsToShow] = useState(24)

    const [search, setSearch] = useState("")

    const handleSearch = (e: SyntheticEvent) => {
        e.preventDefault()
        setSearch((e.target as HTMLInputElement).value)
    }

    const clearSearch = () => setSearch("")

    const onView = (inView: boolean, entry: IntersectionObserverEntry) => {
        if (inView) setNumberOfStallsToShow(p => p + 24)
    }

    return (
        // TODO: Create a way to search/filter by tag
        <main className="flex gap-4 flex-col items-center justify-stretch p-4 pb-0">
            <div className="w-full flex justify-end">
                <SearchField handleSearch={handleSearch} clearSearch={clearSearch} />
            </div>
            <div className="w-full grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] justify-items-center auto-rows-min gap-6 rounded-lg">
                {/* TODO: Create a onView to revert the maximum number of stalls shown */}
                {(search ? filterStallsWithSearch(stalls, search) : stalls).slice(0, numberOfStallsToShow).map((event, i, array) => {
                    return <StallCard key={event.id} event={event} isLastStall={i === array.length - 1} onView={onView} />
                })}
            </div>
        </main>
    )
}
