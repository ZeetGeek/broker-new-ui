"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import { Bookmark, Check, Ellipsis, History, Link2, MessageCircle, Share2, X } from "lucide-react";

import { formatWhatsAppUrl } from "@/lib/format/phone";
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

import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/shared/overlay-card";
import shareBrands from "@/components/shared/thesvg-color-share.json";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export type PropertyCardMenuContact = {
    name: string;
    phoneDigits?: string;
    onMessage?: () => void;
};

export type PropertyCardMenuProps = {
    listing: PropertyShareInput;
    isSaved?: boolean;
    onToggleSave?: () => void;
    /** Message / WhatsApp the owner (or broker). */
    contact?: PropertyCardMenuContact;
    onOpenTimeline?: () => void;
    onCancelRequest?: () => void;
    /** Extra items after the standard actions. */
    extraItems?: ReactNode;
    /** `overlay` = glass circle on photo. `plain` = muted icon in list rows. */
    tone?: "overlay" | "plain";
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

const MENU_CONTENT_CLASS = `
  t-dropdown rounded-card border border-ink/10 bg-surface p-1.5 text-ink shadow-lg
  ring-0 min-inline-56
  before:backdrop-blur-none
`;

const ITEM_CLASS = `
  body-sm gap-3 rounded-inner px-2.5 py-2.5 font-medium text-ink
  focus:bg-surface-muted focus:text-ink
  data-highlighted:bg-surface-muted data-highlighted:text-ink
`;

/**
 * One ⋯ control for listing cards: Share (submenu), Save, Message, WhatsApp,
 * plus deal extras. Replaces the stacked photo icon buttons.
 */
export function PropertyCardMenu({
    listing,
    isSaved = false,
    onToggleSave,
    contact,
    onOpenTimeline,
    onCancelRequest,
    extraItems,
    tone = "overlay",
    className,
}: PropertyCardMenuProps) {
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
            // Cancelled — leave menu open.
        }
    }, [handleCopyLink, listing.title, shareText, shareUrl]);

    const channels: ShareChannel[] = useMemo(
        () => [
            {
                id: "whatsapp",
                label: "WhatsApp",
                icon: "thesvg-color:whatsapp",
                iconSize: 18,
                href: buildWhatsAppShareUrl(shareUrl, shareText),
            },
            {
                id: "facebook",
                label: "Facebook",
                icon: "thesvg-color:facebook",
                iconSize: 18,
                href: buildFacebookShareUrl(shareUrl),
            },
            {
                id: "telegram",
                label: "Telegram",
                icon: "thesvg-color:telegram",
                iconSize: 18,
                href: buildTelegramShareUrl(shareUrl, shareText),
            },
            {
                id: "instagram",
                label: "Instagram",
                icon: "thesvg-color:instagram",
                iconSize: 16,
                action: "copy",
            },
            {
                id: "email",
                label: "Email",
                icon: "thesvg-color:gmail-2026",
                iconSize: 16,
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

    const hasContact = Boolean(contact?.onMessage || contact?.phoneDigits);
    const hasDealExtras = Boolean(onOpenTimeline || onCancelRequest || extraItems);

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger
                render={
                    <Button
                        type="button"
                        size={tone === "overlay" ? "icon" : "icon-sm"}
                        variant="ghost"
                        aria-label="More actions"
                        aria-haspopup="menu"
                        className={cn(
                            tone === "overlay"
                                ? OVERLAY_ICON_BUTTON_CLASS
                                : "mbs-0.5 self-start text-ink-muted",
                            className,
                        )}
                    />
                }
            >
                <Ellipsis aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className={MENU_CONTENT_CLASS}
            >
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={ITEM_CLASS}>
                        <Share2
                            aria-hidden
                            className="block-4 inline-4 text-ink-muted"
                            strokeWidth={1.75}
                        />
                        Share
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        className={cn(
                            MENU_CONTENT_CLASS,
                            "before:hidden dark:bg-surface min-inline-48",
                        )}
                        sideOffset={6}
                    >
                        {channels.map((channel) => {
                            const mark = channel.icon ? (
                                <span
                                    className="flex shrink-0 items-center justify-center block-4 inline-4"
                                    aria-hidden
                                >
                                    <Icon
                                        icon={channel.icon}
                                        width={channel.iconSize ?? 18}
                                        height={channel.iconSize ?? 18}
                                    />
                                </span>
                            ) : (
                                <Share2
                                    aria-hidden
                                    className="block-4 inline-4 text-ink-muted"
                                    strokeWidth={1.75}
                                />
                            );

                            if (channel.action === "native-share") {
                                return (
                                    <DropdownMenuItem
                                        key={channel.id}
                                        className={ITEM_CLASS}
                                        onClick={() => void handleNativeShare()}
                                    >
                                        {mark}
                                        {channel.label}
                                    </DropdownMenuItem>
                                );
                            }

                            if (channel.action === "copy") {
                                return (
                                    <DropdownMenuItem
                                        key={channel.id}
                                        className={ITEM_CLASS}
                                        onClick={() => void handleCopyLink()}
                                    >
                                        {mark}
                                        {channel.label}
                                    </DropdownMenuItem>
                                );
                            }

                            return (
                                <DropdownMenuItem
                                    key={channel.id}
                                    className={ITEM_CLASS}
                                    onClick={() => {
                                        if (!channel.href) return;
                                        if (channel.id === "email") {
                                            window.location.href = channel.href;
                                        } else {
                                            window.open(
                                                channel.href,
                                                "_blank",
                                                "noopener,noreferrer",
                                            );
                                        }
                                        setOpen(false);
                                    }}
                                >
                                    {mark}
                                    {channel.label}
                                </DropdownMenuItem>
                            );
                        })}

                        <DropdownMenuSeparator className="mx-1.5 my-1 bg-ink/8" />

                        <DropdownMenuItem
                            className={ITEM_CLASS}
                            onClick={() => void handleCopyLink()}
                        >
                            {copied ? (
                                <Check
                                    aria-hidden
                                    className="block-4 inline-4 text-brand"
                                    strokeWidth={2}
                                />
                            ) : (
                                <Link2
                                    aria-hidden
                                    className="block-4 inline-4 text-ink-muted"
                                    strokeWidth={1.75}
                                />
                            )}
                            {copied ? "Link copied" : "Copy link"}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {onToggleSave ? (
                    <DropdownMenuItem className={ITEM_CLASS} onClick={onToggleSave}>
                        <Bookmark
                            aria-hidden
                            className={cn(
                                "block-4 inline-4",
                                isSaved ? "fill-brand text-brand" : "text-ink-muted",
                            )}
                            strokeWidth={1.75}
                        />
                        {isSaved ? "Remove save" : "Save"}
                    </DropdownMenuItem>
                ) : null}

                {hasContact ? <DropdownMenuSeparator className="mx-1.5 my-1 bg-ink/8" /> : null}

                {contact?.onMessage ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            contact.onMessage?.();
                            setOpen(false);
                        }}
                    >
                        <MessageCircle
                            aria-hidden
                            className="block-4 inline-4 text-ink-muted"
                            strokeWidth={1.75}
                        />
                        Message {contact.name.split(" ")[0]}
                    </DropdownMenuItem>
                ) : null}

                {contact?.phoneDigits ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            window.open(
                                formatWhatsAppUrl(contact.phoneDigits!),
                                "_blank",
                                "noopener,noreferrer",
                            );
                            setOpen(false);
                        }}
                    >
                        <span
                            className="flex shrink-0 items-center justify-center block-4 inline-4"
                            aria-hidden
                        >
                            <Icon icon="thesvg-color:whatsapp" width={16} height={16} />
                        </span>
                        WhatsApp {contact.name.split(" ")[0]}
                    </DropdownMenuItem>
                ) : null}

                {hasDealExtras ? <DropdownMenuSeparator className="mx-1.5 my-1 bg-ink/8" /> : null}

                {onOpenTimeline ? (
                    <DropdownMenuItem className={ITEM_CLASS} onClick={onOpenTimeline}>
                        <History
                            aria-hidden
                            className="block-4 inline-4 text-ink-muted"
                            strokeWidth={1.75}
                        />
                        What happened
                    </DropdownMenuItem>
                ) : null}

                {onCancelRequest ? (
                    <DropdownMenuItem
                        variant="destructive"
                        className={cn(
                            ITEM_CLASS,
                            "text-danger focus:bg-danger/10 focus:text-danger",
                        )}
                        onClick={onCancelRequest}
                    >
                        <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Cancel request
                    </DropdownMenuItem>
                ) : null}

                {extraItems}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
