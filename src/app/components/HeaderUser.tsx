"use client"

import { useLogin, useUser } from "@/hooks/useNDK"
import Link from "next/link"

export default function HeaderUser() {
    const user = useUser()
    const loginWithNIP07 = useLogin()

    if (!user || !user.profile)
        return (
            <div className="w-32 flex justify-center items-center">
                <button onClick={loginWithNIP07} className="bg-dark px-4 py-2 rounded-lg uppercase">
                    Login
                </button>
            </div>
        )

    const profileName = user.profile.name ? user.profile.name[0].toLocaleUpperCase() : "User"

    return (
        <div className="w-32 flex justify-center gap-4">
            {/*  <Link
                href="/cart"
                className="block h-12 w-12 bg-bitcoin text-xl text-secondary rounded-full leading-[48px] text-center overflow-hidden"
            >
                {cart.reduce((prev, curr) => prev + curr.quantity, 0)}
            </Link */}
            <Link
                href="/profile"
                className="block h-12 w-12 bg-dark text-xl text-secondary rounded-full leading-[48px] text-center overflow-hidden"
            >
                {user.profile.image ? <img width={48} height={48} src={user.profile.image} /> : profileName}
            </Link>
        </div>
    )
}
