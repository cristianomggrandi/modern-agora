import { NDKTag } from "@nostr-dev-kit/ndk"

function EventTag(props: { tag: NDKTag }) {
    return <span className="text-nowrap bg-nostr text-white rounded-xl px-2 py-1 sm:p-2">#{props.tag[1]}</span>
}

// TODO: Maybe put below images on large screens
export default function ({ tags }: { tags: NDKTag[] }) {
    if (!tags.length) return null

    return (
        <div className="product-tags flex gap-2 flex-nowrap no-scrollbar no-wrap overflow-x-scroll">
            {tags
                .filter(tag => tag[0] === "t")
                .map((tag, i) => (
                    <EventTag key={i} tag={tag} />
                ))}
        </div>
    )
}
