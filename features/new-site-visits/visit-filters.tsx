"use client";

import { useMemo, useState } from "react";

import { AppDateRangeFields } from "@/components/shared/app-date-range-fields";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AppModalHeader } from "@/components/shared/app-modal-header";
import { mapFilterPersonToPicker } from "@/components/shared/map-to-people-picker-person";
import { mapFilterPropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import { PropertyInlineSelect } from "@/components/shared/property-inline-select";
import { Dialog, DialogPopup } from "@/components/ui/dialog";

export type VisitFilters = {
    client: string;
    property: string;
    from: string;
    to: string;
    range: string;
};

export const EMPTY_FILTERS: VisitFilters = {
    client: "",
    property: "",
    from: "",
    to: "",
    range: "",
};

/** Visits needs only who and where; dates live on the toolbar. */
export function VisitFiltersDialog({
    value,
    clientOptions,
    propertyOptions,
    onApply,
    onClose,
}: {
    value: VisitFilters;
    clientOptions: { id: string; name: string }[];
    propertyOptions: { id: string; title: string }[];
    onApply: (value: VisitFilters) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(value);
    const clientPeople = useMemo(
        () => clientOptions.map((client) => mapFilterPersonToPicker(client, "client")),
        [clientOptions],
    );
    const propertyRows = useMemo(
        () => propertyOptions.map(mapFilterPropertyToPicker),
        [propertyOptions],
    );
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogPopup
                showCloseButton={false}
                className="flex flex-col gap-0 overflow-hidden p-0 inline-[min(32rem,calc(100vw-1rem))]"
            >
                <AppModalHeader title="Filter visits" />
                <div className="flex flex-col gap-5 p-5 sm:p-8">
                    <PeopleInlineSelect
                        label="Client"
                        lockedScope="client"
                        people={clientPeople}
                        value={draft.client || null}
                        onValueChange={(client) =>
                            setDraft((current) => ({
                                ...current,
                                client: client ?? "",
                            }))
                        }
                        placeholder="Any client"
                        allowClear
                        clearLabel="Any client"
                    />
                    <PropertyInlineSelect
                        label="Property"
                        properties={propertyRows}
                        value={draft.property || null}
                        onValueChange={(property) =>
                            setDraft((current) => ({
                                ...current,
                                property: property ?? "",
                            }))
                        }
                        placeholder="Any property"
                        allowClear
                        clearLabel="Any property"
                    />
                </div>
                <AppModalFooter
                    className="justify-between border-bs border-border-warm p-5 sm:px-8"
                    secondaryLabel="Clear"
                    onSecondary={() => onApply({ ...draft, client: "", property: "" })}
                    primaryLabel="Show visits"
                    onPrimary={() => onApply(draft)}
                />
            </DialogPopup>
        </Dialog>
    );
}

/** Custom visit dates stay on the toolbar, separate from the filters. */
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
