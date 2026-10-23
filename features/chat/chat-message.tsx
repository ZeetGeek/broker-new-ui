"use client";

import { ContextMenu } from "@base-ui/react/context-menu";

import { formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Check, CheckCheck, Trash2 } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";

import { ChatAttachmentBlock } from "@/features/chat/chat-attachments";
import type { ChatMessage, ChatPeer } from "@/features/chat/types";

/** One tick for sent, two for delivered, two filled-in for read. */
function StatusTick({ status }: { status: NonNullable<ChatMessage["status"]> }) {
    const Icon = status === "sent" ? Check : CheckCheck;

    return (
        <Icon
            aria-hidden
            className={cn("block-3.5 inline-3.5", status === "read" && "text-success")}
            strokeWidth={2}
        />
    );
}

export function ChatMessageRow({
    message,
    peer,
    onDelete,
}: {
    message: ChatMessage;
    peer: ChatPeer | null;
    onDelete?: (messageId: string) => void;
}) {
    const { isOwn, text, attachment, status } = message;
    const time = formatTimeIn(new Date(message.sentAt));
    const attachmentOnly = Boolean(attachment) && !text;
    const hasMedia = attachment?.kind === "media";

    const row = (
        <li className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
            {!isOwn && peer ? (
                <UserAvatar
                    name={peer.name}
                    imageUrl={peer.avatarUrl}
                    size="xs"
                    className="mbe-5"
                />
            ) : null}
            <div className="flex flex-col gap-1 max-inline-[82%] min-inline-0">
                <Bubble
                    variant={hasMedia ? "ghost" : isOwn ? "tinted" : "muted"}
                    align={isOwn ? "end" : "start"}
                    className="max-inline-full"
                >
                    <BubbleContent
                        className={cn(
                            "flex flex-col gap-2 text-start",
                            isOwn ? "rounded-ee-sm" : "rounded-es-sm",
                            attachmentOnly && !hasMedia && "p-2",
                            hasMedia && "overflow-visible border-0 text-ink",
                        )}
                    >
                        {attachment ? (
                            <ChatAttachmentBlock attachment={attachment} isOwn={isOwn} />
                        ) : null}

                        {text && !hasMedia ? (
                            <p className="font-medium wrap-anywhere whitespace-pre-wrap">{text}</p>
                        ) : null}
                    </BubbleContent>
                </Bubble>

                {text && hasMedia ? (
                    <Bubble
                        variant={isOwn ? "tinted" : "muted"}
                        align={isOwn ? "end" : "start"}
                        className="max-inline-full"
                    >
                        <BubbleContent className={isOwn ? "rounded-ee-sm" : "rounded-es-sm"}>
                            <p className="font-medium wrap-anywhere whitespace-pre-wrap">{text}</p>
                        </BubbleContent>
                    </Bubble>
                ) : null}

                <div className={cn("flex items-center gap-1 text-ink/65", isOwn && "justify-end")}>
                    <time dateTime={message.sentAt} className="body-xs tabular font-medium">
                        {time}
                    </time>
                    {isOwn && status ? (
                        <>
                            <StatusTick status={status} />
                            <span className="sr-only">{status}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </li>
    );

    if (!isOwn) return row;

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger
                render={row}
                tabIndex={0}
                aria-label="Your message. Right click or long press for options."
                className="
                  rounded-inner
                  focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none
                "
            />
            <ContextMenu.Portal>
                <ContextMenu.Positioner className="z-50 outline-none" sideOffset={4}>
                    <ContextMenu.Popup
                        className="
                      rounded-card bg-popover p-1.5 text-popover-foreground shadow-lg ring-1
                      ring-foreground/10 outline-none min-inline-48
                    "
                    >
                        <ContextMenu.Item
                            disabled={!onDelete}
                            onClick={() => onDelete?.(message.id)}
                            className="
                              flex items-center gap-2.5 rounded-inner px-3 py-2.5 text-sm
                              font-medium text-destructive outline-none select-none
                              data-highlighted:bg-destructive/10
                              data-disabled:opacity-50
                            "
                        >
                            <Trash2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Delete message
                        </ContextMenu.Item>
                        {!onDelete ? (
                            <p className="px-3 py-2 text-xs/relaxed text-ink-muted max-inline-52">
                                Message deletion isn’t available yet.
                            </p>
                        ) : null}
                    </ContextMenu.Popup>
                </ContextMenu.Positioner>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}
