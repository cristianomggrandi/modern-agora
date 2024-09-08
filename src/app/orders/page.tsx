"use client"

import { useMessagesByPubkey } from "@/hooks/useNDK"
import usePrivateMessages from "@/hooks/usePrivateMessages"
import { useMemo, useState } from "react"

export default function Orders() {
    const privateMessages = usePrivateMessages()
    const chatByPubkey = useMessagesByPubkey()
    const [selectedChat, setSelectedChat] = useState<string | undefined>(undefined)

    console.log("length", privateMessages.length)

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
            <div className="w-1/3 rounded-lg bg-light">
                {orderedChats.map(chat => (
                    <div key={chat.pubkey} className="flex flex-col mb-4" onClick={() => setSelectedChat(chat.pubkey)}>
                        <span className="text-ellipsis overflow-hidden">{chat.lastMessage.content}</span>
                        <span className="text-ellipsis overflow-hidden">{chat.lastMessage.created_at}</span>
                        <span className="text-ellipsis overflow-hidden">{chat.username ?? chat.pubkey}</span>
                    </div>
                ))}
            </div>
            <div className="w-2/3 rounded-lg bg-light">
                {selectedChat ? chatByPubkey.get(selectedChat)?.messages.map(e => <div key={e.id}>{e.content}</div>) : <div>Teste</div>}
            </div>
        </main>
    )
}
