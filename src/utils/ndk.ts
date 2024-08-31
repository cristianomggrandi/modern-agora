import { NDKParsedAuctionEvent } from "@/hooks/useNDK"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import { z } from "zod"

// TODO: Remove "return {} as SomeType"

export type NDKCheckoutContent =
    | {
          type: 0
          id: string
          name?: string
          address?: string
          message?: string
          contact: {
              nostr: string
              phone?: string
              email?: string
          }
          items: {
              product_id: string
              quantity: number
          }[]
          shipping_id: string
      }
    | {
          type: 1
          id: string

          message?: string
          payment_options: {
              type: string
              link: string
          }[]
      }
    | {
          type: 2
          id: string
          message: string
          paid: boolean
          shipped: boolean
      }

export type NDKProductContent = {
    id: string
    stall_id: string
    name: string
    description?: string
    images?: string[]
    currency: string
    price: number
    quantity: number | null
    specs?: [string, string][]
    shipping: { id: string; cost: number }[]
}

const productContentParser = z.object({
    id: z.string(),
    stall_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    currency: z.string(),
    price: z.number().nonnegative(),
    quantity: z.union([z.number(), z.null()]),
    specs: z.array(z.tuple([z.string(), z.string()])).optional(),
    shipping: z.array(
        z.object({
            id: z.string(),
            cost: z.number(),
        })
    ),
})

function isProductContentValid(productContent: NDKAuctionContent) {
    try {
        return productContentParser.parse(productContent)
    } catch (error) {
        return false
    }
}

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

export type NDKConfirmationBidContent = {
    status: string
    message?: string
    duration_extended?: number
}

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

const stallShippingInfoParser = z.object({
    id: z.string(),
    name: z.string().optional(),
    cost: z.number().nonnegative(),
    regions: z.array(z.string()),
})

const stallContentParser = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    currency: z.string(),
    shipping: z.array(stallShippingInfoParser).nonempty(),
})

const confirmationBidContentParser = z.object({
    status: z.string(),
    message: z.string().optional(),
    duration_extended: z.number().optional(),
})

function isAuctionContentValid(auctionContent: NDKAuctionContent) {
    try {
        return auctionContentParser.parse(auctionContent)
    } catch (error) {
        return false
    }
}

export function getParsedProductContent(event: NDKEvent): NDKProductContent {
    if (!event.content) throw new Error("Invalid event content")

    const content = JSON.parse(event.content)

    if (!isProductContentValid(content)) throw new Error("Invalid event content")

    return content
}

export function getParsedAuctionContent(event: NDKEvent): NDKAuctionContent {
    if (!event.content) throw new Error("Invalid event content")

    const content = JSON.parse(event.content)

    if (!isAuctionContentValid(content)) throw new Error("Invalid event content")

    return content
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
        // if (error.message && !error.message.includes("is not valid JSON")) console.error(error)
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
    if (!event.content) throw new Error("Invalid event content")

    const content = JSON.parse(event.content)

    if (!isStallContentValid(content)) throw new Error("Invalid event content")

    return content
}

function isConfirmationBidContentValid(confirmationBidContent: NDKConfirmationBidContent) {
    try {
        return confirmationBidContentParser.parse(confirmationBidContent)
    } catch (error) {
        return false
    }
}

export function getParsedConfirmationBidContent(event: NDKEvent): NDKConfirmationBidContent {
    try {
        const content = JSON.parse(event.content)

        const isValid = isConfirmationBidContentValid(content)

        return isValid ? content : ({} as NDKConfirmationBidContent)
    } catch (error) {
        // TODO: Check Typescript
        // if (error.message && !error.message.includes("is not valid JSON")) console.error(error)
        return {} as NDKConfirmationBidContent
    }
}

export function getBidStatus(event: NDKEvent) {
    const content = getParsedConfirmationBidContent(event)

    return content.status
}

export function parseDescription(description: string) {
    return description.replaceAll("&amp;", "&")
}

export { auctionContentParser, confirmationBidContentParser, productContentParser, stallContentParser, stallShippingInfoParser }
