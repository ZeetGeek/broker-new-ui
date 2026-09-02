"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { Bookmark, Clock3, MapPin, Users } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { formatAreaSqft } from "@/lib/format/area";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { ShortcutKbdMessage, ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL_AUTO, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import type { AreaPropertyItem } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const NEW_IN_AREAS_INFO =
    "Fresh listings in the localities you cover — ready to request representation.";

const NEW_BADGE_HOURS = 6;
const MAX_ROWS = 3;

export type NewInAreasProps = {
    properties: AreaPropertyItem[];
    serviceAreas: string[];
    className?: string;
};

type RowState = {
    hasRequested: boolean;
    isBookmarked: boolean;
};

function listedLabel(listedHoursAgo: number): string {
    if (listedHoursAgo < 1) return "Just now";
    if (listedHoursAgo < 24) {
        return listedHoursAgo === 1 ? "1 hour ago" : `${listedHoursAgo} hours ago`;
    }
    const days = Math.floor(listedHoursAgo / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function competitionStatus(count: number): { text: string; className: string } {
    if (count === 0) {
        return {
            text: "Open — no requests yet",
            className: "font-medium text-emerald-700",
        };
    }
    if (count === 1) {
        return {
            text: "1 broker already requested",
            className: "font-medium text-orange-700",
        };
    }
    return {
        text: `${count} brokers requested`,
        className: "text-stone-500",
    };
}

function PropertyRow({
    property,
    state,
    isRequesting,
    onToggleBookmark,
    onRequest,
    className,
}: {
    property: AreaPropertyItem;
    state: RowState;
    isRequesting: boolean;
    onToggleBookmark: () => void;
    onRequest: () => void;
    className?: string;
}) {
    const isNew = property.listedHoursAgo < NEW_BADGE_HOURS;
    const competition = competitionStatus(property.brokerRequestCount);

    return (
        <li className={cn("flex items-center gap-3 sm:gap-4", className)}>
            <PropertyThumb
                src={property.imageSrc}
                alt={`${property.configLabel} in ${property.locality}`}
            />

            <div
                className="
                  flex flex-1 flex-col gap-3 min-inline-0
                  sm:flex-row sm:items-center sm:justify-between sm:gap-4
                "
            >
                <div className="flex flex-col gap-1.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="body font-semibold text-ink">
                            {property.configLabel} · {property.locality}
                        </p>
                        <Price
                            amountInr={property.amountInr}
                            isRent={property.isRent}
                            className="body font-semibold"
                        />
                        <Badge
                            className={
                                property.isRent
                                    ? "border-0 bg-sky-100 text-sky-800"
                                    : "border-0 bg-emerald-100 text-emerald-800"
                            }
                        >
                            {property.isRent ? "Rent" : "Sale"}
                        </Badge>
                        {isNew ? (
                            <Badge className="border-0 bg-lime-100 text-lime-800">New</Badge>
                        ) : null}
                    </div>

                    <p className="body-sm text-stone-500">
                        <span className="font-medium text-stone-700">
                            {formatAreaSqft(property.areaSqft)}
                        </span>
                        <span className="text-stone-300"> · </span>
                        {property.furnishingLabel}
                        {property.detailLabel ? (
                            <span className="hidden sm:inline">
                                <span className="text-stone-300"> · </span>
                                {property.detailLabel}
                            </span>
                        ) : null}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="body-sm inline-flex items-center gap-1 text-stone-500">
                            <Clock3 aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            {listedLabel(property.listedHoursAgo)}
                        </span>
                        <span
                            className={cn(
                                "body-sm inline-flex items-center gap-1",
                                competition.className,
                            )}
                        >
                            <Users aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            {competition.text}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={state.hasRequested || isRequesting}
                        loading={isRequesting}
                        onClick={onRequest}
                        className={cn(
                            "border-2 border-border-warm",
                            state.hasRequested && "opacity-60",
                        )}
                    >
                        {state.hasRequested ? "Requested" : "Request"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={
                            state.isBookmarked
                                ? `Remove bookmark for ${property.configLabel} in ${property.locality}`
                                : `Bookmark ${property.configLabel} in ${property.locality}`
                        }
                        aria-pressed={state.isBookmarked}
                        onClick={onToggleBookmark}
                        className="border-2 border-border-warm"
                    >
                        <Bookmark
                            aria-hidden
                            className={cn(
                                "block-4 inline-4",
                                state.isBookmarked && "fill-brand text-brand",
                            )}
                            strokeWidth={1.75}
                        />
                    </Button>
                </div>
            </div>
        </li>
    );
}

function EmptyNewInAreas() {
    return (
        <EmptyState
            icon={MapPin}
            heading="Nothing new this week"
            description="We'll show properties added in the areas you work in."
        >
            <ShortcutKbdMessage shortcutId="owner_listings">to browse owner listings</ShortcutKbdMessage>
        </EmptyState>
    );
}

export function NewInAreas({ properties, serviceAreas, className }: NewInAreasProps) {
    const rows = properties.slice(0, MAX_ROWS);
    const isEmpty = rows.length === 0;
    const [rowState, setRowState] = useState<Record<string, RowState>>(() =>
        Object.fromEntries(
            properties.map((property) => [
                property.id,
                {
                    hasRequested: property.hasRequested,
                    isBookmarked: property.isBookmarked,
                },
            ]),
        ),
    );
    const [requestingId, setRequestingId] = useState<string | null>(null);

    function toggleBookmark(id: string) {
        setRowState((prev) => {
            const current = prev[id];
            if (!current) return prev;
            return {
                ...prev,
                [id]: { ...current, isBookmarked: !current.isBookmarked },
            };
        });
    }

    async function requestProperty(id: string) {
        const current = rowState[id];
        if (!current || current.hasRequested || requestingId) return;

        setRequestingId(id);
        try {
            await representativeApi.requestRepresentation(id);
            setRowState((prev) => ({
                ...prev,
                [id]: { ...current, hasRequested: true },
            }));
            toast.success("Request sent to the owner");
        } catch (err: unknown) {
            toast.error(err instanceof ApiError ? err.message : "Could not send request");
        } finally {
            setRequestingId(null);
        }
    }

    return (
        <section
            className={cn(
                isEmpty ? DASHBOARD_CARD_SHELL_EMPTY : DASHBOARD_CARD_SHELL_AUTO,
                className,
            )}
            aria-labelledby="new-in-areas-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-inline-0">
                    <CardLabel info={NEW_IN_AREAS_INFO}>
                        <span id="new-in-areas-heading">New in your areas</span>
                    </CardLabel>
                    {!isEmpty && serviceAreas.length > 0 ? (
                        <p className="body-sm text-ink-subtle">{serviceAreas.join(" · ")}</p>
                    ) : null}
                </div>
                {!isEmpty ? (
                    <ShortcutTooltip shortcutId="owner_listings">
                        <TextLinkButton href={BROKER_OWNER_LISTINGS_HREF} className="shrink-0">
                            Browse all
                        </TextLinkButton>
                    </ShortcutTooltip>
                ) : null}
            </div>

            {isEmpty ? (
                <EmptyNewInAreas />
            ) : (
                <ul className="mbs-1 flex flex-col">
                    {rows.map((property, index) => {
                        const state = rowState[property.id] ?? {
                            hasRequested: property.hasRequested,
                            isBookmarked: property.isBookmarked,
                        };

                        return (
                            <PropertyRow
                                key={property.id}
                                property={property}
                                state={state}
                                isRequesting={requestingId === property.id}
                                onToggleBookmark={() => toggleBookmark(property.id)}
                                onRequest={() => void requestProperty(property.id)}
                                className={
                                    index > 0
                                        ? "mbs-3 border-bs border-border-warm/50 pbs-3"
                                        : "mbs-4"
                                }
                            />
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
