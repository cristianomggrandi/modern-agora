"use client"

import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ChangeEvent, SyntheticEvent, useState } from "react"

type Props = {
    // search: string
    handleSearch: (e: SyntheticEvent) => void
    clearSearch: () => void
}

const SearchField = (props: Props) => {
    const [search, setSearch] = useState("")

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value.length) props.clearSearch()

        setSearch(e.target.value)
    }

    const handleClear = () => {
        setSearch("")
        props.clearSearch()
    }

    return (
        <div className="flex flex-1 sm:max-w-[min(24rem,100%)] gap-2 px-1 bg-nostr rounded">
            <input
                className="w-full flex-1 px-1 h-8 bg-nostr text-black rounded placeholder:text-black placeholder:text-opacity-70"
                placeholder="Search..."
                value={search}
                onChange={handleChange}
                onBlur={props.handleSearch}
                onKeyUp={e => (e.key === "Enter" ? props.handleSearch(e) : null)}
            />
            <button onClick={handleClear}>
                <FontAwesomeIcon icon={faCircleXmark} className="text-dark" />
            </button>
        </div>
    )
}

export default SearchField
