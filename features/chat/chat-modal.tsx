"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import SimpleBar from "simplebar-react";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatComposer } from "@/features/chat/chat-composer";
import { ChatMessageRow } from "@/features/chat/chat-message";
import { mapRepresentationMessage } from "@/features/chat/map-representation-message";
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
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const representationId = peer?.representationId;
    const mySide = peer?.mySide ?? "broker";
    const canSend = peer?.canSend !== false && !peer?.closed;

    useEffect(() => {
        if (!open || !representationId) return;

        let cancelled = false;

        // Defer loading flags so the effect body stays free of synchronous setState
        // (react-hooks/set-state-in-effect). Same pattern as my-listings fetch.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setLoading(true);
            setLoadedKey(representationId);

            void representativeApi
                .messages(representationId)
                .then((rows) => {
                    if (cancelled) return;
                    setMessages(rows.map((row) => mapRepresentationMessage(row, mySide)));
                })
                .catch((error) => {
                    if (cancelled) return;
                    setMessages([]);
                    toast.error(
                        error instanceof ApiError ? error.message : "Failed to load messages",
                    );
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open, representationId, mySide]);

    useEffect(() => {
        if (!open) return;
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [open, messages, loading]);

    const handleSend = useCallback(
        async (text: string, file?: File) => {
            if (!peer?.representationId || !canSend || sending) return;
            if (!text.trim() && !file) return;

            setSending(true);
            try {
                const created = await representativeApi.addMessage(peer.representationId, {
                    message: text,
                    file,
                });
                setMessages((prev) => [...prev, mapRepresentationMessage(created, mySide)]);
            } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Failed to send message");
            } finally {
                setSending(false);
            }
        },
        [peer, canSend, sending, mySide],
    );

    const isStale = Boolean(representationId) && loadedKey !== representationId;
    const showLoading = loading || isStale;
    const showEmpty = !showLoading && messages.length === 0 && loadedKey === representationId;

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
            footer={
                <ChatComposer
                    onSend={handleSend}
                    disabled={!canSend || sending}
                    sending={sending}
                    closed={Boolean(peer?.closed)}
                />
            }
            footerClassName="block bg-surface"
        >
            <TooltipProvider>
                <SimpleBar
                    className="block-full"
                    style={{ maxHeight: "100%", height: "100%" }}
                    autoHide={false}
                >
                    {showLoading ? (
                        <p className="body-sm bg-canvas/40 px-5 py-10 text-center text-ink-muted">
                            Loading conversation…
                        </p>
                    ) : showEmpty ? (
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
