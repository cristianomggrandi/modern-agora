"use client"

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import "../globals.css"
import HeaderUser from "./HeaderUser"

export default function NavBar() {
    const handleClose = () => {
        const menuDropdownCheckbox = document.getElementById("nav-menu-button") as HTMLInputElement | null
        if (menuDropdownCheckbox) menuDropdownCheckbox.checked = false
    }

    return (
        <header className="menu-checkbox-container sticky z-50 top-0 bg-light">
            <Link className="logo py-2 px-6 flex items-center justify-center h-16" href="/">
                Logo
            </Link>
            <input id="nav-menu-button" type="checkbox" tabIndex={-1} aria-hidden="true" className="hidden" />
            <label htmlFor="nav-menu-button" className="checkbox sm:hidden">
                <FontAwesomeIcon icon={faBars} size="xl" />
                <FontAwesomeIcon icon={faXmark} size="2xl" />
            </label>
            <nav className="w-full z-40 transition-transform delay-200 bg-light bg-opacity-20 flex sm:h-full">
                <ul className="grid justify-stretch sm:justify-evenly sm:flex w-full">
                    <li className="products flex-1 sm:max-w-36 transition-colors duration-300 hover:bg-dark hover:text-nostr">
                        <Link
                            className="focus-visible:bg-dark focus-visible:text-nostr uppercase underline sm:no-underline font-semibold underline-offset-4 w-full py-2 px-6 flex items-center justify-center h-16"
                            href="/products"
                            onClick={handleClose}
                        >
                            Products
                        </Link>
                    </li>
                    <li className="auctions flex-1 sm:max-w-36 transition-colors duration-300   hover:bg-dark hover:text-nostr">
                        <Link
                            className="focus-visible:bg-dark focus-visible:text-nostr uppercase underline sm:no-underline font-semibold underline-offset-4 w-full py-2 px-6 flex items-center justify-center h-16"
                            href="/auctions"
                            onClick={handleClose}
                        >
                            Auctions
                        </Link>
                    </li>
                    <li className="stalls flex-1 sm:max-w-36 transition-colors duration-300   hover:bg-dark hover:text-nostr">
                        <Link
                            className="focus-visible:bg-dark focus-visible:text-nostr uppercase underline sm:no-underline font-semibold underline-offset-4 w-full py-2 px-6 flex items-center justify-center h-16"
                            href="/stalls"
                            onClick={handleClose}
                        >
                            Stalls
                        </Link>
                    </li>
                    <li className="about flex-1 sm:max-w-36 transition-colors duration-300   hover:bg-dark hover:text-nostr">
                        <Link
                            className="focus-visible:bg-dark focus-visible:text-nostr uppercase underline sm:no-underline font-semibold underline-offset-4 w-full py-2 px-6 flex items-center justify-center h-16"
                            href="/aboutus"
                            onClick={handleClose}
                        >
                            About Us
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="profile">
                <HeaderUser />
            </div>
        </header>
    )
}
