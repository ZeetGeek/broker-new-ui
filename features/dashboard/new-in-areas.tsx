"use client";

import { useState } from "react";

import Link from "next/link";

import { Bookmark, Building2 } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL_AUTO } from "./card-shell";
import type { AreaPropertyItem } from "./mock-data";

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
    if (listedHoursAgo < 1) return "Listed just now";
    if (listedHoursAgo < 24) {
        return listedHoursAgo === 1
            ? "Listed 1 hour ago"
            : `Listed ${listedHoursAgo} hours ago`;
    }
    const days = Math.floor(listedHoursAgo / 24);
    if (days === 1) return "Listed yesterday";
    return `Listed ${days} days ago`;
}

function competitionCopy(count: number): { text: string; className: string } {
    if (count === 0) {
        return {
            text: "no broker has requested yet",
            className: "font-medium text-brand",
        };
    }
    if (count === 1) {
        return {
            text: "1 broker already requested",
            className: "font-medium text-urgent",
        };
    }
    return {
        text: `${count} brokers requested`,
        className: "text-ink-muted",
    };
}

function PropertyThumb() {
    return (
        <span
            className="
              flex shrink-0 items-center justify-center rounded-inner bg-surface-muted
              text-ink-muted block-12 inline-16 sm:block-16 sm:inline-20
            "
            aria-hidden
        >
            <Building2 className="block-5 inline-5" strokeWidth={1.75} />
        </span>
    );
}

function PropertyRow({
    property,
    state,
    onToggleBookmark,
    onRequest,
    className,
}: {
    property: AreaPropertyItem;
    state: RowState;
    onToggleBookmark: () => void;
    onRequest: () => void;
    className?: string;
}) {
    const isNew = property.listedHoursAgo < NEW_BADGE_HOURS;
    const competition = competitionCopy(property.brokerRequestCount);

    return (
        <li className={cn("flex items-start gap-3 sm:gap-4", className)}>
            <PropertyThumb />

            <div
                className="
                  flex flex-1 flex-col gap-3 min-inline-0 sm:flex-row sm:items-start
                  sm:justify-between sm:gap-4
                "
            >
                <div className="flex flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="body font-semibold text-ink">
                            {property.configLabel} · {property.locality}
                        </p>
                        <Price
                            amountInr={property.amountInr}
                            isRent={property.isRent}
                            className="body font-semibold"
                        />
                        <Badge variant="neutral">{property.isRent ? "Rent" : "Sale"}</Badge>
                        {isNew ? <Badge variant="brand">New</Badge> : null}
                    </div>

                    <p className="body-sm text-ink-muted">
                        {formatAreaSqft(property.areaSqft)} · {property.furnishingLabel}
                        {property.detailLabel ? (
                            <span className="hidden sm:inline">
                                {" "}
                                · {property.detailLabel}
                            </span>
                        ) : null}
                    </p>

                    <p className="body-sm text-ink-muted">
                        {listedLabel(property.listedHoursAgo)}
                        {" · "}
                        <span className={competition.className}>{competition.text}</span>
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={state.hasRequested}
                        onClick={onRequest}
                        className={cn(
                            "border-2 border-border-warm",
                            state.hasRequested && "opacity-60",
                        )}
                    >
                        {state.hasRequested ? "Requested" : "Request"}
                    </Button>
                </div>
            </div>
        </li>
    );
}

export function NewInAreas({ properties, serviceAreas, className }: NewInAreasProps) {
    const rows = properties.slice(0, MAX_ROWS);
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

    function requestProperty(id: string) {
        setRowState((prev) => {
            const current = prev[id];
            if (!current || current.hasRequested) return prev;
            return {
                ...prev,
                [id]: { ...current, hasRequested: true },
            };
        });
    }

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_AUTO, className)}
            aria-labelledby="new-in-areas-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-inline-0">
                    <CardLabel info={NEW_IN_AREAS_INFO}>
                        <span id="new-in-areas-heading">New in your areas</span>
                    </CardLabel>
                    {serviceAreas.length > 0 ? (
                        <p className="body-sm text-ink-subtle">{serviceAreas.join(" · ")}</p>
                    ) : null}
                </div>
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/broker/properties" />}
                    className="body-sm shrink-0 p-0 font-semibold text-brand block-auto"
                >
                    Browse all
                    <span aria-hidden>→</span>
                </Button>
            </div>

            {rows.length === 0 ? (
                <p className="body mbs-4 text-ink-muted">No new listings in your areas yet.</p>
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
                                onToggleBookmark={() => toggleBookmark(property.id)}
                                onRequest={() => requestProperty(property.id)}
                                className={
                                    index > 0
                                        ? "mbs-3 border-bs border-border-warm pbs-3"
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
