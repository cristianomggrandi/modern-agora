import { ReactNode } from "react"
import { InView } from "react-intersection-observer"

const LastItemWrapper = ({
    children,
    isLastItem,
    onView,
}: {
    children: ReactNode
    isLastItem: boolean
    onView: (inView: boolean, entry: IntersectionObserverEntry) => void
}) => (isLastItem ? <InView onChange={onView}>{children}</InView> : <>{children}</>)

export default LastItemWrapper
