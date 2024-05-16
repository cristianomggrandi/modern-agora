"use client"

type TagProps = {
    tag: string[]
    color?: "bitcoin" | "secondary"
    removeHandler?: () => void
}

export default function Tag(props: TagProps) {
    if (props.tag[0] !== "t") return null

    const colorClassName = (() => {
        switch (props.color) {
            case "secondary":
                return "bg-secondary text-bitcoin"

            case "bitcoin":
            default:
                return "bg-bitcoin text-secondary"
        }
    })()

    return (
        <span
            className={`inline-block text-nowrap h-min ${colorClassName} rounded-full px-3 py-1 text-xs font-semibold [&:hover>*]:inline`}
        >
            #{props.tag[1]}
            {props.removeHandler ? (
                <button onClick={props.removeHandler} className="hidden ml-1">
                    ×
                </button>
            ) : null}
        </span>
    )
}
