import { NDKUser } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK from "./useNDK"

export default function useUserByPubkey(pubkey: string) {
    const ndk = useNDK()
    const [user, setUser] = useState<NDKUser>()

    useEffect(() => {
        if (!user && ndk) {
            const user = ndk?.getUser({ pubkey })

            console.log("user", user, pubkey)

            if (user) {
                setUser(user)
                user.fetchProfile()
            }
        }
    }, [ndk])

    return user
}
