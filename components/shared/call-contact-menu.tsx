"use client";

import type { ComponentProps, SyntheticEvent } from "react";

import { formatTelUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { CallIcon, ChevronDown } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CallContact = {
    /** Stable key; falls back to `role-name`. */
    id?: string;
    name: string;
    /** Shown under the name — "Client", "Owner", … */
    role: string;
    phoneDigits?: string | null;
};

type CallContactMenuProps = {
    contacts: CallContact[];
    /** Screen-reader label for the trigger, e.g. "Call client or owner for 3 BHK · Green Meadows". */
    label: string;
    variant?: ComponentProps<typeof Button>["variant"];
    size?: ComponentProps<typeof Button>["size"];
    className?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "bottom";
};

function hasPhone(phone?: string | null): phone is string {
    return (phone?.replace(/\D/g, "").length ?? 0) >= 10;
}

/** Stop clicks/taps leaking to a clickable or draggable card (portal events bubble in React). */
function stop(event: SyntheticEvent) {
    event.stopPropagation();
}

/**
 * One "Call ▾" button for any surface that shows more than one party
 * (client + owner). Each option shows the person's name with their role under it.
 */
export function CallContactMenu({
    contacts,
    label,
    variant = "outline",
    size = "md",
    className,
    align = "end",
    side = "bottom",
}: CallContactMenuProps) {
    const people = contacts.filter((contact) => contact.name.trim());

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={!people.length}
                onClick={stop}
                onPointerDown={stop}
                onKeyDown={stop}
                render={
                    <Button
                        type="button"
                        variant={variant}
                        size={size}
                        className={cn("min-inline-0", className)}
                        aria-label={label}
                    />
                }
            >
                <CallIcon aria-hidden />
                Call
                <ChevronDown aria-hidden className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                className="min-inline-56"
                onClick={stop}
                onPointerDown={stop}
                onKeyDown={stop}
            >
                {people.map((contact) => {
                    const callable = hasPhone(contact.phoneDigits);
                    const text = (
                        <span className="flex flex-col min-inline-0">
                            <span className="truncate font-semibold text-ink">{contact.name}</span>
                            <span className="caption text-ink-muted">
                                {callable ? contact.role : `${contact.role} · No phone number`}
                            </span>
                        </span>
                    );
                    const key = contact.id ?? `${contact.role}-${contact.name}`;
                    return callable ? (
                        <DropdownMenuItem
                            key={key}
                            className="gap-3 py-2"
                            render={<a href={formatTelUrl(contact.phoneDigits as string)} />}
                        >
                            <CallIcon aria-hidden />
                            {text}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem key={key} disabled className="gap-3 py-2">
                            <CallIcon aria-hidden />
                            {text}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
