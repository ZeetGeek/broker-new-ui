"use client";

import type { ApiLeadOption, ApiOwnerOption } from "@/lib/api/broker-visits-map";

import type { AppIcon } from "@/components/shared/icons";
import { Building2, Home, UserRound } from "@/components/shared/icons";
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

export function SlotFilters({
    value,
    onChange,
    buyers = [],
    buyerId,
    onBuyerChange,
    ownerOptions = [],
    leadOptions = [],
    leadId,
    onLeadChange,
}: {
    value: SlotFilterState;
    onChange: (next: SlotFilterState) => void;
    buyers?: PersonSummary[];
    buyerId?: string;
    onBuyerChange?: (id?: string) => void;
    ownerOptions?: ApiOwnerOption[];
    leadOptions?: ApiLeadOption[];
    leadId?: string;
    onLeadChange?: (id?: string) => void;
}) {
    const shownLeads = leadOptions.filter((option) =>
        leadMatches(option, buyerId, value.owner || undefined),
    );
    const shownOwners = ownersForBuyer(ownerOptions, leadOptions, buyerId);

    // Drop the chosen lead when a new buyer / owner no longer includes it.
    const keepLeadIfMatches = (nextBuyerId?: string, nextOwner?: string) => {
        if (!leadId) return;
        const lead = leadOptions.find((option) => option.id === leadId);
        if (!lead || !leadMatches(lead, nextBuyerId, nextOwner)) onLeadChange?.(undefined);
    };

    const leadEmptyLabel =
        buyerId && value.owner
            ? "This buyer has no leads with this owner"
            : buyerId
              ? "This buyer has no leads yet"
              : value.owner
                ? "No leads on this owner's properties"
                : "No leads yet";

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FilterSelect
                label="Buyer"
                icon={UserRound}
                value={buyerId}
                placeholder="All buyers"
                options={buyers.map((buyer) => ({ value: buyer.id, label: buyer.name }))}
                onChange={(next) => {
                    onBuyerChange?.(next);
                    const ownerStays =
                        !value.owner ||
                        ownersForBuyer(ownerOptions, leadOptions, next).some(
                            (owner) => owner.id === value.owner,
                        );
                    if (!ownerStays) onChange({ ...value, owner: "" });
                    keepLeadIfMatches(next, ownerStays ? value.owner || undefined : undefined);
                }}
            />
            {ownerOptions.length > 0 ? (
                <FilterSelect
                    label="Owner"
                    icon={Home}
                    value={value.owner}
                    placeholder="All owners"
                    options={shownOwners.map((owner) => ({ value: owner.id, label: owner.name }))}
                    emptyLabel="This buyer has no leads on an owner's property"
                    onChange={(next) => {
                        onChange({ ...value, owner: next ?? "" });
                        keepLeadIfMatches(buyerId, next);
                    }}
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
