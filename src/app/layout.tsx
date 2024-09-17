import { NDKContextProvider } from "@/hooks/useNDK"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import NavBar from "./components/NavBar"
import "./globals.css"

export const metadata: Metadata = {
    title: "Modern Agora",
    description: "Discover exciting products and auctions in a secure, decentralized marketplace powered by the Nostr Protocol",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // TODO: Maybe change layout to template so that state updates (I can try to select active page)
    return (
        <html lang="en">
            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
            <body className={GeistSans.className + " [&>main]:bg-dark [&>main]:flex-1 min-h-screen flex flex-col"}>
                <NDKContextProvider>
                    <NavBar />
                    {children}
                </NDKContextProvider>
            </body>
        </html>
    )
}
