"use client"

import { ndk, useAuctions, useBids } from "@/hooks/useNDK"
import { parseDescription } from "@/utils/ndk"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useState } from "react"

function ParsedDescription({ description }: { description: string | undefined }) {
    if (!description) return null

    const parsedDescription = parseDescription(description).split("\n")

    return (
        // TODO: Create scroller for description (http://localhost:3000/auction/90cb2433-6d75-468b-b0b6-7d40ac209bc7)
        <div className="flex-1 justify-center flex flex-col gap-1">
            {parsedDescription.map((desc, i) => (
                <p key={i} className="neon-text-sm">
                    {desc}
                </p>
            ))}
        </div>
    )
}

function sendBid(e: React.FormEvent<HTMLFormElement>, auctionId: string) {
    e.preventDefault()

    const target = e.currentTarget

    const bid = target.bid.value

    if (!bid) return

    const ndkEvent = new NDKEvent(ndk)

    ndkEvent.kind = 1021 as NDKKind
    ndkEvent.content = bid
    ndkEvent.tags = [["e", auctionId]]
    ndkEvent.publish()
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
        <main className="flex flex-col p-6 sm:p-[4%] gap-8">
            <div className="flex flex-col-reverse sm:flex-row items-center sm:items-stretch justify-center gap-8">
                <div className="flex-1 flex flex-col-reverse items-center md:flex-row gap-4">
                    <div className="flex md:flex-col gap-2 justify-center">
                        {auction.content.images?.length! > 1
                            ? auction.content.images!.map((img, index) => (
                                  <div
                                      className="h-12 w-12 border border-nostr shadow-nostr shadow rounded overflow-hidden flex items-center cursor-pointer"
                                      onClick={() => setImageIndex(index)}
                                      key={index}
                                  >
                                      <img src={img} alt={"Image " + index} height={48} width={48} />
                                  </div>
                              ))
                            : null}
                    </div>
                    <div className="flex w-[90%] md:h-96 items-center justify-center relative">
                        {auction.content.images ? (
                            <>
                                <div className="border border-nostr bg-center shadow-md shadow-nostr">
                                    <img
                                        src={auction.content.images[imageIndex]}
                                        alt={auction.content.name}
                                        className="max-w-full max-h-96"
                                    />
                                </div>
                                {auction.content.images?.length! > 1 ? (
                                    <>
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
                                    </>
                                ) : null}
                            </>
                        ) : (
                            "No images"
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-between gap-6">
                    <h1 className="text-lg sm:text-2xl neon-text-2lg font-semibold text-center">{auction.content.name}</h1>
                    <ParsedDescription description={auction.content.description} />
                    {/* TODO: Add currency */}
                    <div>Current highest bid: {highestBid ?? auction.content.starting_bid}</div>
                    <form onSubmit={e => sendBid(e, props.params.auctionId)} className="flex gap-2">
                        <input name="bid" placeholder="Place your bid here" className="p-2 rounded text-black" />
                        <button type="submit" className="p-2 rounded bg-nostr shadow shadow-nostr text-white uppercase font-semibold">
                            Bid
                        </button>
                    </form>
                </div>
            </div>
        </main>
    )
}
