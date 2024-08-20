import { NDKUser } from "@nostr-dev-kit/ndk"
import { useEffect, useState } from "react"
import useNDK from "./useNDK"

export default function useUserByPubkey(pubkey: string) {
    const ndk = useNDK()
    const [user, setUser] = useState<NDKUser>()

    useEffect(() => {
        if (!user && ndk) {
            const user = ndk?.getUser({ pubkey })

            if (user) user.fetchProfile().then(() => setUser(user))
        }
    }, [ndk])

    return user
}
