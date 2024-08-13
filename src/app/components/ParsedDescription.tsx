import { parseDescription } from "@/utils/ndk"

export default function ParsedDescription({ description }: { description: string | undefined }) {
    if (!description) return null

    const parsedDescription = parseDescription(description).split("\n")

    return (
        // TODO: Create scroller for description (http://localhost:3000/product/90cb2433-6d75-468b-b0b6-7d40ac209bc7)
        <div className="product-description flex-1 justify-center text-justify flex flex-col gap-1 overflow-auto">
            {parsedDescription.map((desc, i) => (
                <p key={i} className="neon-text-sm break-words break-all">
                    {desc}
                </p>
            ))}
        </div>
    )
}
