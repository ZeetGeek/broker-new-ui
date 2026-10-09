"use client";

import type { SyntheticEvent } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import { Eye, Link2, Lock, MoreHorizontal, Pencil, StickyNote, Trash2, Phone } from "lucide-react";

import { formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

export type ContactCardActionsProps = {
    name: string;
    phoneDigits?: string;
    onOpen: () => void;
    onEdit?: () => void;
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

export function ContactCardActions({
    name,
    phoneDigits,
    onOpen,
    onEdit,
    onAttach,
    onNotes,
    onDelete,
    editLocked = false,
    density = "default",
}: ContactCardActionsProps) {
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
                        <Phone aria-hidden strokeWidth={1.75} />
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
                        <Icon icon="bi:whatsapp" width={16} height={16} aria-hidden />
                    </TooltipTrigger>
                    <TooltipContent>WhatsApp {name}</TooltipContent>
                </Tooltip>
            ) : null}

            <DropdownMenu>
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
                                        className="rounded-full border-border-warm bg-surface shadow-xs"
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
                <DropdownMenuContent align="end" onClick={stop}>
                    <DropdownMenuItem onClick={onOpen}>
                        <Eye aria-hidden /> View details
                    </DropdownMenuItem>
                    {onEdit ? (
                        <DropdownMenuItem
                            onClick={onEdit}
                            title={editLocked ? "Owner details come from the platform" : undefined}
                        >
                            {editLocked ? <Lock aria-hidden /> : <Pencil aria-hidden />}
                            {editLocked ? "Edit tracking" : "Edit contact"}
                        </DropdownMenuItem>
                    ) : null}
                    {onAttach ? (
                        <DropdownMenuItem onClick={onAttach}>
                            <Link2 aria-hidden /> Attach property
                        </DropdownMenuItem>
                    ) : null}
                    {onNotes ? (
                        <DropdownMenuItem onClick={onNotes}>
                            <StickyNote aria-hidden /> Notes
                        </DropdownMenuItem>
                    ) : null}
                    {onDelete ? <DropdownMenuSeparator /> : null}
                    {onDelete ? (
                        <DropdownMenuItem variant="destructive" onClick={onDelete}>
                            <Trash2 aria-hidden /> Delete
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
