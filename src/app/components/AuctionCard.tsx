import { NDKParsedAuctionEvent, useBids, useBidStatus } from "@/hooks/useNDK"
import Link from "next/link"
import LastItemWrapper from "../components/LastItemWrapper"
import AuctionCountdown from "./AuctionCountdown"

export default function AuctionCard({
    auction,
    isLastAuction,
    onView,
}: {
    auction: NDKParsedAuctionEvent
    isLastAuction: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) {
    const bids = useBids()
    const bidStatus = useBidStatus()

    if (!auction.content) return null

    const highestBid = bids
        ?.get(auction.id)
        ?.find(bid => auction.pubkey === bid.pubkey && (bidStatus.get(bid.id) === "accepted" || bidStatus.get(bid.id) === "winner"))

    // TODO: Avaliate: When on mobile, make img the background so the text is over it

    return (
        <LastItemWrapper isLastItem={isLastAuction} onView={onView}>
            <Link
                className="w-full max-w-52 h-full relative flex flex-col gap-2 p-1 justify-center hover:outline outline-nostr rounded-lg"
                href={"/auction/" + auction.content.id}
            >
                <div className="relative aspect-square w-full flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                    <div
                        className="absolute w-full h-full blur-sm bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: auction.content.images ? `url(${auction.content.images[0]})` : undefined }}
                    />
                    {/* TODO: Expand image on mobile  */}
                    {auction.content.images?.length ? (
                        <img
                            className="z-10 max-h-full max-w-full"
                            src={auction.content.images[0]}
                            alt={auction.content.name}
                            height={96}
                            // width={96}
                        />
                    ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <span className="line-clamp-2 text-sm font-semibold">{auction.content.name}</span>
                </div>
                <AuctionCountdown auction={auction.content} />
            </Link>
        </LastItemWrapper>
    )
}
