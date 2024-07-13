"use client"

import { faCircleXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { SyntheticEvent, useState } from "react"

type Props = {
    // search: string
    handleSearch: (e: SyntheticEvent) => void
    clearSearch: () => void
}

const SearchField = (props: Props) => {
    const [search, setSearch] = useState("")

    const handleClear = () => {
        setSearch("")
        props.clearSearch()
    }

    return (
        <div className="flex w-full max-w-96 gap-2 px-1 bg-nostr rounded">
            <input
                className="flex-1 px-1 h-8 bg-nostr text-black rounded placeholder:text-black placeholder:text-opacity-70"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
