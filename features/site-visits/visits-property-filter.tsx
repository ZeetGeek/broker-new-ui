"use client";

import { useMemo } from "react";

import { mapLabeledPropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import { PropertyInlineSelect } from "@/components/shared/property-inline-select";

import type { VisitPropertyOption } from "@/features/site-visits/types";

/** Narrows the visits list to one property using the shared inline picker. */
export function VisitsPropertyFilter({
    properties,
    value,
    onChange,
}: {
    properties: VisitPropertyOption[];
    value: string;
    onChange: (propertyId: string) => void;
}) {
    const pickerProperties = useMemo(
        () =>
            properties.map((property) => ({
                ...mapLabeledPropertyToPicker(property),
                statusChips: [
                    {
                        label: `${property.count} ${property.count === 1 ? "visit" : "visits"}`,
                        color: "stone" as const,
                    },
                ],
            })),
        [properties],
    );

    if (properties.length === 0) return null;

    return (
        <PropertyInlineSelect
            properties={pickerProperties}
            value={value || null}
            onValueChange={(id) => onChange(id ?? "")}
            placeholder="All properties"
            ariaLabel="Filter visits by property"
            allowClear
            clearLabel="All properties"
            className="shrink-0 inline-64 max-inline-full"
        />
    );
}
