"use client"

import { useAuctions } from "@/hooks/useNDK"
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

    const [imageIndex, setImageIndex] = useState(0)

    const auction = auctions.find(a => a.content.id === props.params.auctionId)

    if (!auction) return <div>Loading...</div>

    console.log("auction.content.description", auction.content.description)

    return (
        <main className="flex items-stretch justify-center p-16 gap-8">
            <div className="flex-1 flex gap-4">
                <div className="flex flex-col gap-2">
                    {auction.content.images?.map((img, index) => (
                        <div
                            className="h-12 w-12 border border-nostr shadow-nostr shadow rounded overflow-hidden flex items-center cursor-pointer"
                            onClick={() => setImageIndex(index)}
                        >
                            <img src={img} alt={"Image " + index} height={48} width={48} />
                        </div>
                    ))}
                </div>
                <div className="flex-1">{auction.content.images ? <img src={auction.content.images[imageIndex]} /> : "No images"}</div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <h1 className="text-2xl neon-text-2lg">{auction.content.name}</h1>
                <ParsedDescription description={auction.content.description} />
            </div>
        </main>
    )
}
