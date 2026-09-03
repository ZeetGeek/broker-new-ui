"use client";

import { useCallback, useEffect, useMemo, useState, type SVGProps } from "react";

import { Check, Copy, Mail, MessageCircle, Share2, Send } from "lucide-react";

import {
    buildEmailShareUrl,
    buildFacebookShareUrl,
    buildLinkedInShareUrl,
    buildPropertyShareText,
    buildPropertyShareUrl,
    buildTelegramShareUrl,
    buildWhatsAppShareUrl,
    buildXShareUrl,
    type PropertyShareInput,
} from "@/lib/share/property";
import { cn } from "@/lib/utils";

import {
    MorphingPopover,
    MorphingPopoverContent,
    MorphingPopoverTrigger,
} from "@/components/motion-primitives/morphing-popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ShareIcon = (props: SVGProps<SVGSVGElement>) => React.ReactNode;

function FacebookIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
            <path d="M14 8h2.5V5.5C16.1 5.3 15 5 13.7 5 11.1 5 9.4 6.5 9.4 9.4V12H7v3h2.4v7h3.1v-7H15l.5-3h-3.1V9.6c0-.9.2-1.6 1.6-1.6z" />
        </svg>
    );
}

function LinkedInIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
            <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4C4.1 4 3.3 4.8 3.3 5.8S4.1 7.6 5.1 7.6 6.9 6.8 6.9 5.8 6.1 4 5.1 4zM20.3 20h-2.8v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H10.8V9.5h2.7v1.4h.1c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.4V20z" />
        </svg>
    );
}

function XIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
            <path d="M17.6 3h2.7l-5.9 6.7L22 21h-5.5l-4.3-5.6L7.2 21H4.5l6.3-7.2L2.4 3h5.6l3.9 5.2L17.6 3zm-1 16.2h1.5L7.5 4.7H5.9l10.7 14.5z" />
        </svg>
    );
}

type ShareChannel = {
    id: string;
    label: string;
    icon: ShareIcon;
    href?: string;
    onClick?: () => void | Promise<void>;
    accentClassName?: string;
};

function toShareIcon(Icon: typeof Share2): ShareIcon {
    return function LucideShareIcon({ className, ...props }) {
        return <Icon aria-hidden className={className} strokeWidth={1.75} {...props} />;
    };
}

export type PropertySharePopoverProps = {
    listing: PropertyShareInput;
    className?: string;
};

export function PropertySharePopover({ listing, className }: PropertySharePopoverProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    const shareUrl = useMemo(() => buildPropertyShareUrl(listing.id), [listing.id]);
    const shareText = useMemo(() => buildPropertyShareText(listing), [listing]);

    useEffect(() => {
        setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, []);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copied]);

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

    const handleNativeShare = useCallback(async () => {
        if (!navigator.share) return;
        try {
            await navigator.share({
                title: listing.title,
                text: shareText,
                url: shareUrl,
            });
            setOpen(false);
        } catch {
            // User cancelled — ignore.
        }
    }, [listing.title, shareText, shareUrl]);

    const channels: ShareChannel[] = useMemo(() => {
        const items: ShareChannel[] = [
            {
                id: "whatsapp",
                label: "WhatsApp",
                icon: toShareIcon(MessageCircle),
                href: buildWhatsAppShareUrl(shareUrl, shareText),
                accentClassName: "text-brand",
            },
            {
                id: "copy",
                label: copied ? "Copied" : "Copy",
                icon: toShareIcon(copied ? Check : Copy),
                onClick: handleCopyLink,
                accentClassName: copied ? "text-brand" : undefined,
            },
            {
                id: "telegram",
                label: "Telegram",
                icon: toShareIcon(Send),
                href: buildTelegramShareUrl(shareUrl, shareText),
            },
            {
                id: "facebook",
                label: "Facebook",
                icon: FacebookIcon,
                href: buildFacebookShareUrl(shareUrl),
            },
            {
                id: "linkedin",
                label: "LinkedIn",
                icon: LinkedInIcon,
                href: buildLinkedInShareUrl(shareUrl),
            },
            {
                id: "x",
                label: "X",
                icon: XIcon,
                href: buildXShareUrl(shareUrl, shareText),
            },
            {
                id: "email",
                label: "Email",
                icon: toShareIcon(Mail),
                href: buildEmailShareUrl(shareUrl, shareText),
            },
        ];

        if (canNativeShare) {
            items.splice(2, 0, {
                id: "native",
                label: "More",
                icon: toShareIcon(Share2),
                onClick: handleNativeShare,
            });
        }

        return items;
    }, [canNativeShare, copied, handleCopyLink, handleNativeShare, shareText, shareUrl]);

    return (
        <MorphingPopover
            open={open}
            onOpenChange={setOpen}
            className={cn("relative shrink-0", className)}
        >
            <TooltipProvider>
                <Tooltip open={open ? false : undefined}>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex">
                                <MorphingPopoverTrigger
                                    type="button"
                                    aria-label="Share listing"
                                    className="
                                      body-sm inline-flex items-center gap-1.5 font-medium
                                      text-ink-muted transition-colors duration-160
                                      hover:text-ink
                                    "
                                >
                                    <Share2
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={1.75}
                                    />
                                    <span>Share</span>
                                </MorphingPopoverTrigger>
                            </span>
                        }
                    />
                    <TooltipContent side="bottom">
                        Share this listing with a client
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <MorphingPopoverContent
                className="
                  z-30 mt-2 overflow-hidden rounded-card border border-border-warm bg-surface
                  p-3 text-ink shadow-lg inset-e-0 top-full min-inline-60
                "
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5 px-1">
                        <p className="body-sm font-semibold text-ink">Share listing</p>
                        <p className="body-xs text-ink-muted">Send this property to a client</p>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                        {channels.map((channel) => {
                            const Icon = channel.icon;
                            const content = (
                                <>
                                    <span
                                        className={cn(
                                            `
                                              flex items-center justify-center rounded-full
                                              bg-surface-muted block-9 inline-9
                                            `,
                                            channel.id === "whatsapp" && "bg-brand-soft",
                                            channel.id === "copy" &&
                                                copied &&
                                                "bg-brand-soft",
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "block-4 inline-4",
                                                channel.accentClassName ?? "text-ink-muted",
                                            )}
                                        />
                                    </span>
                                    <span className="body-xs text-center font-medium text-ink">
                                        {channel.label}
                                    </span>
                                </>
                            );

                            const itemClass = cn(
                                `
                                  flex flex-col items-center gap-1.5 rounded-inner px-1 py-2
                                  transition-colors duration-160
                                  hover:bg-surface-muted/70
                                `,
                            );

                            if (channel.href) {
                                return (
                                    <a
                                        key={channel.id}
                                        href={channel.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={itemClass}
                                        onClick={() => setOpen(false)}
                                    >
                                        {content}
                                    </a>
                                );
                            }

                            return (
                                <button
                                    key={channel.id}
                                    type="button"
                                    className={itemClass}
                                    onClick={() => {
                                        void channel.onClick?.();
                                    }}
                                >
                                    {content}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </MorphingPopoverContent>
        </MorphingPopover>
    );
}
