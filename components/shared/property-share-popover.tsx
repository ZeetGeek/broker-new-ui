"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import { Check, Link2, Share2 } from "lucide-react";

import {
    buildFacebookShareUrl,
    buildPinterestShareUrl,
    buildPropertyShareText,
    buildPropertyShareUrl,
    buildSkypeShareUrl,
    buildTelegramShareUrl,
    buildWhatsAppShareUrl,
    type PropertyShareInput,
} from "@/lib/share/property";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import shareBrands from "./thesvg-color-share.json";

addCollection(shareBrands as Parameters<typeof addCollection>[0]);

type ShareBrandIcon =
    | "thesvg-color:skype"
    | "thesvg-color:whatsapp"
    | "thesvg-color:facebook"
    | "thesvg-color:pinterest"
    | "thesvg-color:telegram";

type ShareChannel = {
    id: string;
    label: string;
    icon: ShareBrandIcon;
    href: string;
};

export type PropertySharePopoverProps = {
    listing: PropertyShareInput;
    className?: string;
};

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

    useEffect(() => {
        if (!open) setCopied(false);
    }, [open]);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
        } catch {
            const input = document.createElement("input");
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
        }
    }, [shareUrl]);

    const channels: ShareChannel[] = useMemo(
        () => [
            {
                id: "skype",
                label: "Skype",
                icon: "thesvg-color:skype",
                href: buildSkypeShareUrl(shareUrl, shareText),
            },
            {
                id: "whatsapp",
                label: "WhatsApp",
                icon: "thesvg-color:whatsapp",
                href: buildWhatsAppShareUrl(shareUrl, shareText),
            },
            {
                id: "facebook",
                label: "Facebook",
                icon: "thesvg-color:facebook",
                href: buildFacebookShareUrl(shareUrl),
            },
            {
                id: "pinterest",
                label: "Pinterest",
                icon: "thesvg-color:pinterest",
                href: buildPinterestShareUrl(shareUrl, shareText),
            },
            {
                id: "telegram",
                label: "Telegram",
                icon: "thesvg-color:telegram",
                href: buildTelegramShareUrl(shareUrl, shareText),
            },
        ],
        [shareText, shareUrl],
    );

    const trigger = (
        <DialogTrigger
            render={
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    aria-label="Share listing"
                    className={cn("h-auto gap-1.5 p-0 font-medium", className)}
                />
            }
        >
            <Share2 aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
            Share
        </DialogTrigger>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip open={open ? false : undefined}>
                <TooltipTrigger render={trigger} />
                <TooltipContent side="bottom">Share this listing with a client</TooltipContent>
            </Tooltip>

            <DialogPopup className="max-inline-sm gap-6 sm:[--dialog-pad:1.75rem]">
                <DialogHeader className="gap-1 text-start">
                    <DialogTitle className="font-display text-xl font-semibold text-ink">
                        Share
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Share this property listing with a client
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                        <p className="body-sm font-medium text-ink-muted">Share link via</p>
                        <div className="flex items-center justify-between gap-2">
                            {channels.map((channel) => (
                                <a
                                    key={channel.id}
                                    href={channel.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Share via ${channel.label}`}
                                    className="
                                      flex shrink-0 items-center justify-center rounded-2xl
                                      bg-surface-muted transition-transform duration-160
                                      block-11 inline-11
                                      hover:scale-[1.04] active:scale-[0.97]
                                    "
                                >
                                    <Icon
                                        icon={channel.icon}
                                        width={28}
                                        height={28}
                                        className="block-7 inline-7"
                                        aria-hidden
                                    />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="body-sm font-medium text-ink-muted">Page direct</p>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => void handleCopyLink()}
                            className="
                              w-full justify-center gap-2 rounded-full bg-surface-muted
                              font-medium text-ink
                              hover:bg-surface-muted/80
                            "
                        >
                            {copied ? (
                                <Check
                                    aria-hidden
                                    className="block-4 inline-4 text-brand"
                                    strokeWidth={2}
                                />
                            ) : (
                                <Link2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            )}
                            {copied ? "Copied" : "Copy Link"}
                        </Button>
                    </div>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
