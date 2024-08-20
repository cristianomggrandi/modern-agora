"use client"

import AuctionCard from "@/app/components/AuctionCard"
import ProductCard from "@/app/components/ProductCard"
import { useAuctionsByStall } from "@/hooks/useAuctions"
import { NDKParsedStallEvent } from "@/hooks/useNDK"
import { useProductsByStall } from "@/hooks/useProducts"
import { useStallsByUser } from "@/hooks/useStalls"
import useUserByPubkey from "@/hooks/useUserByPubkey"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

function UserStall({ stall }: { stall: NDKParsedStallEvent }) {
    const products = useProductsByStall(stall.content.id)
    const auctions = useAuctionsByStall(stall.content.id)

    return (
        <div>
            <span className="text-lg font-semibold neon-text-sm">{stall.content.name}</span>
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6">
                {products?.map(product => (
                    <ProductCard key={product.content.id} product={product} isLastProduct={false} />
                ))}
                {auctions?.map(auction => (
                    <AuctionCard key={auction.content.id} auction={auction} isLastAuction={false} />
                ))}
            </div>
        </div>
    )
}

export default function Profile(props: { params: { pubkey: string } }) {
    if (!props.params.pubkey) throw new Error("No pubkey found")

    const user = useUserByPubkey(props.params.pubkey)
    const stalls = useStallsByUser(props.params.pubkey)

    // TODO: Check if it's the same user and allow creating stalls and products
    // const connectedUser = useUser()

    if (!user || !user.profile) return <span>Loading...</span>

    const displayName = user.profile.displayName ?? user.profile.name

    return (
        <main className="p-8">
            <div className="grid grid-cols-[min-content,1fr] gap-y-6">
                {user.profile.image ? (
                    <div className="self-center sm:row-start-1 sm:row-end-4 h-32 max-h-[15vw] sm:max-h-[15vw] aspect-square mr-6">
                        <img src={user.profile.image} alt="" />
                    </div>
                ) : null}
                <span className="col-start-2 col-end-3 text-[5vw] sm:text-3xl neon-text-2lg">{displayName}</span>
                <span className="col-start-1 col-span-2 sm:col-start-2 sm:text-lg text-justify">{user?.profile?.about} </span>
                <span
                    className="col-start-1 col-span-2 sm:col-start-2 text-sm sm:text-base flex gap-2 truncate cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(user.npub)}
                >
                    <FontAwesomeIcon icon={faCopy} className="bg-nostr p-1 rounded-full" />
                    {user.npub}
                </span>
            </div>
            <div className="mt-8 flex flex-col gap-12">
                {stalls.map(stall => (
                    <UserStall key={stall.content.id} stall={stall} />
                ))}
            </div>
        </main>
    )
}
