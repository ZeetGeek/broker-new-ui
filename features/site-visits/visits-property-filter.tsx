"use client";

import { useMemo, useState } from "react";

import { Building2, Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { VisitPropertyOption } from "@/features/site-visits/types";

/** Above this many options the list gets its own search box. */
const SEARCH_THRESHOLD = 6;

type VisitsPropertyFilterProps = {
    properties: VisitPropertyOption[];
    /** Selected property id, or "" for all. */
    value: string;
    onChange: (propertyId: string) => void;
};

/**
 * Narrows the visits list to one property.
 *
 * The question it answers is "when am I showing the Vesu flat" — a broker
 * juggling six live properties cannot read that off a list sorted by time,
 * because the six are interleaved. Picking one leaves only its slots, in
 * order, which is the shape needed to spot a clash or promise a buyer a time.
 *
 * Only properties that actually have visits are offered, and each carries its
 * count, so the list doubles as an answer to "which of my properties are
 * getting seen at all".
 */
export function VisitsPropertyFilter({ properties, value, onChange }: VisitsPropertyFilterProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = properties.find((property) => property.id === value) ?? null;
    const showSearch = properties.length > SEARCH_THRESHOLD;

    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return properties;

        return properties.filter((property) =>
            `${property.label} ${property.locality} ${property.city}`
                .toLowerCase()
                .includes(needle),
        );
    }, [properties, query]);

    // Nothing to filter by. Rendering a dead control would imply the broker
    // has properties they cannot see.
    if (properties.length === 0) return null;

    const handleSelect = (propertyId: string) => {
        onChange(propertyId);
        setQuery("");
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                // A stale query would silently hide options on reopening.
                if (!next) setQuery("");
                setOpen(next);
            }}
        >
            <PopoverTrigger
                render={
                    <button
                        type="button"
                        aria-label={
                            selected
                                ? `Showing visits for ${selected.label} in ${selected.locality}. Change property.`
                                : "Filter visits by property"
                        }
                        className={cn(
                            `
                              body-sm flex shrink-0 items-center gap-2 rounded-full border px-3
                              py-1.5 transition-colors duration-160
                            `,
                            selected
                                ? "border-brand-ink bg-brand-ink text-white"
                                : "border-border-warm bg-surface text-ink hover:border-ink/25",
                        )}
                    >
                        <Building2 className="block-4 inline-4" strokeWidth={1.75} />
                        <span className="truncate max-inline-40">
                            {selected ? selected.label : "All properties"}
                        </span>
                        <ChevronDown className="opacity-70 block-4 inline-4" strokeWidth={1.75} />
                    </button>
                }
            />

            <PopoverContent align="start" className="p-0 inline-72">
                {showSearch ? (
                    <div className="border-be border-border-warm p-2">
                        <Input
                            size="sm"
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Find a property"
                            aria-label="Find a property"
                            startIcon={Search}
                        />
                    </div>
                ) : null}

                <div className="overflow-y-auto p-1 max-block-72">
                    <OptionRow
                        isSelected={value === ""}
                        onClick={() => handleSelect("")}
                        title="All properties"
                        // The total, so picking "All" is a known quantity
                        // rather than a step into the dark.
                        count={properties.reduce((sum, property) => sum + property.count, 0)}
                    />

                    {matches.map((property) => (
                        <OptionRow
                            key={property.id}
                            isSelected={property.id === value}
                            onClick={() => handleSelect(property.id)}
                            title={property.label}
                            subtitle={`${property.locality}, ${property.city}`}
                            count={property.count}
                        />
                    ))}

                    {matches.length === 0 ? (
                        <p className="body-sm px-2 py-6 text-center text-ink-subtle">
                            No property matches that.
                        </p>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function OptionRow({
    isSelected,
    onClick,
    title,
    subtitle,
    count,
}: {
    isSelected: boolean;
    onClick: () => void;
    title: string;
    subtitle?: string;
    count: number;
}) {
    return (
        <button
            type="button"
            aria-pressed={isSelected}
            onClick={onClick}
            className="
              flex items-center gap-2 rounded-inner px-2 py-1.5 text-start transition-colors
              duration-160 inline-full
              hover:bg-surface-muted
            "
        >
            {/* The tick keeps its column whether or not it is showing, so the
                rows do not shift sideways as the selection moves. */}
            <Check
                aria-hidden
                className={cn("shrink-0 block-4 inline-4", isSelected ? "opacity-100" : "opacity-0")}
                strokeWidth={2}
            />

            <span className="flex flex-col min-inline-0">
                <span className="body-sm truncate font-medium text-ink">{title}</span>
                {subtitle ? (
                    <span className="body-xs truncate text-ink-subtle">{subtitle}</span>
                ) : null}
            </span>

            <span className="body-xs tabular ms-auto shrink-0 text-ink-subtle">{count}</span>
        </button>
    );
}
