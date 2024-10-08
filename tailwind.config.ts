import type { Config } from "tailwindcss"

const config: Config = {
    content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            colors: {
                // light: "#9c29c1",
                // dark: "#250031",
                light: "#4E0366",
                dark: "#250031",
                nostr: "#9543dc",
                bitcoin: "#f7931a",
            },
        },
    },
    plugins: [],
}
export default config
