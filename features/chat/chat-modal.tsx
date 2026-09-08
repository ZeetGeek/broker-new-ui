"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import SimpleBar from "simplebar-react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatComposer } from "@/features/chat/chat-composer";
import { ChatMessageRow } from "@/features/chat/chat-message";
import { appendMockMessage, getMockThread } from "@/features/chat/mock-thread";
import type { ChatMessage, ChatPeer } from "@/features/chat/types";

/** Name, presence and role — no call buttons, by product decision. */
function ChatHeader({ peer }: { peer: ChatPeer }) {
    return (
        <div className="flex items-center gap-3 min-inline-0">
            <UserAvatar name={peer.name} imageUrl={peer.avatarUrl} size="md" />

            <div className="min-inline-0">
                <p className="body truncate font-semibold text-ink">{peer.name}</p>
                <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                    {peer.isOnline ? (
                        <>
                            <span
                                aria-hidden
                                className="rounded-full bg-success block-1.5 inline-1.5"
                            />
                            Online
                        </>
                    ) : (
                        peer.roleLabel || "Offline"
                    )}
                </p>
            </div>
        </div>
    );
}

export function ChatModal({
    peer,
    open,
    onOpenChange,
}: {
    peer: ChatPeer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    /** Which peer the loaded transcript belongs to. */
    const [loadedPeerId, setLoadedPeerId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Loading during render rather than in an effect: an effect would paint the
    // previous peer's transcript for one frame before swapping it. Not cleared
    // on close, so the thread does not blank out mid exit-animation.
    if (peer && open && peer.id !== loadedPeerId) {
        setLoadedPeerId(peer.id);
        setMessages(getMockThread(peer));
    }

    useEffect(() => {
        if (!open) return;
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [open, messages]);

    const handleSend = useCallback(
        (text: string) => {
            if (!peer) return;

            const message: ChatMessage = {
                id: `local-${Date.now()}`,
                isOwn: true,
                text,
                sentAt: new Date().toISOString(),
                status: "sent",
            };

            appendMockMessage(peer.id, message);
            setMessages((prev) => [...prev, message]);
        },
        [peer],
    );

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            padding="md"
            title={peer ? <ChatHeader peer={peer} /> : "Chat"}
            titleClassName="p-0 font-normal"
            bodyClassName="p-0"
            className="block-[min(85dvh,44rem)]"
            footer={<ChatComposer onSend={handleSend} />}
            footerClassName="block bg-surface"
        >
            <TooltipProvider>
                <SimpleBar
                    className="block-full"
                    style={{ maxHeight: "100%", height: "100%" }}
                    autoHide={false}
                >
                    {messages.length === 0 ? (
                        <p className="body-sm bg-canvas/40 px-5 py-10 text-center text-ink-muted">
                            No messages yet. Say hello.
                        </p>
                    ) : (
                        <ul className={cn("flex flex-col gap-4 bg-canvas/40 p-5")}>
                            {messages.map((message) => (
                                <ChatMessageRow key={message.id} message={message} />
                            ))}
                            <div ref={bottomRef} />
                        </ul>
                    )}
                </SimpleBar>
            </TooltipProvider>
        </AppModal>
    );
}
