import Link from "next/link"

export default function Home() {
    return (
        <main className="bg-dark flex-1 flex flex-col items-center justify-center p-8 md:p-12 gap-14">
            <h1 className="text-8xl">
                Modern <span className="neon-text-xs agora from-nostr via-dark to-nostr">Agora</span>
            </h1>
            <h2 className="text-2xl">
                Discover exciting products and auctions in a secure, decentralized marketplace powered by the{" "}
                <span className="text-nostr neon-text-xs">Nostr</span> Protocol
            </h2>
            <div className="flex gap-4">
                <Link
                    href="/products"
                    className="h-12 w-32 flex items-center justify-center text-xl border border-white border-opacity-20 font-bold bg-black rounded-md transition-all shadow hover:shadow-lg shadow-nostr hover:shadow-nostr"
                >
                    Products
                </Link>
                <Link
                    href="/auctions"
                    className="h-12 w-32 flex items-center justify-center text-xl border border-white border-opacity-20 font-bold bg-black rounded-md transition-all shadow hover:shadow-lg shadow-nostr hover:shadow-nostr"
                >
                    Auctions
                </Link>
            </div>
        </main>
    )
}
