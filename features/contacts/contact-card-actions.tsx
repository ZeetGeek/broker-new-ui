"use client";

import type { SyntheticEvent } from "react";

import {
    Eye,
    Link2,
    Lock,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    StickyNote,
    Trash2,
    Phone,
} from "lucide-react";

import { formatWhatsAppUrl } from "@/lib/format/phone";

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
    onAttach?: () => void;
    onNotes?: () => void;
    onDelete?: () => void;
    editLocked?: boolean;
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
}: ContactCardActionsProps) {
    const callHref = phoneDigits ? `tel:+91${phoneDigits}` : undefined;

    return (
        <div className="contact-card-actions flex shrink-0 items-center gap-1" onClick={stop}>
            {callHref ? (
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

            {phoneDigits ? (
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
                        <MessageCircle aria-hidden strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>Message {name} on WhatsApp</TooltipContent>
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
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={`More actions for ${name}`}
                                        onClick={stop}
                                    />
                                }
                            >
                                <MoreHorizontal aria-hidden strokeWidth={1.75} />
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
