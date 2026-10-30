"use client";

import { type SyntheticEvent, useState } from "react";

import { formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { HoldToConfirmMenuItem } from "@/components/shared/hold-to-confirm-menu-item";
import {
    CallIcon,
    Eye,
    Link2,
    Lock,
    MoreHorizontal,
    Pencil,
    StickyNote,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
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
    onOpen,
    onEdit,
    editLabel = "Edit client",
    onAttach,
    onNotes,
    onDelete,
    editLocked = false,
    density = "default",
}: ContactCardActionsProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const callHref = phoneDigits ? `tel:+91${phoneDigits}` : undefined;
    const showQuickActions = density === "default";

    return (
        <div className={cn("contact-card-actions flex shrink-0 items-center gap-1")} onClick={stop}>
            {showQuickActions && callHref ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="outline"
                                size="icon-xs"
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
                            <Button
                                variant="outline"
                                size="icon-xs"
                                nativeButton={false}
                                className="text-brand"
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

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        aria-label={`More actions for ${name}`}
                                        onClick={stop}
                                        className="
                                          rounded-full border-border-warm bg-surface shadow-xs
                                        "
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
                    className="t-dropdown t-profile-menu animate-none! rounded-card border border-border-warm bg-surface p-1.5 text-ink shadow-xl ring-0 min-inline-48 before:backdrop-blur-none data-open:animate-none! data-closed:animate-none!"
                >
                    <DropdownMenuItem className={MENU_ITEM_CLASS} onClick={onOpen}>
                        <Eye aria-hidden /> View details
                    </DropdownMenuItem>
                    {onEdit ? (
                        <DropdownMenuItem
                            className={MENU_ITEM_CLASS}
                            onClick={onEdit}
                            title={editLocked ? "Owner details come from the platform" : undefined}
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
                    {onDelete ? <DropdownMenuSeparator className="m-1.5 bg-border-warm" /> : null}
                    {onDelete ? (
                        <HoldToConfirmMenuItem
                            label="Hold to delete"
                            icon="trash"
                            onComplete={() => {
                                setMenuOpen(false);
                                onDelete();
                            }}
                        />
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
