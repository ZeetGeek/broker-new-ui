"use client";

import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

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
                        variant="ghost"
                        size={size}
                        onClick={() => openChat(peer)}
                        aria-label={`Message ${peer.name}`}
                        className={cn(
                            `
                              shrink-0 bg-transparent p-0 text-ink-muted block-6! inline-6!
                              hover:bg-transparent hover:text-ink
                            `,
                            className,
                        )}
                    >
                        <Icon
                            icon="mdi:chat"
                            width={24}
                            height={24}
                            className="block-6 inline-6"
                            aria-hidden
                        />
                    </Button>
                }
            />
            <TooltipContent>Message {peer.name}.</TooltipContent>
        </Tooltip>
    );
}
