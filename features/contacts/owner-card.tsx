"use client";

import { Building2, Lock, MapPin, MessageCircle } from "lucide-react";

import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { OwnerRow } from "@/features/contacts/types";

/**
 * An owner the broker represents. Contact details appear only while the
 * representation is live — the same consent rule the request and deal cards
 * follow. A lapsed owner keeps their name and loses the buttons, rather than
 * disappearing, so the broker can still see who they used to work with.
 */
export function OwnerCard({ owner }: { owner: OwnerRow }) {
    const canContact = owner.hasActiveRepresentation && Boolean(owner.phoneDigits);

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
                        <div className="flex items-center gap-1.5">
                            <span className="body-sm truncate font-semibold text-ink">
                                {owner.name}
                            </span>
                            {!owner.hasActiveRepresentation ? (
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <span
                                                className="
                                              flex shrink-0 items-center text-ink-muted
                                            "
                                            >
                                                <Lock
                                                    aria-hidden
                                                    className="block-3.5 inline-3.5"
                                                    strokeWidth={1.75}
                                                />
                                            </span>
                                        }
                                    />
                                    <TooltipContent>
                                        You no longer represent this owner, so their number is
                                        hidden.
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
                            <span className="body-xs text-ink-muted">Owner</span>
                        )}
                    </div>
                </div>

                {canContact && owner.phoneDigits ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        size="icon-xs"
                                        nativeButton={false}
                                        className="shrink-0 border-border-warm text-brand"
                                        render={
                                            <a
                                                href={formatWhatsAppUrl(owner.phoneDigits)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Message ${owner.name} on WhatsApp`}
                                            />
                                        }
                                    />
                                }
                            >
                                <MessageCircle aria-hidden strokeWidth={1.75} />
                            </TooltipTrigger>
                            <TooltipContent>Message {owner.name} on WhatsApp.</TooltipContent>
                        </Tooltip>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="neutral" className="gap-1">
                    <Building2 aria-hidden className="block-3 inline-3" strokeWidth={2} />
                    {owner.propertyCount} {owner.propertyCount === 1 ? "property" : "properties"}
                </Badge>
                {owner.liveDealCount > 0 ? (
                    <Badge variant="brand">
                        {owner.liveDealCount} {owner.liveDealCount === 1 ? "deal" : "deals"} running
                    </Badge>
                ) : null}
            </div>

            <p className="body-xs flex items-start gap-1.5 text-ink-muted">
                <MapPin
                    aria-hidden
                    className="mbs-px shrink-0 block-3.5 inline-3.5"
                    strokeWidth={1.75}
                />
                <span className="text-pretty">{owner.localities.join(", ")}</span>
            </p>

            <div
                className="
              flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm pbs-3
            "
            >
                <p className="body-xs truncate text-ink-muted">{owner.propertyTitles[0]}</p>
                <p className="body-xs tabular shrink-0 text-brand">
                    {owner.isAllRent
                        ? formatRentInr(owner.totalValueInr)
                        : formatPriceInr(owner.totalValueInr)}
                </p>
            </div>
        </article>
    );
}
