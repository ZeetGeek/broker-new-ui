"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { ChatModal } from "@/features/chat/chat-modal";
import type { ChatPeer } from "@/features/chat/types";

type ChatContextValue = {
    /** Open the thread with this person. Replaces whoever was open before. */
    openChat: (peer: ChatPeer) => void;
    closeChat: () => void;
    /** Who is open right now, or null when the modal is closed. */
    peer: ChatPeer | null;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Mounts one chat modal for the whole portal. Any card can open a thread
 * without rendering a dialog of its own, so a list of twenty requests still
 * costs exactly one modal.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
    const [peer, setPeer] = useState<ChatPeer | null>(null);

    const openChat = useCallback((next: ChatPeer) => setPeer(next), []);
    const closeChat = useCallback(() => setPeer(null), []);

    const value = useMemo(() => ({ openChat, closeChat, peer }), [openChat, closeChat, peer]);

    return (
        <ChatContext.Provider value={value}>
            {children}
            <ChatModal
                peer={peer}
                open={peer !== null}
                onOpenChange={(next) => {
                    if (!next) closeChat();
                }}
            />
        </ChatContext.Provider>
    );
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error("useChat must be used inside ChatProvider");
    }
    return ctx;
}
