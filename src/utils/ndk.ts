import { NDKParsedAuctionEvent } from "@/hooks/useNDK"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import { z } from "zod"

export type NDKAuctionContent = {
    id: string
    stall_id: string
    name: string
    description?: string
    images?: string[]
    starting_bid: number
    start_date: number
    duration: number
    specs?: [string, string][]
    shipping: { id: string; cost: number }[]
}

export type NDKStallContent = {
    id: string
    name: string
    description?: string
    currency: string
    shipping: {
        id: string
        name?: string
        cost: number // Base cost for shipping
        regions: string[]
    }[]
}

export type NDKBidContent = number

// export type NDKParsedAuctionEvent = Omit<NDKEvent, "content"> & { content: NDKAuctionContent }

const auctionContentParser = z.object({
    id: z.string(),
    stall_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    starting_bid: z.number(),
    start_date: z.number(),
    duration: z.number(),
    specs: z.array(z.tuple([z.string(), z.string()])).optional(),
    shipping: z.array(
        z.object({
            id: z.string(),
            cost: z.number(),
        })
    ),
})

const stallContentParser = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    currency: z.string(),
    shipping: z.array(
        z.object({
            id: z.string(),
            name: z.string().optional(),
            cost: z.number(),
            regions: z.array(z.string()),
        })
    ),
})

function isAuctionContentValid(auctionContent: NDKAuctionContent) {
    try {
        return auctionContentParser.parse(auctionContent)
    } catch (error) {
        return false
    }
}

export function getParsedAuctionContent(event: NDKEvent): NDKAuctionContent {
    try {
        const content = JSON.parse(event.content)

        const isValid = isAuctionContentValid(content)

        return isValid ? content : ({} as NDKAuctionContent)
    } catch (error) {
        // TODO: Check Typescript
        if (error.message && !error.message.includes("is not valid JSON")) console.error(error)
        return {} as NDKAuctionContent
    }
}

export function getAuctionEndDate(auction: NDKParsedAuctionEvent) {
    return auction.content.start_date + auction.content.duration
}

export function getParsedBidContent(event: NDKEvent): NDKBidContent {
    try {
        const content = JSON.parse(event.content)

        const isValid = typeof content === "number"

        return isValid ? content : ({} as NDKBidContent)
    } catch (error) {
        // TODO: Check Typescript
        if (error.message && !error.message.includes("is not valid JSON")) console.error(error)
        return {} as NDKBidContent
    }
}

function isStallContentValid(stallContent: NDKStallContent) {
    try {
        return stallContentParser.parse(stallContent)
    } catch (error) {
        return false
    }
}

export function getParsedStallContent(event: NDKEvent): NDKStallContent {
    try {
        const content = JSON.parse(event.content)

        const isValid = isStallContentValid(content)

        return isValid ? content : ({} as NDKStallContent)
    } catch (error) {
        // TODO: Check Typescript
        if (error.message && !error.message.includes("is not valid JSON")) console.error(error)
        return {} as NDKStallContent
    }
}

export function parseDescription(description: string) {
    return description.replaceAll("&amp;", "&")
}
