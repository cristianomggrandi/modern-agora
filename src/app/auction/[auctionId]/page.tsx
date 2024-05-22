"use client"

import { useAuctions, useBids } from "@/hooks/useNDK"
import { parseDescription } from "@/utils/ndk"
import { useState } from "react"

function ParsedDescription({ description }: { description: string | undefined }) {
    if (!description) return null

    const parsedDescription = parseDescription(description).split("\n")

    return (
        <div className="flex flex-col gap-1">
            {parsedDescription.map((desc, i) => (
                <p key={i} className="neon-text-sm">
                    {desc}
                </p>
            ))}
        </div>
    )
}

export default function Auction(props: { params: { auctionId: string } }) {
    const auctions = useAuctions()
    const bids = useBids()

    const [imageIndex, setImageIndex] = useState(0)

    const auction = auctions.find(a => a.content.id === props.params.auctionId)

    if (!auction) return <div>Loading...</div>

    const highestBid = bids.get(String(auction.id))

    const nextImage = () => (auction.content.images ? setImageIndex(prev => (prev + 1) % auction.content.images!.length) : 0)
    const prevImage = () => (auction.content.images ? setImageIndex(prev => (prev > 0 ? prev - 1 : auction.content.images!.length - 1)) : 0)

    return (
        <main className="flex flex-col p-16 gap-8">
            <div className="flex items-stretch justify-center gap-8">
                <div className="flex-1 flex gap-4">
                    <div className="flex flex-col gap-2 justify-center">
                        {auction.content.images?.map((img, index) => (
                            <div
                                className="h-12 w-12 border border-nostr shadow-nostr shadow rounded overflow-hidden flex items-center cursor-pointer"
                                onClick={() => setImageIndex(index)}
                            >
                                <img src={img} alt={"Image " + index} height={48} width={48} />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center flex-1">
                        {auction.content.images ? (
                            <div className="relative bg-no-repeat bg-contain border border-nostr bg-center shadow-md shadow-nostr">
                                <img src={auction.content.images[imageIndex]} alt={auction.content.name} className="max-w-full" />
                                <button
                                    className="absolute top-1/2 left-0 transform translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                    onClick={prevImage}
                                >
                                    {"<"}
                                </button>
                                <button
                                    className="absolute top-1/2 right-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full h-8 opacity-85 aspect-square bg-nostr font-bold"
                                    onClick={nextImage}
                                >
                                    {">"}
                                </button>
                            </div>
                        ) : (
                            "No images"
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between gap-6">
                    <h1 className="text-2xl neon-text-2lg font-semibold underline underline-offset-4">{auction.content.name}</h1>
                    <ParsedDescription description={auction.content.description} />
                </div>
            </div>
            {/* TODO: Add currency */}
            <div>Current highest bid: {highestBid ?? auction.content.starting_bid}</div>
        </main>
    )
}
