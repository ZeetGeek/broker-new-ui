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
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

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
                label: copied ? "Copied" : "Copy link",
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
        <>
            <button
                type="button"
                aria-label="Share property"
                className={cn(
                    `
                      inline-flex shrink-0 items-center justify-center text-ink-muted
                      transition-colors duration-160
                      hover:text-ink
                      block-5 inline-5
                    `,
                    className,
                )}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(true);
                }}
            >
                <Share2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogPopup className="max-inline-sm gap-5 p-5">
                    <DialogHeader>
                        <DialogTitle>Share listing</DialogTitle>
                        <DialogDescription>
                            Send this property to a client or copy the link.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-2">
                        {channels.map((channel) => {
                            const Icon = channel.icon;
                            const content = (
                                <>
                                    <Icon
                                        className={cn(
                                            "block-4 inline-4 shrink-0",
                                            channel.accentClassName ?? "text-ink-muted",
                                        )}
                                    />
                                    <span className="truncate">{channel.label}</span>
                                </>
                            );

                            const itemClass = cn(
                                `
                                  body-sm flex items-center gap-2.5 rounded-inner border
                                  border-border-warm px-3 py-3 font-medium text-ink
                                  transition-colors duration-160
                                  hover:bg-surface-muted
                                `,
                                channel.id === "whatsapp" &&
                                    "border-brand/25 bg-brand-soft/50 hover:bg-brand-soft",
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
                </DialogPopup>
            </Dialog>
        </>
    );
}
