import { parseDescription } from "@/utils/ndk"

export default function ParsedDescription({ description }: { description: string | undefined }) {
    if (!description) return null

    const parsedDescription = parseDescription(description).split("\n")

    return (
        <div className="product-description max-h-96 flex-1 text-justify flex flex-col gap-1 overflow-y-scroll">
            {parsedDescription.map((desc, i) => (
                <p key={i} className="neon-text-sm break-words break-all">
                    {desc}
                </p>
            ))}
        </div>
    )
}
