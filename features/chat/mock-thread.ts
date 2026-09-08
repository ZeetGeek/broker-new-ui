import type { ChatMessage, ChatPeer } from "@/features/chat/types";

/** Minutes back from now, so the transcript always reads as "just happened". */
function minutesAgo(minutes: number): string {
    return new Date(Date.now() - minutes * 60_000).toISOString();
}

/**
 * Stand-in transcript until the messaging API exists. Seeded per peer rather
 * than shared, so two owners do not appear to be in one conversation, and
 * cached so a reopened thread looks the same as when it was closed.
 */
const THREADS = new Map<string, ChatMessage[]>();

function seedThread(peer: ChatPeer): ChatMessage[] {
    return [
        {
            id: `${peer.id}-1`,
            isOwn: false,
            text: "Hello. I saw your request. Which buyer are you bringing?",
            sentAt: minutesAgo(52),
        },
        {
            id: `${peer.id}-2`,
            isOwn: true,
            text: "A family from Adajan. They want to move in before Diwali.",
            sentAt: minutesAgo(48),
            status: "read",
        },
        {
            id: `${peer.id}-3`,
            isOwn: false,
            text: "Good. Send me whatever papers you have.",
            sentAt: minutesAgo(41),
        },
        {
            id: `${peer.id}-4`,
            isOwn: true,
            sentAt: minutesAgo(12),
            status: "delivered",
            attachment: {
                kind: "file",
                id: `${peer.id}-f1`,
                name: "important_documents.pdf",
                sizeLabel: "50 KB",
                url: "#",
            },
        },
        {
            id: `${peer.id}-5`,
            isOwn: true,
            sentAt: minutesAgo(11),
            status: "delivered",
            attachment: {
                kind: "audio",
                id: `${peer.id}-a1`,
                url: "",
                durationLabel: "0:12",
            },
        },
        {
            id: `${peer.id}-6`,
            isOwn: true,
            sentAt: minutesAgo(9),
            status: "sent",
            attachment: {
                kind: "media",
                id: `${peer.id}-v1`,
                items: [
                    {
                        id: "v1",
                        kind: "video",
                        src: "/properties/3.jpg",
                        durationLabel: "5:42",
                    },
                ],
            },
        },
        {
            id: `${peer.id}-7`,
            isOwn: true,
            sentAt: minutesAgo(8),
            status: "sent",
            attachment: {
                kind: "media",
                id: `${peer.id}-g1`,
                items: [
                    { id: "g1", kind: "image", src: "/properties/1.jpg" },
                    { id: "g2", kind: "image", src: "/properties/2.jpg" },
                    { id: "g3", kind: "image", src: "/properties/4.jpg" },
                    { id: "g4", kind: "image", src: "/properties/5.jpg" },
                    { id: "g5", kind: "image", src: "/properties/6.jpg" },
                    { id: "g6", kind: "image", src: "/properties/3.jpg" },
                ],
            },
        },
    ];
}

export function getMockThread(peer: ChatPeer): ChatMessage[] {
    const existing = THREADS.get(peer.id);
    if (existing) return existing;

    const seeded = seedThread(peer);
    THREADS.set(peer.id, seeded);
    return seeded;
}

/** Persist a locally-sent message so it survives closing the modal. */
export function appendMockMessage(peerId: string, message: ChatMessage): void {
    THREADS.set(peerId, [...(THREADS.get(peerId) ?? []), message]);
}
