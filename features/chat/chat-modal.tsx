"use client";

import { Fragment, type UIEvent, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import SimpleBar from "simplebar-react";

import { ApiError } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { type RepresentationMessage, representativeApi } from "@/lib/api/representative";
import { formatDateShort, isSameCalendarDay } from "@/lib/format/date";
import { getNotificationSocket } from "@/lib/socket/notifications";

import { AppImage } from "@/components/shared/app-image";
import { ChevronDown, XIcon } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatComposer } from "@/features/chat/chat-composer";
import { ChatMessageRow } from "@/features/chat/chat-message";
import { mapRepresentationMessage } from "@/features/chat/map-representation-message";
import type { ChatMessage, ChatPeer } from "@/features/chat/types";
import { useAppSelector } from "@/store/hooks";

import "simplebar-react/dist/simplebar.min.css";
/** Name, presence and role — no call buttons, by product decision. */
function ChatHeader({ peer }: { peer: ChatPeer }) {
    return (
        <div className="flex flex-1 items-center gap-3 min-inline-0">
            <UserAvatar name={peer.name} imageUrl={peer.avatarUrl} size="md" />

            <div className="flex flex-1 flex-col gap-1 min-inline-0">
                <DialogTitle className="truncate font-display text-lg/tight font-semibold text-ink">
                    {peer.name}
                </DialogTitle>
                <div className="flex items-center gap-2 min-inline-0">
                    {typeof peer.isOnline === "boolean" ? (
                        <Badge
                            role="status"
                            className="px-2 py-0.5 tracking-normal"
                            customColor={
                                peer.isOnline
                                    ? {
                                          bg: "var(--color-brand-soft)",
                                          text: "var(--color-brand-text)",
                                          dot: "var(--color-brand)",
                                      }
                                    : {
                                          bg: "var(--color-surface-muted)",
                                          text: "var(--color-ink)",
                                          dot: "var(--color-ink-subtle)",
                                      }
                            }
                        >
                            {peer.isOnline ? "Online" : "Offline"}
                        </Badge>
                    ) : null}
                    {typeof peer.isOnline === "boolean" && peer.roleLabel ? (
                        <span aria-hidden className="shrink-0 text-ink/40">
                            ·
                        </span>
                    ) : null}
                    {peer.roleLabel ? (
                        <span className="truncate text-sm font-medium text-ink/65 min-inline-0">
                            {peer.roleLabel}
                        </span>
                    ) : null}
                </div>
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
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [awayFromBottom, setAwayFromBottom] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const followLatestRef = useRef(true);
    /** Messages that arrived over the socket while the thread fetch was in flight. */
    const pendingLiveRef = useRef<ChatMessage[]>([]);

    const representationId = peer?.representationId;
    const mySide = peer?.mySide ?? "broker";
    const canSend = peer?.canSend !== false && !peer?.closed;

    useEffect(() => {
        if (!open || !representationId) return;

        let cancelled = false;

        // Defer loading flags so the effect body stays free of synchronous setState
        // (react-hooks/set-state-in-effect). Same pattern as my-listings fetch.
        pendingLiveRef.current = [];
        followLatestRef.current = true;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setLoading(true);
            setLoadedKey(representationId);
            setAwayFromBottom(false);

            void representativeApi
                .messages(representationId)
                .then((rows) => {
                    if (cancelled) return;
                    const mapped = rows.map((row) => mapRepresentationMessage(row, mySide));
                    const ids = new Set(mapped.map((message) => message.id));
                    const extras = pendingLiveRef.current.filter((message) => !ids.has(message.id));
                    pendingLiveRef.current = [];
                    setMessages([...mapped, ...extras]);
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
        if (!open || !representationId || !accessToken || isMockMode()) return;

        const socket = getNotificationSocket(accessToken);
        const onMessage = (message: RepresentationMessage) => {
            if (message.representationId !== representationId) return;
            const mapped = mapRepresentationMessage(message, mySide);
            pendingLiveRef.current = [
                ...pendingLiveRef.current.filter((item) => item.id !== mapped.id),
                mapped,
            ];
            setMessages((prev) => {
                if (prev.some((item) => item.id === mapped.id)) return prev;
                return [...prev, mapped];
            });
        };

        socket.on("representation.message", onMessage);
        return () => {
            socket.off("representation.message", onMessage);
        };
    }, [open, representationId, accessToken, mySide]);

    useEffect(() => {
        if (!open || !followLatestRef.current) return;
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [open, messages, loading]);

    const handleSend = useCallback(
        async (text: string, file?: File) => {
            if (!peer?.representationId || !canSend || sending) return false;
            if (!text.trim() && !file) return false;

            setSending(true);
            try {
                const created = await representativeApi.addMessage(peer.representationId, {
                    message: text,
                    file,
                });
                const mapped = mapRepresentationMessage(created, mySide);
                followLatestRef.current = true;
                setMessages((prev) =>
                    prev.some((item) => item.id === mapped.id) ? prev : [...prev, mapped],
                );
                return true;
            } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Failed to send message");
                return false;
            } finally {
                setSending(false);
            }
        },
        [peer, canSend, sending, mySide],
    );

    const isStale = Boolean(representationId) && loadedKey !== representationId;
    const showLoading = loading || isStale;
    const showEmpty = !showLoading && messages.length === 0 && loadedKey === representationId;

    const scrollToLatest = () => {
        followLatestRef.current = true;
        bottomRef.current?.scrollIntoView({ block: "end" });
        setAwayFromBottom(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup
                showCloseButton={false}
                style={{ maxInlineSize: "36rem" }}
                className="
                  flex flex-col gap-0 overflow-hidden p-0 block-[min(90dvh,46rem)]
                  inline-[calc(100vw-1.5rem)] max-block-[calc(100dvh-1.5rem)]
                "
            >
                <TooltipProvider>
                    <header
                        style={{ paddingBlockStart: "calc(1.25rem + 3px)" }}
                        className="
                          relative flex shrink-0 items-center gap-3 border-be border-border-warm p-5
                          pe-16
                        "
                    >
                        {peer ? <ChatHeader peer={peer} /> : <DialogTitle>Chat</DialogTitle>}
                        <DialogClose
                            className="
                              absolute inset-e-5 inset-bs-1/2 flex shrink-0 -translate-y-1/2
                              items-center justify-center rounded-control border border-border-warm
                              bg-surface text-ink-muted
                              transition-[background-color,border-color,color,transform]
                              duration-160 block-control-md inline-control-md
                              hover:border-ink/20 hover:bg-ink/5 hover:text-ink
                              focus-visible:ring-2 focus-visible:ring-brand
                              focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                              active:scale-[0.94]
                            "
                            aria-label="Close chat"
                        >
                            <XIcon className="block-4 inline-4" strokeWidth={2} aria-hidden />
                        </DialogClose>
                    </header>

                    <div className="relative flex-1 min-block-0">
                        <SimpleBar
                            className="app-modal-simplebar block-full"
                            style={{ maxHeight: "100%", height: "100%" }}
                            ariaLabel="Conversation"
                            scrollableNodeProps={{
                                onScroll: (event: UIEvent<HTMLDivElement>) => {
                                    const node = event.currentTarget;
                                    const away =
                                        node.scrollHeight - node.scrollTop - node.clientHeight > 64;
                                    followLatestRef.current = !away;
                                    setAwayFromBottom(away);
                                },
                            }}
                            autoHide
                        >
                            {showLoading ? (
                                <div role="status" className="space-y-5 px-5 py-8">
                                    <span className="sr-only">Loading conversation…</span>
                                    <div
                                        aria-hidden
                                        className="space-y-5 motion-safe:animate-pulse"
                                    >
                                        <div
                                            className="
                                              rounded-inner bg-surface-muted block-14 inline-3/4
                                            "
                                        />
                                        <div
                                            className="
                                              ms-auto rounded-inner bg-brand-soft block-10
                                              inline-1/2
                                            "
                                        />
                                        <div
                                            className="
                                              rounded-inner bg-surface-muted block-20 inline-2/3
                                            "
                                        />
                                    </div>
                                </div>
                            ) : showEmpty ? (
                                <div
                                    role="status"
                                    className="
                                      flex flex-col items-center justify-center gap-4 px-6 py-8
                                      text-center min-block-[min(48dvh,24rem)]
                                    "
                                >
                                    <AppImage
                                        src="/illustrations/chat-empty-conversation.png"
                                        alt=""
                                        width={288}
                                        height={192}
                                        sizes="(max-width: 400px) 240px, 288px"
                                        className="
                                          object-contain block-auto inline-60 max-inline-full
                                          sm:inline-72
                                        "
                                        placeholder="empty"
                                    />
                                    <div className="space-y-2 max-inline-72">
                                        <p className="h6 text-ink">
                                            A good conversation starts with hello.
                                        </p>
                                        <p className="text-sm/relaxed font-medium text-ink/65">
                                            Ask a question or share a detail about this property.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ul
                                    aria-label="Messages"
                                    className="flex flex-col gap-4 px-4 py-5 sm:px-5"
                                >
                                    {messages.map((message, index) => {
                                        const previous = messages[index - 1];
                                        const date = new Date(message.sentAt);
                                        const showDate =
                                            !previous ||
                                            !isSameCalendarDay(new Date(previous.sentAt), date);
                                        return (
                                            <Fragment key={message.id}>
                                                {showDate ? (
                                                    <li
                                                        className="
                                                      flex items-center justify-center py-3
                                                    "
                                                    >
                                                        <time
                                                            dateTime={message.sentAt}
                                                            className="
                                                              body-xs font-semibold text-ink/65
                                                            "
                                                        >
                                                            {formatDateShort(date)}
                                                        </time>
                                                    </li>
                                                ) : null}
                                                <ChatMessageRow message={message} peer={peer} />
                                            </Fragment>
                                        );
                                    })}
                                </ul>
                            )}
                            <div ref={bottomRef} />
                        </SimpleBar>
                        {awayFromBottom && !showLoading ? (
                            <Button
                                type="button"
                                variant="surface"
                                size="icon-md"
                                aria-label="Go to latest messages"
                                onClick={scrollToLatest}
                                className="
                                  absolute inset-s-1/2 inset-be-3 -translate-x-1/2 rounded-full
                                "
                            >
                                <ChevronDown aria-hidden strokeWidth={1.75} />
                            </Button>
                        ) : null}
                    </div>

                    <footer className="shrink-0 px-5 pbs-3 pbe-5">
                        <ChatComposer
                            key={representationId ?? "chat"}
                            onSend={handleSend}
                            disabled={!canSend || showLoading || sending}
                            sending={sending}
                            closed={Boolean(peer?.closed)}
                            recipientName={peer?.name}
                        />
                    </footer>
                </TooltipProvider>
            </DialogPopup>
        </Dialog>
    );
}
