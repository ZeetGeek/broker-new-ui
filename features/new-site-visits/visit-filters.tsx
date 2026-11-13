"use client";

import { useMemo, useState } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";

import { AppDateRangeFields } from "@/components/shared/app-date-range-fields";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AppModalHeader } from "@/components/shared/app-modal-header";
import { Dialog, DialogPopup } from "@/components/ui/dialog";

import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";

export type VisitFilters = {
    client: string;
    property: string;
    from: string;
    to: string;
    archive: string;
    range: string;
};
export const EMPTY_FILTERS: VisitFilters = {
    client: "",
    property: "",
    from: "",
    to: "",
    archive: "",
    range: "",
};

/** Use the same property filter sheet as Pipeline and My listings. */
export function VisitFiltersDialog({
    value,
    onApply,
    onClose,
}: {
    value: PropertyListCriteria;
    onApply: (value: PropertyListCriteria) => void;
    onClose: () => void;
}) {
    const appliedFilters = useMemo(
        () => ({ ...DEFAULT_OWNER_LISTINGS_FILTERS, ...value }),
        [value],
    );
    return (
        <OwnerListingsFilterSheet
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            appliedFilters={appliedFilters}
            discoveryFilters={value}
            showDiscoveryFilters
            discoveryDescription="Narrow these visits by location, budget and property type."
            onApply={(patch, discovery) => {
                const criteriaPatch = Object.fromEntries(
                    Object.keys(EMPTY_PROPERTY_CRITERIA)
                        .filter((key) => key in patch)
                        .map((key) => [key, patch[key as keyof typeof patch]]),
                );
                onApply(normalizePropertyCriteria({ ...discovery, ...criteriaPatch }));
            }}
        />
    );
}

/** Custom visit dates stay on the toolbar, separate from property filters. */
export function VisitDateRangeDialog({
    value,
    onApply,
    onClose,
}: {
    value: VisitFilters;
    onApply: (value: VisitFilters) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(value);
    const invalid = !!(draft.from && draft.to && draft.from > draft.to);
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogPopup
                showCloseButton={false}
                className="flex flex-col gap-0 overflow-hidden p-0 inline-[min(40rem,calc(100vw-1rem))]"
            >
                <AppModalHeader title="Visit dates" />
                <div className="p-5 sm:p-8">
                    <AppDateRangeFields
                        from={draft.from}
                        to={draft.to}
                        onChange={(range) => setDraft((current) => ({ ...current, ...range }))}
                    />
                </div>
                <AppModalFooter
                    className="justify-between border-bs border-border-warm p-5 sm:px-8"
                    secondaryLabel="Cancel"
                    onSecondary={onClose}
                    primaryLabel="Show visits"
                    primaryDisabled={invalid}
                    onPrimary={() => onApply({ ...draft, range: "custom" })}
                />
            </DialogPopup>
        </Dialog>
    );
}
