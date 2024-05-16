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

export type NDKBidContent = number

// export type NDKParsedAuctionEvent = Omit<NDKEvent, "content"> & { content: NDKAuctionContent }

const auctionContentParser = z.object({
    id: z.string(),
    stall_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    images: z.string().array().optional(),
    starting_bid: z.number(),
    start_date: z.number(),
    duration: z.number(),
    specs: z.string().array().length(2).array().optional(),
    shipping: z
        .object({
            id: z.string(),
            cost: z.number(),
        })
        .array(),
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
