"use client";

import { useState } from "react";

import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { areaColorClassName } from "@/lib/styles/area-color";
import { cn } from "@/lib/utils";

import { MapPin, Pencil, Plus } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

const PREVIEW_COUNT = 3;

export function ContactAreaChips({
    areas,
    onEditAreas,
    editLabel = "Add or edit areas",
}: {
    areas: readonly string[];
    onEditAreas?: () => void;
    editLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const remainingAreas = areas.slice(PREVIEW_COUNT);
    const chipClassName =
        "body-xs inline-flex rounded-full px-2.5 py-1 font-semibold wrap-break-word max-inline-full min-inline-0";
    const moreClassName =
        "body-xs touch-target cursor-pointer rounded-sm px-1 py-1 font-semibold text-brand-text underline decoration-brand/35 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-2 focus-visible:ring-ring/30";

    return (
        <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
            {areas.slice(0, PREVIEW_COUNT).map((area) => (
                <span key={area} className={cn(chipClassName, areaColorClassName(area))}>
                    {formatPlaceName(area)}
                </span>
            ))}
            {remainingAreas.length > 0 ? (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                        onClick={(event) => event.stopPropagation()}
                        className={moreClassName}
                        aria-label={`View ${remainingAreas.length} more areas`}
                    >
                        +{remainingAreas.length} more
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        className="inline-max max-inline-[min(24rem,calc(100dvw-2rem))]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <PopoverTitle className="font-semibold text-ink">More areas</PopoverTitle>
                        <ul className="flex flex-col gap-2 overflow-y-auto max-block-60">
                            {remainingAreas.map((area) => (
                                <li key={area} className="flex items-start gap-2 min-inline-0">
                                    <MapPin
                                        aria-hidden
                                        className="mbs-1 shrink-0 text-ink-muted block-4 inline-4"
                                    />
                                    <span className={cn(chipClassName, areaColorClassName(area))}>
                                        {formatPlaceName(area)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {onEditAreas ? (
                            <div className="border-bs border-border-warm pbs-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="inline-full"
                                    onClick={() => {
                                        setOpen(false);
                                        onEditAreas();
                                    }}
                                >
                                    <Pencil aria-hidden />
                                    {editLabel}
                                </Button>
                            </div>
                        ) : null}
                    </PopoverContent>
                </Popover>
            ) : onEditAreas ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEditAreas();
                    }}
                    className={cn(moreClassName, "inline-flex items-center gap-1")}
                    aria-label={editLabel}
                >
                    <Plus aria-hidden className="block-3 inline-3" /> Add area
                </button>
            ) : null}
        </div>
    );
}
