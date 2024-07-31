import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Dispatch, SetStateAction } from "react"

type Props = {
    page: number
    setPage: Dispatch<SetStateAction<number>>
    nextPage: () => void
    prevPage: () => void
    pages: number[]
}

export default function PagesOptions({ page, setPage, nextPage, prevPage, pages }: Props) {
    return (
        <div className="flex items-center gap-1 h-8">
            <button onClick={() => setPage(1)} disabled={page === 1} className="w-6 h-6 text-center border border-nostr bg-nostr">
                <FontAwesomeIcon icon={faAnglesLeft} />
            </button>
            <button onClick={prevPage} disabled={page === 1} className="h-6 w-6 text-center border border-nostr bg-nostr">
                <FontAwesomeIcon icon={faAngleLeft} />
            </button>
            {/* TODO: Handle pagination moving the boundaries */}
            {pages.slice(0, 10).map(i => (
                <button
                    onClick={() => setPage(i)}
                    key={i}
                    className={"w-6 h-6 text-center border border-nostr " + (page === i ? "text-nostr font-bold" : "bg-nostr")}
                >
                    {i}
                </button>
            ))}
            <button onClick={nextPage} disabled={page === pages.length} className="w-6 h-6 text-center border border-nostr bg-nostr">
                <FontAwesomeIcon icon={faAngleRight} />
            </button>
            <button
                onClick={() => setPage(pages.length)}
                disabled={page === pages.length}
                className="w-6 h-6 text-center border border-nostr bg-nostr"
            >
                <FontAwesomeIcon icon={faAnglesRight} />
            </button>
        </div>
    )
}
