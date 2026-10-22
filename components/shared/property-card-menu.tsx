"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { addCollection, Icon } from "@iconify/react/offline";

import { formatPhoneIn, formatTelUrl } from "@/lib/format/phone";
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

import {
    Bookmark,
    Check,
    Ellipsis,
    History,
    Link2,
    Pencil,
    Phone,
    Share2,
    Trash2,
    UserPlus,
    UserRound,
} from "@/components/shared/icons";
import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/shared/overlay-card";
import tablerMenuIcons from "@/components/shared/tabler-menu.json";
import shareBrands from "@/components/shared/thesvg-color-share.json";
import { Button } from "@/components/ui/button";

import { REPRESENTATION_REMINDER_LIMIT } from "@/config/constants";

addCollection(tablerMenuIcons as Parameters<typeof addCollection>[0]);
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
    /** Shared phone — "Call …" in the ⋯ menu. */
    phoneDigits?: string;
    onMessage?: () => void;
};

export type PropertyCardMenuProps = {
    listing: PropertyShareInput;
    isSaved?: boolean;
    onToggleSave?: () => void;
    /** Call / message the owner (or broker). */
    contact?: PropertyCardMenuContact;
    /** Open the attach-buyers flow. */
    onAddBuyer?: () => void;
    isAddBuyerBlocked?: boolean;
    /** Owned inventory: attach or change the exclusive owner. */
    onAttachOwner?: () => void;
    /** Defaults to "Attach owner". */
    attachOwnerLabel?: string;
    /** Nudge the owner on a pending request to represent. */
    onRemind?: () => void;
    /** When false, reminder stays visible but disabled. Default true when `onRemind` is set. */
    canRemind?: boolean;
    /** Reminders already sent — shown as Remind used/limit under Chat. */
    remindersUsed?: number;
    /** Max reminders for this request. Defaults to REPRESENTATION_REMINDER_LIMIT. */
    remindersLimit?: number;
    onOpenTimeline?: () => void;
    onCancelRequest?: () => void;
    /** Accepted representation: end it ("Stop selling this property"). */
    onStopRepresenting?: () => void;
    /** Owned cards: open the edit form. */
    onEdit?: () => void;
    /** Owned cards: ask to delete this listing. */
    onDelete?: () => void;
    /** Owner cards: mark this listing as sold. */
    onMarkSold?: () => void;
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

const MENU_SURFACE_CLASS = `
  t-dropdown t-profile-menu animate-none! rounded-inner border border-border-warm
  bg-surface p-1.5 text-ink shadow-lg ring-0 min-inline-56
  before:backdrop-blur-none
  dark:bg-surface dark:text-ink
  data-closed:animate-none!
  data-open:animate-none!
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted!
  **:data-[slot$=-item]:focus:text-ink!
  **:data-[slot$=-trigger]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-trigger]:data-highlighted:text-ink!
  **:data-[slot$=-trigger]:focus:bg-surface-muted!
  **:data-[slot$=-trigger]:focus:text-ink!
  **:data-[slot$=-trigger]:aria-expanded:bg-surface-muted!
  **:data-[slot$=-trigger]:aria-expanded:text-ink!
  **:data-[variant=destructive]:data-highlighted:bg-danger-soft!
  **:data-[variant=destructive]:data-highlighted:text-danger!
  **:data-[variant=destructive]:focus:bg-danger-soft!
  **:data-[variant=destructive]:focus:text-danger!
`;

/* Kill shadcn’s focus:**:text-accent-foreground so icons never go white. */
const ITEM_CLASS = `
  body-sm h-10 cursor-pointer gap-3 rounded-inner px-3 font-medium text-ink
  focus:bg-surface-muted! focus:text-ink!
  data-highlighted:bg-surface-muted! data-highlighted:text-ink!
  data-popup-open:bg-surface-muted! data-popup-open:text-ink!
  data-open:bg-surface-muted! data-open:text-ink!
  not-data-[variant=destructive]:focus:**:text-ink!
  not-data-[variant=destructive]:data-highlighted:**:text-ink!
  data-popup-open:**:text-ink!
  data-open:**:text-ink!
`;

const ICON_CLASS = "menu-stroke-icon block-4 inline-4 shrink-0 text-ink!";
const SEPARATOR_CLASS = "mx-1.5 my-1 bg-border-warm";

/**
 * One ⋯ control for listing cards: Share (submenu), Save, Message,
 * plus deal extras. Call / WhatsApp live on the card owner section.
 */
export function PropertyCardMenu({
    listing,
    isSaved = false,
    onToggleSave,
    contact,
    onAddBuyer,
    isAddBuyerBlocked = false,
    onAttachOwner,
    attachOwnerLabel = "Attach owner",
    onRemind,
    canRemind = true,
    remindersUsed = 0,
    remindersLimit = REPRESENTATION_REMINDER_LIMIT,
    onOpenTimeline,
    onCancelRequest,
    onStopRepresenting,
    onEdit,
    onDelete,
    onMarkSold,
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

    const hasContact = Boolean(contact?.onMessage || contact?.phoneDigits || onRemind);
    const hasDealExtras = Boolean(
        onAddBuyer ||
        onOpenTimeline ||
        onCancelRequest ||
        onStopRepresenting ||
        onAttachOwner ||
        onEdit ||
        onMarkSold ||
        onDelete ||
        extraItems,
    );
    const remindUsed = Math.max(0, Math.min(remindersUsed, remindersLimit));
    const contactPhoneLabel = contact?.phoneDigits ? formatPhoneIn(contact.phoneDigits) : null;

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
                className={MENU_SURFACE_CLASS}
            >
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={ITEM_CLASS}>
                        <Share2 aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Share
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        className={cn(MENU_SURFACE_CLASS, "block-auto min-inline-48 before:hidden")}
                        sideOffset={4}
                        alignOffset={-4}
                    >
                        {channels.map((channel) => {
                            const mark = channel.icon ? (
                                <span
                                    className="
                                      flex shrink-0 items-center justify-center block-4 inline-4
                                    "
                                    aria-hidden
                                >
                                    <Icon
                                        icon={channel.icon}
                                        width={channel.iconSize ?? 18}
                                        height={channel.iconSize ?? 18}
                                    />
                                </span>
                            ) : (
                                <Share2 aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
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

                        <DropdownMenuItem
                            className={ITEM_CLASS}
                            onClick={() => void handleCopyLink()}
                        >
                            {copied ? (
                                <Check
                                    aria-hidden
                                    className={cn(ICON_CLASS, "is-brand")}
                                    strokeWidth={2}
                                />
                            ) : (
                                <Link2 aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            )}
                            {copied ? "Link copied" : "Copy link"}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {onToggleSave ? (
                    <DropdownMenuItem className={ITEM_CLASS} onClick={onToggleSave}>
                        <Bookmark
                            aria-hidden
                            className={cn(ICON_CLASS, isSaved && "is-brand fill-brand")}
                            strokeWidth={1.75}
                        />
                        {isSaved ? "Remove save" : "Save"}
                    </DropdownMenuItem>
                ) : null}

                {hasContact ? <DropdownMenuSeparator className={SEPARATOR_CLASS} /> : null}

                {contact?.phoneDigits && contactPhoneLabel ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            window.location.href = formatTelUrl(contact.phoneDigits!);
                            setOpen(false);
                        }}
                    >
                        <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Call owner
                    </DropdownMenuItem>
                ) : null}

                {contact?.onMessage ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            contact.onMessage?.();
                            setOpen(false);
                        }}
                    >
                        <Icon
                            icon="tabler:message"
                            width={16}
                            height={16}
                            className={ICON_CLASS}
                            aria-hidden
                        />
                        Chat here
                    </DropdownMenuItem>
                ) : null}

                {onRemind ? (
                    <DropdownMenuItem
                        className={cn(ITEM_CLASS, "justify-between gap-3")}
                        disabled={!canRemind}
                        onClick={() => {
                            if (!canRemind) return;
                            onRemind();
                            setOpen(false);
                        }}
                    >
                        <span className="flex items-center gap-3 min-inline-0">
                            <Icon
                                icon="tabler:bell"
                                width={16}
                                height={16}
                                className={ICON_CLASS}
                                aria-hidden
                            />
                            Remind owner
                        </span>
                        <span
                            className={cn(
                                "tabular body-xs shrink-0 font-semibold tracking-wide",
                                canRemind ? "text-ink-muted" : "text-ink-subtle",
                            )}
                            aria-label={`${remindUsed} of ${remindersLimit} reminders used`}
                        >
                            {remindUsed}/{remindersLimit}
                        </span>
                    </DropdownMenuItem>
                ) : null}

                {hasDealExtras ? <DropdownMenuSeparator className={SEPARATOR_CLASS} /> : null}

                {onAttachOwner ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            onAttachOwner();
                            setOpen(false);
                        }}
                    >
                        <UserRound aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        {attachOwnerLabel}
                    </DropdownMenuItem>
                ) : null}

                {onAddBuyer ? (
                    <DropdownMenuItem
                        className={cn(
                            ITEM_CLASS,
                            isAddBuyerBlocked && "cursor-not-allowed opacity-50",
                        )}
                        aria-disabled={isAddBuyerBlocked || undefined}
                        onClick={() => {
                            onAddBuyer();
                            setOpen(false);
                        }}
                    >
                        <UserPlus aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Attach buyer
                    </DropdownMenuItem>
                ) : null}

                {onOpenTimeline ? (
                    <DropdownMenuItem className={ITEM_CLASS} onClick={onOpenTimeline}>
                        <History aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        View timeline
                    </DropdownMenuItem>
                ) : null}

                {onCancelRequest ? (
                    <DropdownMenuItem
                        variant="destructive"
                        className={cn(
                            ITEM_CLASS,
                            `
                              text-danger!
                              focus:bg-danger-soft! focus:text-danger!
                              data-highlighted:bg-danger-soft! data-highlighted:text-danger!
                              focus:[&>svg]:text-danger!
                              data-highlighted:[&>svg]:text-danger!
                            `,
                        )}
                        onClick={onCancelRequest}
                    >
                        <Icon
                            icon="tabler:cancel"
                            width={16}
                            height={16}
                            className="menu-stroke-icon is-danger shrink-0 block-4 inline-4"
                            aria-hidden
                        />
                        Cancel request
                    </DropdownMenuItem>
                ) : null}

                {onStopRepresenting ? (
                    <DropdownMenuItem
                        variant="destructive"
                        className={cn(
                            ITEM_CLASS,
                            `
                              text-danger!
                              focus:bg-danger-soft! focus:text-danger!
                              data-highlighted:bg-danger-soft! data-highlighted:text-danger!
                              focus:[&>svg]:text-danger!
                              data-highlighted:[&>svg]:text-danger!
                            `,
                        )}
                        onClick={() => {
                            onStopRepresenting();
                            setOpen(false);
                        }}
                    >
                        <Icon
                            icon="tabler:cancel"
                            width={16}
                            height={16}
                            className="menu-stroke-icon is-danger shrink-0 block-4 inline-4"
                            aria-hidden
                        />
                        Stop selling this property
                    </DropdownMenuItem>
                ) : null}

                {onEdit ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            onEdit();
                            setOpen(false);
                        }}
                    >
                        <Pencil aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Edit property
                    </DropdownMenuItem>
                ) : null}

                {onMarkSold ? (
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        onClick={() => {
                            onMarkSold();
                            setOpen(false);
                        }}
                    >
                        <Check aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Mark as sold
                    </DropdownMenuItem>
                ) : null}

                {onDelete ? (
                    <DropdownMenuItem
                        variant="destructive"
                        className={cn(
                            ITEM_CLASS,
                            `
                              text-danger!
                              focus:bg-danger-soft! focus:text-danger!
                              data-highlighted:bg-danger-soft! data-highlighted:text-danger!
                              focus:[&>svg]:text-danger!
                              data-highlighted:[&>svg]:text-danger!
                            `,
                        )}
                        onClick={() => {
                            onDelete();
                            setOpen(false);
                        }}
                    >
                        <Trash2
                            aria-hidden
                            className="menu-stroke-icon is-danger shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        Delete listing
                    </DropdownMenuItem>
                ) : null}

                {extraItems}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
