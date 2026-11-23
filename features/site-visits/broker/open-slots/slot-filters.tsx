"use client";

import { useMemo } from "react";

import type { ApiLeadOption, ApiOwnerOption } from "@/lib/api/broker-visits-map";

import type { AppIcon } from "@/components/shared/icons";
import { Building2 } from "@/components/shared/icons";
import { mapFilterPersonToPicker } from "@/components/shared/map-to-people-picker-person";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { PersonSummary } from "@/features/site-visits/broker/model";

export type SlotDateRange = "today" | "tomorrow" | "week" | "month" | "custom";

export type SlotFilterState = {
    range: SlotDateRange;
    customFrom: string;
    customTo: string;
    owner: string;
};

export const DEFAULT_SLOT_FILTERS: SlotFilterState = {
    range: "week",
    customFrom: "",
    customTo: "",
    owner: "",
};

export function leadOptionLabel(option: ApiLeadOption): string {
    return `${option.buyerName} · ${option.propertyTitle}`;
}

/** With a buyer chosen, only owners whose properties have a lead for that buyer. */
function ownersForBuyer(
    ownerOptions: ApiOwnerOption[],
    leadOptions: ApiLeadOption[],
    buyerId?: string,
): ApiOwnerOption[] {
    if (!buyerId) return ownerOptions;
    const ownerIds = new Set(
        leadOptions
            .filter((option) => option.clientId === buyerId)
            .map((option) => option.ownerOptionId),
    );
    return ownerOptions.filter((owner) => ownerIds.has(owner.id));
}

/** Lead fits the chosen buyer and owner (either may be unset). */
export function leadMatches(option: ApiLeadOption, buyerId?: string, ownerOptionId?: string) {
    if (buyerId && option.clientId !== buyerId) return false;
    if (ownerOptionId && option.ownerOptionId !== ownerOptionId) return false;
    return true;
}

function FilterSelect({
    label,
    icon,
    value,
    placeholder,
    options,
    emptyLabel,
    onChange,
}: {
    label: string;
    icon: AppIcon;
    value?: string;
    placeholder: string;
    options: { value: string; label: string }[];
    emptyLabel?: string;
    onChange: (value?: string) => void;
}) {
    return (
        <label className="space-y-1.5">
            <span className="body-xs font-semibold text-ink-muted">{label}</span>
            <Select
                value={value || "all"}
                onValueChange={(next) => onChange(!next || next === "all" ? undefined : next)}
            >
                <SelectTrigger size="md" startIcon={icon}>
                    <SelectValue placeholder={placeholder}>
                        {(selected: string | null) => (
                            <span className="truncate">
                                {(selected &&
                                    selected !== "all" &&
                                    options.find((option) => option.value === selected)?.label) ||
                                    placeholder}
                            </span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                    {options.length === 0 && emptyLabel ? (
                        <p className="body-sm px-2 py-1.5 text-ink-muted">{emptyLabel}</p>
                    ) : null}
                </SelectContent>
            </Select>
        </label>
    );
}

/** Buyer → Owner → Lead filter fields, shared by Open slots and My visits. */
export function SlotFilters({
    buyers = [],
    buyerId,
    onBuyerChange,
    ownerOptions = [],
    ownerId,
    onOwnerChange,
    leadOptions = [],
    leadId,
    onLeadChange,
}: {
    buyers?: PersonSummary[];
    buyerId?: string;
    onBuyerChange?: (id?: string) => void;
    ownerOptions?: ApiOwnerOption[];
    ownerId?: string;
    onOwnerChange?: (id?: string) => void;
    leadOptions?: ApiLeadOption[];
    leadId?: string;
    onLeadChange?: (id?: string) => void;
}) {
    const shownLeads = leadOptions.filter((option) => leadMatches(option, buyerId, ownerId));
    const shownOwners = ownersForBuyer(ownerOptions, leadOptions, buyerId);

    const clientPeople = useMemo(
        () => buyers.map((buyer) => mapFilterPersonToPicker(buyer, "client")),
        [buyers],
    );
    const ownerPeople = useMemo(
        () => shownOwners.map((owner) => mapFilterPersonToPicker(owner, "owner")),
        [shownOwners],
    );

    // Drop the chosen lead when a new buyer / owner no longer includes it.
    const keepLeadIfMatches = (nextBuyerId?: string, nextOwner?: string) => {
        if (!leadId) return;
        const lead = leadOptions.find((option) => option.id === leadId);
        if (!lead || !leadMatches(lead, nextBuyerId, nextOwner)) onLeadChange?.(undefined);
    };

    const leadEmptyLabel =
        buyerId && ownerId
            ? "This client has no leads with this owner"
            : buyerId
              ? "This client has no leads yet"
              : ownerId
                ? "No leads on this owner's properties"
                : "No leads yet";

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PeopleInlineSelect
                label="Client"
                lockedScope="client"
                people={clientPeople}
                value={buyerId ?? null}
                onValueChange={(next) => {
                    const id = next ?? undefined;
                    onBuyerChange?.(id);
                    const ownerStays =
                        !ownerId ||
                        ownersForBuyer(ownerOptions, leadOptions, id).some(
                            (owner) => owner.id === ownerId,
                        );
                    if (!ownerStays) onOwnerChange?.(undefined);
                    keepLeadIfMatches(id, ownerStays ? ownerId : undefined);
                }}
                placeholder="All clients"
                allowClear
                clearLabel="All clients"
                size="default"
            />
            {ownerOptions.length > 0 ? (
                <PeopleInlineSelect
                    label="Owner"
                    lockedScope="owner"
                    people={ownerPeople}
                    value={ownerId ?? null}
                    onValueChange={(next) => {
                        const id = next ?? undefined;
                        onOwnerChange?.(id);
                        keepLeadIfMatches(buyerId, id);
                    }}
                    placeholder="All owners"
                    allowClear
                    clearLabel="All owners"
                    size="default"
                />
            ) : null}
            <FilterSelect
                label="Lead"
                icon={Building2}
                value={leadId}
                placeholder="All leads"
                options={shownLeads.map((option) => ({
                    value: option.id,
                    label: leadOptionLabel(option),
                }))}
                emptyLabel={leadEmptyLabel}
                onChange={(next) => onLeadChange?.(next)}
            />
        </div>
    );
}
