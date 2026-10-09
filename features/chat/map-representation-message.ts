import type { RepresentationMessage } from "@/lib/api/representative";

import type { ChatAttachment, ChatMessage } from "@/features/chat/types";

function formatBytes(size: number | null | undefined): string {
    if (size == null || size <= 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10_240 ? 1 : 0)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toAttachment(message: RepresentationMessage): ChatAttachment | undefined {
    const url = message.attachmentUrl?.trim();
    if (!url) return undefined;

    const id = `att-${message.id}`;
    const name = message.attachmentName?.trim() || "Attachment";
    const sizeLabel = formatBytes(message.attachmentSize);
    const mime = message.attachmentMime?.toLowerCase() ?? "";

    if (mime.startsWith("image/")) {
        return {
            kind: "media",
            id,
            items: [{ id: `${id}-0`, src: url, kind: "image" }],
        };
    }

    // Unknown / missing mime still shows as a downloadable file card when a
    // URL exists — never drop the attachment into an empty bubble.
    return {
        kind: "file",
        id,
        name,
        sizeLabel: sizeLabel || "Document",
        url,
    };
}

export function mapRepresentationMessage(
    message: RepresentationMessage,
    mySide: "owner" | "broker",
): ChatMessage {
    const text = message.body?.trim() || undefined;
    const attachment = toAttachment(message);
    const isOwn = message.sender === mySide;

    return {
        id: message.id,
        isOwn,
        text,
        sentAt: message.createdAt ?? new Date().toISOString(),
        status: isOwn ? "sent" : undefined,
        attachment,
    };
}
