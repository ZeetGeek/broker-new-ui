"use client";

import toast from "react-hot-toast";

import { formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Check, CheckCheck, Copy, MoreHorizontal } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function ChatMessageRow({ message, peer }: { message: ChatMessage; peer: ChatPeer | null }) {
    const { isOwn, text, attachment, status } = message;
    const time = formatTimeIn(new Date(message.sentAt));
    const attachmentOnly = Boolean(attachment) && !text;

    return (
        <li className={cn("group/message flex items-end gap-2", isOwn && "flex-row-reverse")}>
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
                    variant={isOwn ? "tinted" : "muted"}
                    align={isOwn ? "end" : "start"}
                    className="max-inline-full"
                >
                    <BubbleContent
                        className={cn(
                            "flex flex-col gap-2 text-start",
                            isOwn ? "rounded-ee-sm" : "rounded-es-sm",
                            attachmentOnly && "p-2",
                        )}
                    >
                        {attachment ? (
                            <ChatAttachmentBlock attachment={attachment} isOwn={isOwn} />
                        ) : null}

                        {text ? (
                            <p className="font-medium wrap-anywhere whitespace-pre-wrap">{text}</p>
                        ) : null}
                    </BubbleContent>
                </Bubble>

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
            {text ? (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-md"
                                aria-label="Message actions"
                                className="
                                  shrink-0 self-center text-ink/60
                                  group-focus-within/message:opacity-100
                                  group-hover/message:opacity-100
                                  hover:bg-surface-muted hover:text-ink
                                  aria-expanded:opacity-100
                                  pointer-fine:opacity-0
                                "
                            />
                        }
                    >
                        <MoreHorizontal aria-hidden strokeWidth={1.75} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwn ? "end" : "start"} className="min-inline-36">
                        <DropdownMenuItem
                            onClick={() => {
                                void navigator.clipboard
                                    .writeText(text)
                                    .then(() => toast.success("Message copied"))
                                    .catch(() =>
                                        toast.error(
                                            "Couldn't copy this message. Try selecting the text.",
                                        ),
                                    );
                            }}
                        >
                            <Copy aria-hidden />
                            Copy message
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </li>
    );
}
