"use client";

import { summarizeAttachedClients } from "@/lib/format/attached-clients";
import { cn } from "@/lib/utils";

import { AvatarStack, type AvatarStackPerson } from "@/components/shared/avatar-stack";
import { ContactName } from "@/components/shared/contact-name";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

/** One client: face and name. Multiple clients: a configurable avatar stack and the total count. */
export function AttachedClientsSummary({
    clients,
    size = "2xs",
    maxAvatars = 2,
    labelClassName,
    className,
}: {
    clients: AvatarStackPerson[];
    size?: "2xs" | "sm" | "md";
    maxAvatars?: number;
    labelClassName?: string;
    className?: string;
}) {
    const summary = summarizeAttachedClients(clients, maxAvatars);
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
                    max={maxAvatars}
                    className="shrink-0"
                />
            )}
            {single ? (
                <ContactName
                    name={single.name}
                    contactId={single.id}
                    contactType="buyer"
                    className={cn("truncate font-semibold text-ink", labelClassName)}
                />
            ) : (
                <Popover>
                    <PopoverTrigger
                        onClick={(event) => event.stopPropagation()}
                        className={cn(
                            "person-name truncate font-semibold text-ink",
                            labelClassName,
                        )}
                        data-person-link
                        aria-label={`View ${summary.label}`}
                    >
                        {summary.label}
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-64 max-inline-[calc(100vw-2rem)]"
                    >
                        <PopoverTitle>Linked clients</PopoverTitle>
                        <ul className="flex flex-col gap-3 overflow-y-auto max-block-64">
                            {[
                                ...new Map(clients.map((client) => [client.id, client])).values(),
                            ].map((client) => (
                                <li
                                    key={client.id}
                                    className="flex items-center gap-2 min-inline-0"
                                >
                                    <UserAvatar
                                        name={client.name}
                                        imageUrl={client.avatarUrl}
                                        size="2xs"
                                    />
                                    <ContactName
                                        name={client.name}
                                        contactId={client.id}
                                        contactType="buyer"
                                        className="body-sm wrap-anywhere min-inline-0"
                                    />
                                </li>
                            ))}
                        </ul>
                    </PopoverContent>
                </Popover>
            )}
        </span>
    );
}
