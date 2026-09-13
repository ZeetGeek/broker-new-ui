"use client";

import { BadgeCheck, Building2, Lock, MapPin, MessageCircle, Pencil } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatIndianPrice } from "@/lib/format/price";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { OwnerRow } from "@/features/contacts/types";

export function OwnerCard({
    owner,
    onEdit,
}: {
    owner: OwnerRow;
    onEdit?: (owner: OwnerRow) => void;
}) {
    const isPlatform = owner.origin === "platform";
    const canContact = (!isPlatform || owner.hasActiveRepresentation) && Boolean(owner.phoneDigits);
    const spoke = owner.lastSpokeAt
        ? `Spoke ${formatRelativePast(new Date(owner.lastSpokeAt), new Date())}`
        : "No conversation logged";

    return (
        <article
            className="
              flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4
              transition-[box-shadow,border-color] duration-160
              hover:border-ink/15 hover:shadow-md
            "
            aria-label={owner.name}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-inline-0">
                    <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="md" />
                    <div className="min-inline-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="body-sm truncate font-semibold text-ink">
                                {owner.name}
                            </span>
                            {isPlatform ? (
                                <Badge variant="brand" className="gap-1">
                                    <BadgeCheck aria-hidden className="block-3 inline-3" /> Platform
                                </Badge>
                            ) : (
                                <Badge variant="neutral">Added by you</Badge>
                            )}
                            {isPlatform ? (
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <span className="inline-flex text-ink-muted">
                                                <Lock
                                                    aria-hidden
                                                    className="block-3.5 inline-3.5"
                                                />
                                            </span>
                                        }
                                    />
                                    <TooltipContent>
                                        Owner details come from the platform
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                        {canContact && owner.phoneDigits ? (
                            <PhoneNumber
                                phoneDigits={owner.phoneDigits}
                                className="body-xs text-ink-muted"
                            />
                        ) : (
                            <span className="body-xs text-ink-muted">Number hidden</span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                    {onEdit ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-xs"
                                        onClick={() => onEdit(owner)}
                                        aria-label={`Edit ${owner.name}`}
                                    >
                                        <Pencil aria-hidden />
                                    </Button>
                                }
                            />
                            <TooltipContent>
                                {isPlatform ? "Edit tracking notes" : "Edit owner"}
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                    {canContact && owner.phoneDigits ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        size="icon-xs"
                                        nativeButton={false}
                                        className="border-border-warm text-brand"
                                        render={
                                            <a
                                                href={formatWhatsAppUrl(owner.phoneDigits)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Message ${owner.name} on WhatsApp`}
                                            />
                                        }
                                    >
                                        <MessageCircle aria-hidden />
                                    </Button>
                                }
                            />
                            <TooltipContent>Message {owner.name} on WhatsApp</TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {owner.propertyIntent ? (
                    <Badge variant="neutral" className="capitalize">
                        {owner.propertyIntent}
                    </Badge>
                ) : null}
                <Badge variant="neutral" className="gap-1">
                    <Building2 aria-hidden className="block-3 inline-3" />
                    {owner.propertyType ??
                        `${owner.propertyCount} ${owner.propertyCount === 1 ? "property" : "properties"}`}
                </Badge>
                {owner.configuration ? (
                    <Badge variant="neutral">{owner.configuration}</Badge>
                ) : null}
                {owner.totalValueInr > 0 ? (
                    <Badge variant="neutral">
                        {formatIndianPrice(
                            owner.totalValueInr,
                            owner.propertyIntent ?? (owner.isAllRent ? "rent" : "sell"),
                        )}
                    </Badge>
                ) : null}
            </div>

            <p className="body-xs flex items-start gap-1.5 text-ink-muted">
                <MapPin aria-hidden className="mbs-px shrink-0 block-3.5 inline-3.5" />
                <span className="text-pretty">{owner.localities.join(", ")}</span>
            </p>

            <div
                className="
              flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm pbs-3
            "
            >
                <p className="body-xs truncate text-ink-muted">
                    {owner.linkedListingTitle ?? owner.propertyTitles[0] ?? "No listing linked"}
                </p>
                <p className="body-xs tabular shrink-0 text-ink-muted">{spoke}</p>
            </div>
        </article>
    );
}
