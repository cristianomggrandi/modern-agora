export function nFormatter(num: number, digits: number) {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ]
    const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/
    const item = lookup.findLast(item => num >= item.value)
    return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0"
}

export function setCookie(name: string, value: string, days = 7, path = "/") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=" + path
}

export function getCookie(name: string) {
    return document.cookie.split("; ").reduce((r, v) => {
        const parts = v.split("=")
        return parts[0] === name ? decodeURIComponent(parts[1]) : r
    }, "")
}
