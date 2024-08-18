"use client"

import ProductCard from "@/app/components/ProductCard"
import { NDKParsedStallEvent } from "@/hooks/useNDK"
import { useProductsByStall } from "@/hooks/useProducts"
import { useStallsByUser } from "@/hooks/useStalls"
import useUserByPubkey from "@/hooks/useUserByPubkey"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

function UserStall({ stall }: { stall: NDKParsedStallEvent }) {
    const products = useProductsByStall(stall.content.id)

    return (
        <div>
            <span className="text-lg font-semibold neon-text-sm">{stall.content.name}</span>
            <div className="w-full grid auto-rows-fr grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] justify-items-center gap-6">
                {products?.map(product => (
                    <ProductCard key={product.content.id} product={product} isLastProduct={false} />
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

    const displayName = user?.profile?.displayName ?? user?.profile?.name

    return (
        <main className="p-8">
            <div className="grid grid-cols-[min-content,1fr] gap-6">
                <div className="sm:row-start-1 sm:row-end-4 h-32 max-h-[20vw] aspect-square">
                    {user?.profile?.image ? (
                        <img src={user?.profile?.image} alt="" />
                    ) : (
                        <div className="flex items-center justify-center text-[14vw] sm:text-7xl h-full w-full bg-light rounded-full">
                            {displayName ? displayName[0].toLocaleUpperCase() : ""}
                        </div>
                    )}
                </div>
                {/* TODO: Change to container query so that the text is proportional to the container */}
                <span className="col-start-2 col-end-3 text-[8vw] sm:text-3xl neon-text-2lg self-center justify-self-start">
                    {displayName}
                </span>
                <span className="col-start-1 col-span-2 sm:col-start-2 sm:text-lg">
                    {user?.profile?.about} {user?.profile?.about} {user?.profile?.about} {user?.profile?.about}
                </span>
                <span className="col-start-1 col-span-2 sm:col-start-2 text-sm sm:text-base flex gap-2 truncate">
                    <FontAwesomeIcon icon={faCopy} className="bg-nostr p-1 rounded-full" />
                    {user?.npub}
                </span>
            </div>
            <div className="mt-8">
                {stalls.map(stall => (
                    <UserStall key={stall.content.id} stall={stall} />
                ))}
            </div>
        </main>
    )
}
