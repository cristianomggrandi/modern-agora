"use client"

import { useMessagesByPubkey, useUser } from "@/hooks/useNDK"
import usePrivateMessages from "@/hooks/usePrivateMessages"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import { useMemo, useState } from "react"

const Message = ({ event }: { event: NDKEvent }) => {
    const user = useUser()

    const isSent = event.author.pubkey === user?.pubkey

    return (
        <div className={`flex p-2 px-4 rounded max-w-[80%] w-fit ${isSent ? "bg-nostr self-end" : "bg-light"}`}>
            <span>{event.content}</span>
        </div>
    )
}

const Chat = ({ selectedChat }: { selectedChat?: string }) => {
    const chatByPubkey = useMessagesByPubkey()

    if (!selectedChat) return <div className="w-full h-full flex items-center justify-center">TODO</div>

    const chat = chatByPubkey.get(selectedChat)

    if (!chat) return <div className="w-full h-full flex items-center justify-center">TODO</div>

    const sortedMessages = chat.messages.toSorted((a, b) => {
        if (!a.created_at) return 1
        if (!b.created_at) return -1

        console.log("teste order", a.content, a.created_at, b.content, b.created_at)

        return b.created_at - a.created_at
    })

    return (
        <div className="bg-dark flex flex-col gap-2 overflow-y-auto h-full absolute inset-0 no-scrollbar">
            {sortedMessages.map(e => (
                <Message key={e.id} event={e} />
            ))}
        </div>
    )
}

export default function Orders() {
    const chatByPubkey = useMessagesByPubkey()
    const [selectedChat, setSelectedChat] = useState<string | undefined>(undefined)

    // TODO: Change this to use a set for each chat (how to order?)
    const orderedChats = useMemo(
        () =>
            Array.from(chatByPubkey)
                .map(([pubkey, chat]) => {
                    const lastMessage = chat.messages.reduce((acc, curr) => {
                        if (!acc || !acc.created_at) return curr
                        if (!curr.created_at) return acc

                        if (curr.created_at > acc.created_at) return curr

                        return acc
                    })

                    return {
                        // TODO: Try to change to npub
                        pubkey,
                        messages: chat.messages,
                        lastMessage,
                        username: undefined,
                    }
                })
                .toSorted((a, b) => {
                    if (!a.lastMessage.created_at) return 1
                    if (!b.lastMessage.created_at) return -1

                    return b.lastMessage.created_at - a.lastMessage.created_at
                }),
        [chatByPubkey.size]
    )

    return (
        <main className="p-8 flex gap-12">
            <div className="w-1/3 rounded-lg overflow-y-scroll relative no-scrollbar">
                <div className="bg-dark flex flex-col gap-2 rounded-lg absolute inset-0">
                    {orderedChats.map(chat => (
                        <div
                            key={chat.pubkey}
                            className={`flex flex-col p-2 rounded-md ${selectedChat === chat.pubkey ? "bg-nostr" : "bg-light"}`}
                            onClick={() => setSelectedChat(chat.pubkey)}
                        >
                            <span className="text-ellipsis overflow-hidden">{chat.lastMessage.content}</span>
                            <span className="text-ellipsis overflow-hidden">{chat.lastMessage.created_at}</span>
                            <span className="text-ellipsis overflow-hidden">{chat.username ?? chat.pubkey}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-2/3 overflow-hidden relative">
                <Chat selectedChat={selectedChat} />
            </div>
        </main>
    )
}
