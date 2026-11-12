"use client";

import { useState } from "react";

import { AppDateRangeFields } from "@/components/shared/app-date-range-fields";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AppModalHeader } from "@/components/shared/app-modal-header";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { DATE_RANGES, VISIT_TABS } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import { VisitSelect } from "./visit-select";

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

export function VisitFiltersDialog({
    value,
    onApply,
    onClose,
}: {
    value: VisitFilters;
    onApply: (value: VisitFilters) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(value);
    const patch = (next: Partial<VisitFilters>) => setDraft((d) => ({ ...d, ...next }));
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
                className="flex flex-col gap-0 overflow-hidden p-0 inline-[min(40rem,calc(100vw-1rem))] max-block-[90dvh] max-inline-[min(40rem,calc(100vw-1rem))]"
            >
                <AppModalHeader
                    title="Filter visits"
                    description="Narrow your visits by client, property or date."
                />
                <ScrollArea className="flex-1 min-block-0">
                    <div className="flex flex-col gap-5 p-6">
                        <VisitSelect
                            label="Date range"
                            value={draft.range || "all"}
                            options={DATE_RANGES}
                            onChange={(range) => patch({ range, from: "", to: "" })}
                        />
                        <VisitSelect
                            label="Client"
                            value={draft.client}
                            options={[
                                { value: "", label: "All clients" },
                                ...PREVIEW_CLIENTS.map((c) => ({ value: c.id, label: c.name })),
                            ]}
                            onChange={(client) => patch({ client })}
                        />
                        <VisitSelect
                            label="Property"
                            value={draft.property}
                            options={[
                                { value: "", label: "All properties" },
                                ...PREVIEW_PROPERTIES.map((p) => ({ value: p.id, label: p.title })),
                            ]}
                            onChange={(property) => patch({ property })}
                        />
                        {draft.range === "custom" && (
                            <AppDateRangeFields from={draft.from} to={draft.to} onChange={patch} />
                        )}
                        <VisitSelect
                            label="Status"
                            value={draft.archive}
                            options={[
                                { value: "", label: "Selected visit tab" },
                                { value: "all", label: "All statuses" },
                                ...VISIT_TABS.map((t) => ({ value: t.value, label: t.label })),
                                { value: "cancelled", label: "Cancelled visits" },
                            ]}
                            onChange={(archive) => patch({ archive })}
                        />
                    </div>
                </ScrollArea>
                <AppModalFooter
                    className="border-bs border-border-warm p-6"
                    secondaryLabel="Reset filters"
                    onSecondary={() => setDraft({ ...EMPTY_FILTERS })}
                    primaryLabel="Apply filters"
                    primaryDisabled={invalid}
                    onPrimary={() => onApply(draft)}
                />
            </DialogPopup>
        </Dialog>
    );
}
