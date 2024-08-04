import { NDKTag } from "@nostr-dev-kit/ndk"

export default function EventTag(props: { tag: NDKTag }) {
    return <span className="bg-nostr text-white rounded-xl px-2 py-1 sm:p-2">#{props.tag[1]}</span>
}
