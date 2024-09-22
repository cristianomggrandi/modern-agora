"use client"

import useNDK, { useUser } from "@/hooks/useNDK"
import { useMessagesByPubkey } from "@/hooks/usePrivateMessages"
import useUserByPubkey from "@/hooks/useUserByPubkey"
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { SyntheticEvent, useRef, useState } from "react"

type ChatType = {
    pubkey: string
    messages: NDKEvent[]
}

const ChatSelector = ({ chat, selectChat, isSelected }: { chat: ChatType; selectChat: () => void; isSelected: boolean }) => {
    const user = useUserByPubkey(chat.pubkey)

    return (
        <div
            key={chat.pubkey}
            onClick={selectChat}
            className={`flex flex-col gap-1 p-2 rounded-md ${isSelected ? "bg-nostr" : "bg-light"}`}
        >
            <span className="text-ellipsis overflow-hidden">
                {user?.profile?.nip05 ?? user?.profile?.displayName ?? user?.profile?.name ?? user?.npub ?? chat.pubkey}
            </span>
            {chat.messages.length ? (
                <span className="text-sm text-ellipsis overflow-hidden line-clamp-1">{chat.messages[0].content}</span>
            ) : null}
        </div>
    )
}

const Message = ({ event }: { event: NDKEvent }) => {
    const user = useUser()

    const isSent = event.author.pubkey === user?.pubkey

    return (
        <div
            className={`flex p-2 px-4 rounded-lg max-w-[80%] w-fit ${
                isSent ? "bg-nostr self-end rounded-br-none" : "bg-light rounded-bl-none"
            }`}
        >
            <span className="break-words break-all">{event.content}</span>
        </div>
    )
}

const Chat = ({ messages, chatPubkey }: { messages: NDKEvent[]; chatPubkey: string }) => {
    const ndk = useNDK()
    const messageTextRef = useRef<HTMLInputElement>(null)

    if (!messages) return <div className="w-full h-full flex items-center justify-center">TODO</div>

    const sendMessage = async (e: SyntheticEvent) => {
        // TODO: Move to NDKContext
        e.preventDefault()

        if (!ndk) return

        const ndkEvent = new NDKEvent(ndk)

        const pubkey = await window.nostr?.getPublicKey()

        if (!pubkey) throw new Error("Pubkey not found!")

        const message = messageTextRef.current?.value

        if (!message) return

        const encryptedMessage = await window.nostr?.nip04?.encrypt(chatPubkey, message)

        if (!encryptedMessage) throw new Error("Error encrypting message")

        ndkEvent.kind = NDKKind.EncryptedDirectMessage
        ndkEvent.content = encryptedMessage
        ndkEvent.tags = [["p", chatPubkey]]
        ndkEvent.publish()

        messageTextRef.current.value = ""
    }

    return (
        <div className="bg-dark absolute inset-0 flex flex-col gap-3">
            <div className="flex flex-col-reverse gap-2 overflow-y-auto h-full no-scrollbar">
                {messages.map(e => (
                    <Message key={e.id} event={e} />
                ))}
            </div>
            <form onSubmit={sendMessage} className="flex rounded-lg bg-light h-12 p-2 gap-2">
                <input ref={messageTextRef} className="w-full bg-nostr p-1 px-2 rounded-md" placeholder="New message" />
                <button type="submit" className="h-full aspect-square rounded-full">
                    <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                </button>
            </form>
        </div>
    )
}

export default function Orders() {
    const chatByPubkey = useMessagesByPubkey()
    const [selectedChat, setSelectedChat] = useState<string | undefined>(undefined)

    // TODO: Check if there is a way to optimize this
    const orderedChats: ChatType[] = Array.from(chatByPubkey)
        .map(([pubkey, chat]) => ({
            // TODO: Try to change to npub (is it needed?)
            pubkey,
            messages: chat,
        }))
        .toSorted((a, b) => b.messages[0].created_at! - a.messages[0].created_at!)

    return (
        <main className="p-4 flex gap-6">
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
                    <Chat messages={chatByPubkey.get(selectedChat)!} chatPubkey={selectedChat} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">TODO</div>
                )}
            </div>
        </main>
    )
}
