"use client"

import { useMessagesByPubkey, useUser } from "@/hooks/useNDK"
import useUserByPubkey from "@/hooks/useUserByPubkey"
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { NDKEvent } from "@nostr-dev-kit/ndk"
import { useMemo, useState } from "react"

type ChatType = {
    pubkey: string
    messages: NDKEvent[]
    lastMessage: NDKEvent
    username: undefined
}

const ChatSelector = ({ chat, selectChat, isSelected }: { chat: ChatType; selectChat: () => void; isSelected: boolean }) => {
    const user = useUserByPubkey(chat.pubkey)

    return (
        <div key={chat.pubkey} onClick={selectChat} className={`flex flex-col p-2 rounded-md ${isSelected ? "bg-nostr" : "bg-light"}`}>
            <span className="text-ellipsis overflow-hidden">
                {user?.profile?.nip05 ?? user?.profile?.displayName ?? user?.profile?.name ?? user?.npub ?? chat.pubkey}
            </span>
            <span className="text-ellipsis overflow-hidden">{chat.lastMessage.content}</span>
        </div>
    )
}

const Message = ({ event }: { event: NDKEvent }) => {
    const user = useUser()

    const isSent = event.author.pubkey === user?.pubkey

    return (
        <div className={`flex p-2 px-4 rounded max-w-[80%] w-fit ${isSent ? "bg-nostr self-end" : "bg-light"}`}>
            <span className="break-words break-all">{event.content}</span>
        </div>
    )
}

const Chat = ({ selectedChat }: { selectedChat: string }) => {
    const chatByPubkey = useMessagesByPubkey()

    const chat = chatByPubkey.get(selectedChat)

    if (!chat) return <div className="w-full h-full flex items-center justify-center">TODO</div>

    const sortedMessages = chat.messages.toSorted((a, b) => {
        if (!a.created_at) return 1
        if (!b.created_at) return -1

        return b.created_at - a.created_at
    })

    return (
        <div className="bg-dark absolute inset-0 flex flex-col gap-2">
            <div className="flex flex-col-reverse gap-2 overflow-y-auto h-full no-scrollbar">
                {sortedMessages.map(e => (
                    <Message key={e.id} event={e} />
                ))}
            </div>
            <div className="flex rounded-lg bg-light h-12 p-2 gap-2">
                <input className="w-full bg-nostr p-1 rounded-md" placeholder="New message" />
                <button className="h-full aspect-square">
                    <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                </button>
            </div>
        </div>
    )
}

export default function Orders() {
    const chatByPubkey = useMessagesByPubkey()
    const [selectedChat, setSelectedChat] = useState<string | undefined>(undefined)

    // TODO: Change this to use a set for each chat (how to order?)
    const orderedChats: ChatType[] = useMemo(
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
                        <ChatSelector
                            key={chat.pubkey}
                            chat={chat}
                            selectChat={() => setSelectedChat(chat.pubkey)}
                            isSelected={selectedChat === chat.pubkey}
                        />
                    ))}
                </div>
            </div>
            <div className="w-2/3 overflow-hidden relative">
                {selectedChat ? (
                    <Chat selectedChat={selectedChat} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">TODO</div>
                )}
            </div>
        </main>
    )
}
