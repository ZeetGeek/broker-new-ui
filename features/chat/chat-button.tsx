"use client";

import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/shared/overlay-card";
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
                    <Button
                        type="button"
                        variant="ghost"
                        size={isOverlay ? "icon" : size}
                        onClick={() => openChat(peer)}
                        aria-label={`Message ${peer.name}`}
                        className={cn(
                            isOverlay
                                ? OVERLAY_ICON_BUTTON_CLASS
                                : `
                                  shrink-0 bg-transparent p-0 text-ink-muted block-6! inline-6!
                                  hover:bg-transparent hover:text-ink
                                `,
                            className,
                        )}
                    >
                        {icon}
                    </Button>
                }
            />
            <TooltipContent>Message {peer.name}.</TooltipContent>
        </Tooltip>
    );
}
