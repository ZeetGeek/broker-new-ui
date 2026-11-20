"use client";
import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

import { IconButton } from "@/components/shared/icon-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import messageCircleIcons from "@/features/chat/lucide-message-circle.json";
import type { ChatPeer } from "@/features/chat/types";

addCollection(messageCircleIcons as Parameters<typeof addCollection>[0]);

/**
 * Opens the one global chat modal for this person. Every card that shows a
 * name can drop this in without owning a dialog of its own.
 */
export function ChatButton({
    peer,
    className,
    size = "icon-sm",
    appearance = "bare",
}: {
    peer: ChatPeer;
    className?: string;
    size?: "icon-xs" | "icon-sm" | "icon";
    /** `overlay`: glass on photo. `panel`: labeled footer button. */
    appearance?: "bare" | "overlay" | "panel";
}) {
    const { openChat } = useChat();
    const isOverlay = appearance === "overlay";
    const isPanel = appearance === "panel";
    const iconSize = isOverlay || isPanel ? 18 : 24;

    const icon = (
        <Icon
            icon="lucide:message-circle"
            width={iconSize}
            height={iconSize}
            className={isOverlay || isPanel ? "block-4.5 inline-4.5" : "block-6 inline-6"}
            aria-hidden
        />
    );

    if (isPanel) {
        return (
            <Button
                type="button"
                size="md"
                variant="outline"
                onClick={() => openChat(peer)}
                aria-label={`Message ${peer.name}`}
                className={cn("flex-1", className)}
            >
                {icon}
                Message
            </Button>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <IconButton
                        type="button"
                        size={size === "icon-xs" ? "xs" : size === "icon" ? "md" : "sm"}
                        onClick={() => openChat(peer)}
                        aria-label={`Message ${peer.name}`}
                        className={cn("shrink-0", className)}
                    >
                        {icon}
                    </IconButton>
                }
            />
            <TooltipContent>Message {peer.name}.</TooltipContent>
        </Tooltip>
    );
}
