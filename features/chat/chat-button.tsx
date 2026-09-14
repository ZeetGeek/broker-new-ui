"use client";

import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import chatIcons from "@/features/chat/mdi-chat.json";
import type { ChatPeer } from "@/features/chat/types";

addCollection(chatIcons as Parameters<typeof addCollection>[0]);

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
    /** `overlay`: round glass button for the top of a photo card. */
    appearance?: "bare" | "overlay";
}) {
    const { openChat } = useChat();
    const isOverlay = appearance === "overlay";

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
                        <Icon
                            icon="mdi:chat"
                            width={isOverlay ? 18 : 24}
                            height={isOverlay ? 18 : 24}
                            className={isOverlay ? "block-4.5 inline-4.5" : "block-6 inline-6"}
                            aria-hidden
                        />
                    </Button>
                }
            />
            <TooltipContent>Message {peer.name}.</TooltipContent>
        </Tooltip>
    );
}
