"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import { Check, Link2, Share2 } from "lucide-react";

import {
    buildEmailShareUrl,
    buildFacebookShareUrl,
    buildPropertyShareText,
    buildPropertyShareUrl,
    buildTelegramShareUrl,
    buildWhatsAppShareUrl,
    type PropertyShareInput,
} from "@/lib/share/property";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import shareBrands from "./thesvg-color-share.json";

addCollection(shareBrands as Parameters<typeof addCollection>[0]);

type ShareBrandIcon =
    | "thesvg-color:whatsapp"
    | "thesvg-color:telegram"
    | "thesvg-color:facebook"
    | "thesvg-color:instagram"
    | "thesvg-color:gmail-2026";

type ShareChannel = {
    id: string;
    label: string;
    href?: string;
    icon?: ShareBrandIcon;
    iconSize?: number;
    lucide?: "share";
    action?: "native-share" | "copy";
};

export type PropertySharePopoverProps = {
    listing: PropertyShareInput;
    className?: string;
};

async function copyText(value: string) {
    try {
        await navigator.clipboard.writeText(value);
    } catch {
        const input = document.createElement("input");
        input.value = value;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
    }
}

const rowClassName = `
  body-sm flex w-full items-center gap-3 rounded-inner px-2.5 py-2.5 font-medium
  text-ink-muted outline-none transition-colors duration-160
  hover:bg-surface-muted hover:text-ink
  focus-visible:bg-surface-muted focus-visible:text-ink
  focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset
`;

export function PropertySharePopover({ listing, className }: PropertySharePopoverProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = useMemo(() => buildPropertyShareUrl(listing.id), [listing.id]);
    const shareText = useMemo(() => buildPropertyShareText(listing), [listing]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setCopied(false);
    }, []);

    const handleCopyLink = useCallback(async () => {
        await copyText(shareUrl);
        setCopied(true);
    }, [shareUrl]);

    const handleNativeShare = useCallback(async () => {
        if (typeof navigator === "undefined" || !navigator.share) {
            await handleCopyLink();
            return;
        }
        try {
            await navigator.share({
                title: listing.title,
                text: shareText,
                url: shareUrl,
            });
            setOpen(false);
        } catch {
            // User cancelled or share failed — stay open.
        }
    }, [handleCopyLink, listing.title, shareText, shareUrl]);

    const channels: ShareChannel[] = useMemo(
        () => [
            {
                id: "whatsapp",
                label: "WhatsApp",
                icon: "thesvg-color:whatsapp",
                iconSize: 20,
                href: buildWhatsAppShareUrl(shareUrl, shareText),
            },
            {
                id: "facebook",
                label: "Facebook",
                icon: "thesvg-color:facebook",
                iconSize: 20,
                href: buildFacebookShareUrl(shareUrl),
            },
            {
                id: "telegram",
                label: "Telegram",
                icon: "thesvg-color:telegram",
                iconSize: 20,
                href: buildTelegramShareUrl(shareUrl, shareText),
            },
            {
                id: "instagram",
                label: "Instagram",
                icon: "thesvg-color:instagram",
                iconSize: 18,
                action: "copy",
            },
            {
                id: "email",
                label: "Email",
                icon: "thesvg-color:gmail-2026",
                iconSize: 18,
                href: buildEmailShareUrl(shareUrl, shareText),
            },
            {
                id: "native",
                label: "Share via…",
                lucide: "share",
                action: "native-share",
            },
        ],
        [shareText, shareUrl],
    );

    const trigger = (
        <DropdownMenuTrigger
            render={
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    aria-label="Share listing"
                    aria-haspopup="menu"
                    className={cn("gap-1.5 p-0 font-medium block-auto", className)}
                />
            }
        >
            <Share2 aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
            Share
        </DropdownMenuTrigger>
    );

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <Tooltip open={open ? false : undefined}>
                <TooltipTrigger render={trigger} />
                <TooltipContent side="bottom">Share this listing with a client</TooltipContent>
            </Tooltip>

            <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className={cn(
                    `
                      t-dropdown animate-none! rounded-inner border border-border-warm bg-surface
                      p-1.5 text-ink shadow-md ring-0 min-inline-52
                    `,
                    "before:backdrop-blur-none",
                    "data-open:animate-none! data-closed:animate-none!",
                )}
            >
                <div className="flex flex-col gap-0.5">
                    {channels.map((channel) => {
                        const mark = channel.icon ? (
                            <span
                                className="
                                  flex shrink-0 items-center justify-center block-5 inline-5
                                "
                                aria-hidden
                            >
                                <Icon
                                    icon={channel.icon}
                                    width={channel.iconSize ?? 20}
                                    height={channel.iconSize ?? 20}
                                />
                            </span>
                        ) : (
                            <Share2
                                aria-hidden
                                className="shrink-0 text-ink-muted block-5 inline-5"
                                strokeWidth={1.75}
                            />
                        );

                        if (channel.action === "native-share") {
                            return (
                                <button
                                    key={channel.id}
                                    type="button"
                                    className={rowClassName}
                                    onClick={() => void handleNativeShare()}
                                >
                                    {mark}
                                    {channel.label}
                                </button>
                            );
                        }

                        if (channel.action === "copy") {
                            return (
                                <button
                                    key={channel.id}
                                    type="button"
                                    className={rowClassName}
                                    onClick={() => void handleCopyLink()}
                                >
                                    {mark}
                                    {channel.label}
                                </button>
                            );
                        }

                        return (
                            <a
                                key={channel.id}
                                href={channel.href}
                                target={channel.id === "email" ? undefined : "_blank"}
                                rel={channel.id === "email" ? undefined : "noopener noreferrer"}
                                className={rowClassName}
                                onClick={() => setOpen(false)}
                            >
                                {mark}
                                {channel.label}
                            </a>
                        );
                    })}
                </div>

                <DropdownMenuSeparator className="mx-2.5 my-1.5 bg-border-warm" />

                <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className={rowClassName}
                >
                    {copied ? (
                        <Check
                            aria-hidden
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={2}
                        />
                    ) : (
                        <Link2
                            aria-hidden
                            className="shrink-0 text-ink-muted block-5 inline-5"
                            strokeWidth={1.75}
                        />
                    )}
                    {copied ? "Link copied" : "Copy link"}
                </button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
