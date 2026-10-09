/**
 * Who the current user is talking to. Denormalized on purpose — a chat opens
 * from a request card or invite card, and those should not have to fetch a
 * peer profile just to show a name in the header.
 *
 * Representation request chat is the only live thread: `representationId`
 * keys the API. Without it the modal stays closed.
 */
export type ChatPeer = {
    id: string;
    name: string;
    avatarUrl?: string;
    /** Shown under the name. Falsy means the presence line is hidden. */
    isOnline?: boolean;
    /** Optional context line — "Owner", the property title. */
    roleLabel?: string;
    /** Representation id — required to load/send on the live API. */
    representationId: string;
    /** Caller's side of the deal. Defaults to broker in the broker portal. */
    mySide?: "owner" | "broker";
    /** When false, composer is read-only. */
    canSend?: boolean;
    /** Closed statuses — messaging refused by the API. */
    closed?: boolean;
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
