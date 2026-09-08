"use client";

import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";

/**
 * Opens the one global chat modal for this person. Every card that shows a
 * name can drop this in without owning a dialog of its own.
 */
export function ChatButton({
    peer,
    className,
    size = "icon-sm",
}: {
    peer: ChatPeer;
    className?: string;
    size?: "icon-xs" | "icon-sm" | "icon";
}) {
    const { openChat } = useChat();

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size={size}
                        onClick={() => openChat(peer)}
                        aria-label={`Message ${peer.name}`}
                        className={cn("shrink-0 border-border-warm text-ink-muted", className)}
                    >
                        <MessageSquare aria-hidden strokeWidth={1.75} />
                    </Button>
                }
            />
            <TooltipContent>Message {peer.name}.</TooltipContent>
        </Tooltip>
    );
}
