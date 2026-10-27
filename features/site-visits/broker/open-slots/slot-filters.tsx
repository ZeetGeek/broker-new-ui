"use client";

import { Building2, UserRound } from "@/components/shared/icons";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { PersonSummary } from "@/features/site-visits/broker/model";
import type { ApiOwnerOption, ApiPropertyOption } from "@/lib/api/broker-visits-map";

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

function propertyOptionLabel(option: ApiPropertyOption): string {
    const title = option.title?.trim() ?? "";
    const locality = option.locality?.trim() ?? "";
    if (title && locality) return `${title} · ${locality}`;
    return title || locality || "Property";
}

function FilterSelect({
    label,
    value,
    placeholder,
    options,
    onChange,
}: {
    label: string;
    value: string;
    placeholder: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    const current = value || "any";
    return (
        <label className="space-y-1.5">
            <span className="body-xs font-semibold text-ink-muted">{label}</span>
            <Select
                value={current}
                onValueChange={(next) => onChange(!next || next === "any" ? "" : next)}
            >
                <SelectTrigger size="md">
                    <SelectValue placeholder={placeholder}>
                        {(selected: string | null) => {
                            if (!selected || selected === "any") return placeholder;
                            return (
                                options.find((option) => option.value === selected)?.label ??
                                placeholder
                            );
                        }}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">{placeholder}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
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
    propertyOptions = [],
    propertyId,
    onPropertyChange,
}: {
    value: SlotFilterState;
    onChange: (next: SlotFilterState) => void;
    buyers?: PersonSummary[];
    buyerId?: string;
    onBuyerChange?: (id?: string) => void;
    ownerOptions?: ApiOwnerOption[];
    propertyOptions?: ApiPropertyOption[];
    propertyId?: string;
    onPropertyChange?: (id?: string) => void;
}) {
    const shownPropertyOptions = value.owner
        ? propertyOptions.filter(
              (option) =>
                  option.exclusiveOwnerId === undefined ||
                  option.exclusiveOwnerId === value.owner,
          )
        : propertyOptions;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
                <span className="body-xs font-semibold text-ink-muted">Lead</span>
                <Select
                    value={buyerId ?? "all"}
                    onValueChange={(next) =>
                        onBuyerChange?.(next && next !== "all" ? next : undefined)
                    }
                >
                    <SelectTrigger size="md" startIcon={UserRound}>
                        <SelectValue placeholder="All leads">
                            {(selected: string | null) => {
                                if (!selected || selected === "all") return "All leads";
                                return (
                                    buyers.find((buyer) => buyer.id === selected)?.name ??
                                    "Selected lead"
                                );
                            }}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All leads</SelectItem>
                        {buyers.map((buyer) => (
                            <SelectItem key={buyer.id} value={buyer.id}>
                                {buyer.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </label>
            {ownerOptions.length > 0 ? (
                <FilterSelect
                    label="Owner"
                    value={value.owner}
                    placeholder="All owners"
                    options={ownerOptions.map((owner) => ({
                        value: owner.id,
                        label: owner.name,
                    }))}
                    onChange={(owner) => {
                        onChange({ ...value, owner });
                        const selected = propertyOptions.find((option) => option.id === propertyId);
                        if (
                            owner &&
                            selected?.exclusiveOwnerId !== undefined &&
                            selected.exclusiveOwnerId !== owner
                        ) {
                            onPropertyChange?.(undefined);
                        }
                    }}
                />
            ) : null}
            <label className="space-y-1.5">
                <span className="body-xs font-semibold text-ink-muted">Property</span>
                <Select
                    value={propertyId ?? "all"}
                    onValueChange={(next) =>
                        onPropertyChange?.(!next || next === "all" ? undefined : next)
                    }
                >
                    <SelectTrigger size="md" startIcon={Building2}>
                        <SelectValue placeholder="All properties">
                            {(selected: string | null) => {
                                if (!selected || selected === "all") return "All properties";
                                const option = propertyOptions.find((item) => item.id === selected);
                                return option ? propertyOptionLabel(option) : "Selected property";
                            }}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All properties</SelectItem>
                        {shownPropertyOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {propertyOptionLabel(option)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </label>
        </div>
    );
}
