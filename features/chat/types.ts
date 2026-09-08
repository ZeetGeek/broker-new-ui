/**
 * Who the current user is talking to. Denormalized on purpose — a chat opens
 * from a request card, an invite card or a client row, and none of those
 * should have to fetch a peer profile just to show a name in the header.
 */
export type ChatPeer = {
    id: string;
    name: string;
    avatarUrl?: string;
    /** Shown under the name. Falsy means the presence line is hidden. */
    isOnline?: boolean;
    /** Optional context line — "Owner", "Buyer", the property title. */
    roleLabel?: string;
};

/** One image or video in a gallery message. */
export type ChatMedia = {
    id: string;
    src: string;
    /** Videos carry a runtime badge; images do not. */
    durationLabel?: string;
    kind: "image" | "video";
};

export type ChatAttachment =
    /** A downloadable document — the pdf card in the design. */
    | { kind: "file"; id: string; name: string; sizeLabel: string; url: string }
    /** A voice note. Rendered with the native audio transport. */
    | { kind: "audio"; id: string; url: string; durationLabel?: string }
    /** One or many images/videos. 5+ collapse behind a "+N" tile. */
    | { kind: "media"; id: string; items: ChatMedia[] };

export type ChatMessage = {
    id: string;
    /** True when the current user sent it — drives side and bubble colour. */
    isOwn: boolean;
    /** Optional when the message is attachment-only. */
    text?: string;
    /** ISO instant. Formatted at render so the clock stays live. */
    sentAt: string;
    /** Own messages only. Drives the tick. */
    status?: "sent" | "delivered" | "read";
    attachment?: ChatAttachment;
};

export type ChatThread = {
    peer: ChatPeer;
    messages: ChatMessage[];
};
