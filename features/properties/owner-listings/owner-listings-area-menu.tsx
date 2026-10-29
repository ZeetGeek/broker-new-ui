"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

import { Ruler } from "@/components/shared/icons";

import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RangeSlider } from "@/components/ui/slider";

import {
    AREA_ABOVE_MAX_TOKEN,
    areaDraftToRange,
    buildAreaHistogram,
    formatAreaFilterLabel,
    isAreaAboveMax,
    OWNER_LISTINGS_AREA_RANGE,
} from "@/features/properties/owner-listings/owner-listings-area-presets";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";

export type OwnerListingsAreaMenuProps = {
    minAreaSqft: string;
    maxAreaSqft: string;
    onAreaChange: (next: { minAreaSqft: string; maxAreaSqft: string }) => void;
    onCommit?: () => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

const AREA_HISTOGRAM = buildAreaHistogram();

const AREA_MENU_WIDTH_CLASS = cn(
    "min-inline-0!",
    "inline-[min(22rem,calc(100vw-1.5rem))]!",
    "min-inline-[min(22rem,calc(100vw-1.5rem))]!",
    "max-inline-[min(22rem,calc(100vw-1.5rem))]!",
);

const AREA_INPUT_SHELL = `
      flex items-center gap-2 rounded-control border border-border bg-surface px-3
      shadow-sm
      transition-[border-color,box-shadow,background-color] duration-160
      focus-within:border-brand focus-within:bg-brand-soft/40
      focus-within:ring-2 focus-within:ring-brand/20
    ` as const;

const AREA_INPUT_CLASS = `
      border-0 bg-transparent px-0 py-2.5 text-end text-sm font-semibold text-ink
      shadow-none tabular
      block-auto!
      placeholder:text-ink-subtle
      focus-visible:border-transparent focus-visible:ring-0
      [appearance:textfield]
      [&::-webkit-inner-spin-button]:appearance-none
      [&::-webkit-outer-spin-button]:appearance-none
    ` as const;

const OPEN_MAX_LABEL = `${OWNER_LISTINGS_AREA_RANGE.max.toLocaleString("en-IN")}+`;

function snapArea(value: number): number {
    const stepped =
        Math.round(value / OWNER_LISTINGS_AREA_RANGE.step) * OWNER_LISTINGS_AREA_RANGE.step;
    return Math.max(
        OWNER_LISTINGS_AREA_RANGE.min,
        Math.min(OWNER_LISTINGS_AREA_RANGE.max, stepped),
    );
}

/** Field text for an applied filter. The ceiling always reads as 5,000+. */
function draftsFromApplied(
    minAreaSqft: string,
    maxAreaSqft: string,
): {
    minDraft: string;
    maxDraft: string;
} {
    const [low, high] = areaDraftToRange(minAreaSqft, maxAreaSqft);
    const atCeiling =
        !maxAreaSqft || isAreaAboveMax(maxAreaSqft) || high >= OWNER_LISTINGS_AREA_RANGE.max;
    return {
        minDraft: String(low),
        maxDraft: atCeiling ? OPEN_MAX_LABEL : String(high),
    };
}

/**
 * Parse typed sqft. Trailing `+` or any value ≥ slider ceiling means open max (5,000+).
 */
function parseAreaField(raw: string, side: "min" | "max"): number | null {
    const trimmed = raw.trim().replace(/,/g, "");
    if (!trimmed) return null;

    const openEnded = trimmed.endsWith("+");
    const numericPart = openEnded ? trimmed.slice(0, -1).trim() : trimmed;
    if (!numericPart) {
        return side === "max" && openEnded ? OWNER_LISTINGS_AREA_RANGE.max : null;
    }

    const value = Number(numericPart);
    if (!Number.isFinite(value) || value < 0) return null;

    if (side === "max" && (openEnded || value >= OWNER_LISTINGS_AREA_RANGE.max)) {
        return OWNER_LISTINGS_AREA_RANGE.max;
    }

    return value;
}

function stopMenuKeys(event: KeyboardEvent | PointerEvent) {
    event.stopPropagation();
}

export function OwnerListingsAreaMenu({
    minAreaSqft,
    maxAreaSqft,
    onAreaChange,
    onCommit,
    onOpenChange,
    className,
}: OwnerListingsAreaMenuProps) {
    const [open, setOpen] = useState(false);
    const range = areaDraftToRange(minAreaSqft, maxAreaSqft);
    const synced = draftsFromApplied(minAreaSqft, maxAreaSqft);
    const [minDraft, setMinDraft] = useState(synced.minDraft);
    const [maxDraft, setMaxDraft] = useState(synced.maxDraft);
    const isActive = Boolean(minAreaSqft || maxAreaSqft);

    const [appliedRange, setAppliedRange] = useState({ minAreaSqft, maxAreaSqft });
    if (appliedRange.minAreaSqft !== minAreaSqft || appliedRange.maxAreaSqft !== maxAreaSqft) {
        setAppliedRange({ minAreaSqft, maxAreaSqft });
        const next = draftsFromApplied(minAreaSqft, maxAreaSqft);
        setMinDraft(next.minDraft);
        setMaxDraft(next.maxDraft);
    }

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    };

    const commitRange = (low: number, high: number) => {
        const nextLow = snapArea(low);
        let nextHigh = snapArea(high);
        // A max under min is raised so it stays above the minimum.
        if (nextHigh < nextLow) nextHigh = nextLow;

        const atCeiling = nextHigh >= OWNER_LISTINGS_AREA_RANGE.max;
        const nextMin = nextLow <= OWNER_LISTINGS_AREA_RANGE.min ? "" : String(nextLow);
        const nextMax = atCeiling ? AREA_ABOVE_MAX_TOKEN : String(nextHigh);

        // Full span is the default "Any" — don't mark 5,000+ until the range is narrowed
        // or the thumb is explicitly parked on the ceiling after a real max was set.
        if (!nextMin && atCeiling && !minAreaSqft && !maxAreaSqft) {
            onAreaChange({ minAreaSqft: "", maxAreaSqft: "" });
            return;
        }

        onAreaChange({ minAreaSqft: nextMin, maxAreaSqft: nextMax });
    };

    const commitInputs = () => {
        const parsedMin = parseAreaField(minDraft, "min");
        const parsedMax = parseAreaField(maxDraft, "max");

        if (parsedMin == null || parsedMax == null) {
            const next = draftsFromApplied(minAreaSqft, maxAreaSqft);
            setMinDraft(next.minDraft);
            setMaxDraft(next.maxDraft);
            return;
        }

        commitRange(parsedMin, parsedMax);
    };

    return (
        <div className={cn("inline-full min-inline-0", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger
                    className="flex inline-full min-inline-0"
                    render={
                        <OwnerListingsBandSegment
                            label="Area"
                            icon={Ruler}
                            value={formatAreaFilterLabel(minAreaSqft, maxAreaSqft)}
                            className="inline-full"
                            isOpen={open}
                            isActive={isActive}
                        />
                    }
                />
                <DropdownMenuContent
                    align="center"
                    sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                    className={cn(
                        OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                        AREA_MENU_WIDTH_CLASS,
                        "overflow-hidden! p-0",
                    )}
                >
                    <div className="flex flex-col gap-5 bg-surface p-5">
                        <OwnerListingsBandMenuHeader
                            description="Built-up size in sqft"
                            showReset={isActive}
                            onClear={() => {
                                onAreaChange({ minAreaSqft: "", maxAreaSqft: "" });
                                onCommit?.();
                            }}
                        />

                        <div className="flex items-start gap-3">
                            <label className="flex flex-1 flex-col gap-1.5 min-inline-0">
                                <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                                    Min
                                </span>
                                <div className={AREA_INPUT_SHELL}>
                                    <span className="body-sm shrink-0 font-medium text-ink-subtle">
                                        sq ft
                                    </span>
                                    <span className="block-3.5 inline-px bg-border" aria-hidden />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        value={minDraft}
                                        placeholder={String(OWNER_LISTINGS_AREA_RANGE.min)}
                                        aria-label="Minimum area in square feet"
                                        onValueChange={setMinDraft}
                                        onBlur={commitInputs}
                                        onKeyDown={(event) => {
                                            stopMenuKeys(event);
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                commitInputs();
                                            }
                                        }}
                                        onPointerDown={stopMenuKeys}
                                        className={AREA_INPUT_CLASS}
                                        wrapperClassName="flex-1 shadow-none min-inline-0"
                                    />
                                </div>
                            </label>

                            <label className="flex flex-1 flex-col gap-1.5 min-inline-0">
                                <span className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                                    Max
                                </span>
                                <div className={AREA_INPUT_SHELL}>
                                    <span className="body-sm shrink-0 font-medium text-ink-subtle">
                                        sq ft
                                    </span>
                                    <span className="block-3.5 inline-px bg-border" aria-hidden />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        value={maxDraft}
                                        placeholder={OPEN_MAX_LABEL}
                                        aria-label="Maximum area in square feet"
                                        onValueChange={setMaxDraft}
                                        onBlur={commitInputs}
                                        onKeyDown={(event) => {
                                            stopMenuKeys(event);
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                commitInputs();
                                            }
                                        }}
                                        onPointerDown={stopMenuKeys}
                                        className={AREA_INPUT_CLASS}
                                        wrapperClassName="flex-1 shadow-none min-inline-0"
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-end gap-1 px-0.5 block-16" aria-hidden>
                                {AREA_HISTOGRAM.map((height, index) => {
                                    const span =
                                        OWNER_LISTINGS_AREA_RANGE.max -
                                        OWNER_LISTINGS_AREA_RANGE.min;
                                    const bucketMin =
                                        OWNER_LISTINGS_AREA_RANGE.min +
                                        (index / AREA_HISTOGRAM.length) * span;
                                    const bucketMax =
                                        OWNER_LISTINGS_AREA_RANGE.min +
                                        ((index + 1) / AREA_HISTOGRAM.length) * span;
                                    const active = bucketMax >= range[0] && bucketMin <= range[1];

                                    return (
                                        <span
                                            key={index}
                                            className={cn(
                                                `
                                                  min-inline-0 flex-1 rounded-[3px]
                                                  transition-[background-color,opacity,transform]
                                                  duration-160
                                                  ease-[cubic-bezier(0.22,1,0.36,1)]
                                                `,
                                                active
                                                    ? "bg-brand opacity-100"
                                                    : "bg-border-warm opacity-85",
                                            )}
                                            style={{
                                                height: `${Math.round(Math.max(0.08, height) * 100)}%`,
                                                transitionDelay: open
                                                    ? `${Math.min(index, 14) * 10}ms`
                                                    : "0ms",
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            <RangeSlider
                                value={range}
                                min={OWNER_LISTINGS_AREA_RANGE.min}
                                max={OWNER_LISTINGS_AREA_RANGE.max}
                                step={OWNER_LISTINGS_AREA_RANGE.step}
                                thumbAlignment="edge"
                                thumbLabels={["Minimum area", "Maximum area"]}
                                onValueChange={(next) => {
                                    const [low, high] = next as [number, number];
                                    commitRange(Math.min(low, high), Math.max(low, high));
                                }}
                                className="
                                  [&>div]:py-2.5
                                  [&>div>div]:rounded-full
                                  [&>div>div]:bg-border
                                  [&>div>div]:block-1.5
                                  [&>div>div>div:first-child]:rounded-full
                                  [&>div>div>div:first-child]:bg-brand
                                  [&_[class*='block-5']]:border-[3px]
                                  [&_[class*='block-5']]:border-brand
                                  [&_[class*='block-5']]:bg-surface
                                  [&_[class*='block-5']]:shadow-md
                                  [&_[class*='block-5']]:block-6
                                  [&_[class*='block-5']]:inline-6
                                  [&_[class*='block-5']]:transition-[box-shadow,transform]
                                  [&_[class*='block-5']]:duration-160
                                  [&_[class*='block-5']]:ease-[cubic-bezier(0.22,1,0.36,1)]
                                  [&_[class*='block-5'][data-dragging]]:scale-110
                                  [&_[class*='block-5'][data-dragging]]:ring-3
                                  [&_[class*='block-5'][data-dragging]]:ring-brand/25
                                "
                            />
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
