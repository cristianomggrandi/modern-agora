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
        <div className="flex gap-1 mt-4">
            <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="text-nostr border border-nostr w-6 h-6 text-center rounded-full font-bold"
            >
                {"<<"}
            </button>
            <button
                onClick={prevPage}
                disabled={page === 1}
                className="text-nostr border border-nostr w-6 h-6 text-center rounded-full font-bold"
            >
                {"<"}
            </button>
            {/* TODO: Handle pagination moving the boundaries */}
            {pages.slice(0, 10).map(i => (
                <button
                    onClick={() => setPage(i)}
                    key={i}
                    className={"w-6 h-6 text-center rounded-full border border-nostr " + (page === i ? "bg-nostr" : "text-nostr font-bold")}
                >
                    {i}
                </button>
            ))}
            <button
                onClick={nextPage}
                disabled={page === pages.length}
                className="text-nostr border border-nostr w-6 h-6 text-center rounded-full font-bold"
            >
                {">"}
            </button>
            <button
                onClick={() => setPage(pages.length)}
                disabled={page === pages.length}
                className="text-nostr border border-nostr w-6 h-6 text-center rounded-full font-bold"
            >
                {">>"}
            </button>
        </div>
    )
}
