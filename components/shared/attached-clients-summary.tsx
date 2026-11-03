"use client";

import { summarizeAttachedClients } from "@/lib/format/attached-clients";
import { cn } from "@/lib/utils";

import { AvatarStack, type AvatarStackPerson } from "@/components/shared/avatar-stack";
import { UserAvatar } from "@/components/shared/user-avatar";

/** One client: face and name. Multiple clients: two faces and the total count. */
export function AttachedClientsSummary({
    clients,
    size = "2xs",
    className,
}: {
    clients: AvatarStackPerson[];
    size?: "2xs" | "sm" | "md";
    className?: string;
}) {
    const summary = summarizeAttachedClients(clients);
    if (!summary.total) return null;
    const single = summary.total === 1 ? summary.visibleClients[0]! : null;
    return (
        <span className={cn("body-sm inline-flex items-center gap-1.5 min-inline-0", className)}>
            {single ? (
                <UserAvatar name={single.name} imageUrl={single.avatarUrl} size={size} />
            ) : (
                <AvatarStack
                    people={summary.visibleClients}
                    size={size}
                    max={2}
                    className="shrink-0"
                />
            )}
            <span className="truncate font-semibold text-ink" title={summary.names}>
                {summary.label}
            </span>
        </span>
    );
}
