"use client";

import { useState } from "react";

import type { ApiLeadOption, ApiOwnerOption } from "@/lib/api/broker-visits-map";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

import type { PersonSummary } from "@/features/site-visits/broker/model";
import type { VisitPeopleFilter } from "@/features/site-visits/broker/my-visits/visit-filter-options";
import { SlotFilters } from "@/features/site-visits/broker/open-slots/slot-filters";

export function VisitFiltersDialog({
    open,
    onOpenChange,
    value,
    onApply,
    buyers,
    ownerOptions,
    leadOptions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: VisitPeopleFilter;
    onApply: (next: VisitPeopleFilter) => void;
    buyers: PersonSummary[];
    ownerOptions: ApiOwnerOption[];
    leadOptions: ApiLeadOption[];
}) {
    const [draft, setDraft] = useState<VisitPeopleFilter>(value);

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (next) setDraft(value);
                onOpenChange(next);
            }}
            title="Filter my visits"
            bodyClassName="p-0"
            size="lg"
            className="gap-0 overflow-hidden p-0 max-inline-3xl sm:max-inline-3xl"
            description={
                <>Pick a client or owner to narrow the leads, then pick a lead to see its visits.</>
            }
            footer={
                <AppModalFooter
                    secondaryLabel="Reset filter"
                    onSecondary={() => setDraft({})}
                    primaryLabel="Apply filters"
                    onPrimary={() => {
                        onApply(draft);
                        onOpenChange(false);
                    }}
                    className="border-bs border-border-warm bg-surface px-5 py-4"
                />
            }
            footerClassName="p-0"
        >
            <div className="overflow-y-auto p-5 max-block-[68dvh]">
                <SlotFilters
                    buyers={buyers}
                    buyerId={draft.buyerId}
                    onBuyerChange={(buyerId) => setDraft((current) => ({ ...current, buyerId }))}
                    ownerOptions={ownerOptions}
                    ownerId={draft.ownerId}
                    onOwnerChange={(ownerId) => setDraft((current) => ({ ...current, ownerId }))}
                    leadOptions={leadOptions}
                    leadId={draft.leadId}
                    onLeadChange={(leadId) => setDraft((current) => ({ ...current, leadId }))}
                />
            </div>
        </AppModal>
    );
}
