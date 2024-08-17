import { useNDKContext } from "./useNDK"

export default function useCurrencyOptions() {
    // Not useStalls so it doesn't triggers a NDK subscription
    const { stalls } = useNDKContext()

    return stalls.reduce((currencys, stall) => {
        if (!currencys.find(c => c === stall.content.currency)) currencys.push(stall.content.currency)

        return currencys
    }, [] as string[])

    // TODO: Check if is necessary to memoize
    // return useMemo(
    //     () =>
    //         stalls.reduce((currencys, stall) => {
    //             if (!currencys.find(c => c === stall.content.currency)) currencys.push(stall.content.currency)
    //
    //             return currencys
    //         }, [] as string[]),
    //     [stalls.length]
    // )
}
