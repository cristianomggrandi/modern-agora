import Link from "next/link"

export default function Home() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 gap-8">
            <h1 className="text-7xl sm:text-8xl text-center">
                Modern <span className="neon-text-xs agora from-nostr via-dark to-nostr">Agora</span>
            </h1>
            <div>
                <p className="text-xl text-center">Discover exciting products and auctions in a secure,</p>
                <p className="text-xl text-center">
                    decentralized marketplace powered by the <span className="text-nostr neon-text-xs">Nostr</span> Protocol
                </p>
            </div>
            <div className="mt-12 sm:mt-16 flex gap-4">
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
