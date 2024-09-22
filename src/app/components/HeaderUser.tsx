"use client"

import { useLogin, useUser } from "@/hooks/useNDK"
import { faBasketShopping, faUser } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"

export default function HeaderUser() {
    const user = useUser()
    const loginWithNIP07 = useLogin()

    if (!user || !user.profile)
        return (
            <div className="sm:w-32 px-1 flex justify-center items-center">
                <button onClick={loginWithNIP07} className="bg-dark px-4 py-2 rounded-lg uppercase">
                    Login
                </button>
            </div>
        )

    const profileName = user.profile.name ? user.profile.name[0].toLocaleUpperCase() : "U"

    const handleCloseDropdown = () => {
        const menuDropdownCheckbox = document.getElementById("profile-menu-button") as HTMLInputElement | null
        if (menuDropdownCheckbox) menuDropdownCheckbox.checked = false
    }

    return (
        <>
            <div className="relative sm:w-32 py-1 flex justify-center items-center gap-4">
                {/*  <Link
                href="/cart"
                className="block h-12 w-12 bg-bitcoin text-xl text-secondary rounded-full leading-[48px] text-center overflow-hidden"
            >
                {cart.reduce((prev, curr) => prev + curr.quantity, 0)}
            </Link */}
                <label
                    htmlFor="profile-menu-button"
                    className="relative block h-10 w-10 text-lg leading-[40px] sm:h-12 sm:w-12 bg-dark sm:text-xl text-secondary rounded-full sm:leading-[48px] text-center"
                >
                    <span className="inline-block h-full w-full rounded-full cursor-pointer">
                        {user.profile.image ? <img width={48} height={48} src={user.profile.image} /> : profileName}
                    </span>
                    <input id="profile-menu-button" type="checkbox" className="hidden peer" />
                    <div className="absolute overflow-hidden z-50 max-w-screen w-52 transition-all duration-1000 max-h-0 px-2 peer-checked:max-h-96 top-[105%] rounded-xl rounded-tr-none right-0 bg-dark shadow-md shadow-nostr">
                        {/* TODO: Add bookmarking to products */}
                        <ul>
                            <li>
                                <Link
                                    className="flex items-center justify-start gap-2 px-2"
                                    href={"/profile/" + user.pubkey}
                                    onClick={handleCloseDropdown}
                                >
                                    <FontAwesomeIcon className="w-8" icon={faUser} />
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link className="flex items-center justify-start gap-2 px-2" href="/messages" onClick={handleCloseDropdown}>
                                    <FontAwesomeIcon className="w-8" icon={faBasketShopping} />
                                    Orders/Sales
                                </Link>
                            </li>
                        </ul>
                    </div>
                </label>
            </div>
        </>
    )
}
