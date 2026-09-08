"use client";

import { Check, CheckCheck } from "lucide-react";

import { formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { ChatAttachmentBlock } from "@/features/chat/chat-attachments";
import type { ChatMessage } from "@/features/chat/types";

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

export function ChatMessageRow({ message }: { message: ChatMessage }) {
    const { isOwn, text, attachment, status } = message;
    const time = formatTimeIn(new Date(message.sentAt));

    return (
        <li className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
            <div
                className={cn(
                    `
                      flex flex-col gap-2 rounded-card px-3.5 py-2.5 text-start shadow-xs
                      max-inline-[min(26rem,76%)]
                    `,
                    // Brand green rather than ink: the product runs one hue, and
                    // a black bubble on warm cream reads as a foreign component.
                    // The tail-side corner is squared off so which way a message
                    // points stays legible without reading it.
                    isOwn
                        ? "rounded-ee-sm bg-brand text-surface"
                        : "rounded-es-sm border border-border-warm bg-surface text-ink",
                    // Attachment bubbles carry their own padding rhythm.
                    attachment && !text && "p-2",
                )}
            >
                {attachment ? <ChatAttachmentBlock attachment={attachment} /> : null}

                {text ? (
                    <p className="body-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                ) : null}
            </div>

            <div className="flex items-center gap-1 text-ink-muted">
                <span className="body-xs tabular">{time}</span>
                {isOwn && status ? <StatusTick status={status} /> : null}
            </div>
        </li>
    );
}
