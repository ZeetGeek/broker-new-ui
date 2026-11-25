"use client";
import { type SyntheticEvent, useRef, useState } from "react";

import { formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { DangerMenuItem } from "@/components/shared/danger-menu-item";
import { IconButton } from "@/components/shared/icon-button";
import {
    CallIcon,
    Link2,
    Lock,
    MoreHorizontal,
    Pencil,
    StickyNote,
    Trash2,
    WhatsAppIcon,
} from "@/components/shared/icons";
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ContactCardActionsProps = {
    name: string;
    phoneDigits?: string;
    onOpen: () => void;
    onEdit?: () => void;
    editLabel?: string;
    onAttach?: () => void;
    onNotes?: () => void;
    onDelete?: () => void;
    editLocked?: boolean;
    /**
     * `default` — Call + WhatsApp + menu (wide rows).
     * `menu` — overflow only; Call/WhatsApp live elsewhere on the card.
     */
    density?: "default" | "menu";
};

function stop(event: SyntheticEvent) {
    event.stopPropagation();
}

const MENU_ITEM_CLASS =
    "body-sm cursor-pointer gap-3 rounded-inner px-3 font-medium text-ink min-block-11 focus:bg-surface-muted! focus:text-ink! data-highlighted:bg-surface-muted! data-highlighted:text-ink!";

export function ContactCardActions({
    name,
    phoneDigits,
    onEdit,
    editLabel = "Edit client",
    onAttach,
    onNotes,
    onDelete,
    editLocked = false,
    density = "default",
}: ContactCardActionsProps) {
    const mobile = useMobileMenu();
    const [menuOpen, setMenuOpen] = useState(false);
    const afterClose = useRef<(() => void) | null>(null);
    const selectAction = (action: () => void) => {
        afterClose.current = action;
        setMenuOpen(false);
    };
    const callHref = phoneDigits ? `tel:+91${phoneDigits}` : undefined;
    const showQuickActions = density === "default";

    return (
        <div className={cn("contact-card-actions flex shrink-0 items-center gap-1")} onClick={stop}>
            {showQuickActions && callHref ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <IconButton
                                size="xs"
                                nativeButton={false}
                                render={
                                    <a href={callHref} aria-label={`Call ${name}`} onClick={stop} />
                                }
                            />
                        }
                    >
                        <CallIcon aria-hidden strokeWidth={1.75} className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>Call {name}</TooltipContent>
                </Tooltip>
            ) : null}

            {showQuickActions && phoneDigits ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <IconButton
                                size="xs"
                                nativeButton={false}
                                className=""
                                render={
                                    <a
                                        href={formatWhatsAppUrl(phoneDigits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Message ${name} on WhatsApp`}
                                        onClick={stop}
                                    />
                                }
                            />
                        }
                    >
                        <WhatsAppIcon aria-hidden strokeWidth={1.75} className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>WhatsApp {name}</TooltipContent>
                </Tooltip>
            ) : null}

            {mobile ? (
                <MobileActionDrawer
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    onOpenChangeComplete={(open) => {
                        if (!open) {
                            const action = afterClose.current;
                            afterClose.current = null;
                            action?.();
                        }
                    }}
                    title={editLabel === "Edit owner" ? "Owner actions" : "Client actions"}
                    description={name}
                    trigger={
                        <IconButton
                            type="button"
                            size="sm"
                            aria-label={`More actions for ${name}`}
                            onClick={stop}
                        >
                            <MoreHorizontal
                                aria-hidden
                                className="block-4.5 inline-4.5"
                                strokeWidth={1.75}
                            />
                        </IconButton>
                    }
                >
                    {onEdit || onAttach || onNotes ? (
                        <div className={mobileActionGroupClass}>
                            {onEdit ? (
                                <button
                                    type="button"
                                    className={mobileActionClass}
                                    title={
                                        editLocked
                                            ? "Owner details come from the platform"
                                            : undefined
                                    }
                                    onClick={() => selectAction(onEdit)}
                                >
                                    {editLocked ? <Lock aria-hidden /> : <Pencil aria-hidden />}
                                    {editLocked ? "Edit tracking" : editLabel}
                                </button>
                            ) : null}
                            {onAttach ? (
                                <button
                                    type="button"
                                    className={mobileActionClass}
                                    onClick={() => selectAction(onAttach)}
                                >
                                    <Link2 aria-hidden />
                                    Attach property
                                </button>
                            ) : null}
                            {onNotes ? (
                                <button
                                    type="button"
                                    className={mobileActionClass}
                                    onClick={() => selectAction(onNotes)}
                                >
                                    <StickyNote aria-hidden />
                                    Notes
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {onDelete ? (
                        <div className={mobileActionGroupClass}>
                            <button
                                type="button"
                                className={mobileActionClass}
                                data-destructive="true"
                                onClick={() => selectAction(onDelete)}
                            >
                                <Trash2 aria-hidden />
                                Delete
                            </button>
                        </div>
                    ) : null}
                </MobileActionDrawer>
            ) : (
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <DropdownMenuTrigger
                                    render={
                                        <IconButton
                                            type="button"
                                            size="sm"
                                            aria-label={`More actions for ${name}`}
                                            onClick={stop}
                                            className=""
                                        />
                                    }
                                >
                                    <MoreHorizontal
                                        aria-hidden
                                        className="block-4.5 inline-4.5"
                                        strokeWidth={1.75}
                                    />
                                </DropdownMenuTrigger>
                            }
                        />
                        <TooltipContent>More actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                        align="end"
                        onClick={stop}
                        className="t-dropdown t-profile-menu animate-none! rounded-card border border-border-warm bg-surface p-1.5 text-ink shadow-xl ring-0 min-inline-40 before:backdrop-blur-none data-open:animate-none! data-closed:animate-none!"
                    >
                        {onEdit ? (
                            <DropdownMenuItem
                                className={MENU_ITEM_CLASS}
                                onClick={onEdit}
                                title={
                                    editLocked ? "Owner details come from the platform" : undefined
                                }
                            >
                                {editLocked ? <Lock aria-hidden /> : <Pencil aria-hidden />}
                                {editLocked ? "Edit tracking" : editLabel}
                            </DropdownMenuItem>
                        ) : null}
                        {onAttach ? (
                            <DropdownMenuItem className={MENU_ITEM_CLASS} onClick={onAttach}>
                                <Link2 aria-hidden /> Attach property
                            </DropdownMenuItem>
                        ) : null}
                        {onNotes ? (
                            <DropdownMenuItem className={MENU_ITEM_CLASS} onClick={onNotes}>
                                <StickyNote aria-hidden /> Notes
                            </DropdownMenuItem>
                        ) : null}
                        {onDelete ? <DropdownMenuSeparator className="my-1" /> : null}
                        {onDelete ? (
                            <DangerMenuItem
                                label="Delete"
                                icon="trash"
                                onSelect={() => {
                                    setMenuOpen(false);
                                    onDelete();
                                }}
                            />
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
