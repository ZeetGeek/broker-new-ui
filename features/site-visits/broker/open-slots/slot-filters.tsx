"use client";

import type { ReactNode } from "react";

import { Clock3, IndianRupee, MapPin, SlidersHorizontal, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { TIME_BUCKETS } from "@/lib/visits/constants";

import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { PersonSummary } from "@/features/site-visits/broker/model";
import type { ApiPropertyOption } from "@/lib/api/broker-visits-map";

export type SlotDateRange = "today" | "tomorrow" | "week" | "month" | "custom";

export type SlotFilterState = {
    range: SlotDateRange;
    customFrom: string;
    customTo: string;
    timeBuckets: string[];
    localities: string[];
    purpose: "" | "sale" | "rent";
    propertyType: string;
    bhk: string;
    minBudget: string;
    maxBudget: string;
    owner: string;
    onlyAccepted: boolean;
    hideFull: boolean;
};

export const DEFAULT_SLOT_FILTERS: SlotFilterState = {
    range: "week",
    customFrom: "",
    customTo: "",
    timeBuckets: [],
    localities: [],
    purpose: "",
    propertyType: "",
    bhk: "",
    minBudget: "",
    maxBudget: "",
    owner: "",
    onlyAccepted: true,
    hideFull: true,
};

function FilterSection({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: typeof Clock3;
    children: ReactNode;
}) {
    return (
        <fieldset className="space-y-3">
            <legend className="body-sm flex items-center gap-2 font-semibold text-ink">
                <Icon aria-hidden className="text-brand block-4 inline-4" strokeWidth={1.75} />
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

function ToggleButton({
    selected,
    children,
    onClick,
}: {
    selected: boolean;
    children: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                "body-sm rounded-control border px-3 font-semibold transition-[background-color,border-color,color] duration-160 block-control-lg",
                selected
                    ? "border-brand bg-brand-soft text-brand-text"
                    : "border-border-warm bg-surface text-ink-muted hover:border-ink/25 hover:text-ink",
            )}
        >
            {children}
        </button>
    );
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
                    <SelectValue placeholder={placeholder} />
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
    propertyOptions = [],
    propertyId,
    onPropertyChange,
}: {
    value: SlotFilterState;
    onChange: (next: SlotFilterState) => void;
    buyers?: PersonSummary[];
    buyerId?: string;
    onBuyerChange?: (id?: string) => void;
    propertyOptions?: ApiPropertyOption[];
    propertyId?: string;
    onPropertyChange?: (id?: string) => void;
}) {
    const toggleArray = (key: "timeBuckets" | "localities", item: string) =>
        onChange({
            ...value,
            [key]: value[key].includes(item)
                ? value[key].filter((entry) => entry !== item)
                : [...value[key], item],
        });
    const showMatch = Boolean(onBuyerChange || onPropertyChange);

    return (
        <div className="space-y-6">
            {showMatch ? (
                <FilterSection title="Buyer and property" icon={UserRound}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {onBuyerChange ? (
                            <label className="space-y-1.5">
                                <span className="body-xs font-semibold text-ink-muted">Buyer</span>
                                <Select
                                    value={buyerId ?? "all"}
                                    onValueChange={(next) =>
                                        onBuyerChange(next && next !== "all" ? next : undefined)
                                    }
                                >
                                    <SelectTrigger size="md" startIcon={UserRound}>
                                        <SelectValue placeholder="All buyers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All buyers</SelectItem>
                                        {buyers.map((buyer) => (
                                            <SelectItem key={buyer.id} value={buyer.id}>
                                                {buyer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        ) : null}
                        {onPropertyChange ? (
                            <label className="space-y-1.5">
                                <span className="body-xs font-semibold text-ink-muted">
                                    Property
                                </span>
                                <Select
                                    value={propertyId ?? "all"}
                                    onValueChange={(next) =>
                                        onPropertyChange(!next || next === "all" ? undefined : next)
                                    }
                                >
                                    <SelectTrigger size="md">
                                        <SelectValue placeholder="All properties" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All properties</SelectItem>
                                        {propertyOptions.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                                {option.locality
                                                    ? `${option.title} · ${option.locality}`
                                                    : option.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        ) : null}
                    </div>
                </FilterSection>
            ) : null}

            <FilterSection title="Time of day" icon={Clock3}>
                <div className="grid gap-2 sm:grid-cols-3">
                    {TIME_BUCKETS.map((bucket) => {
                        const checked = value.timeBuckets.includes(bucket.id);
                        return (
                            <label
                                key={bucket.id}
                                className={cn(
                                    "flex cursor-pointer items-center gap-3 rounded-control border px-3 block-control-xl",
                                    checked
                                        ? "border-brand bg-brand-soft text-brand-text"
                                        : "border-border-warm bg-surface text-ink",
                                )}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => toggleArray("timeBuckets", bucket.id)}
                                />
                                <span className="body-sm font-semibold">
                                    {bucket.label}{" "}
                                    <span className="body-xs font-normal text-ink-muted">
                                        {bucket.detail}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            </FilterSection>

            <FilterSection title="Locality" icon={MapPin}>
                <div className="flex flex-wrap gap-2">
                    {["Vesu", "Adajan", "Piplod", "Pal", "City Light"].map((locality) => (
                        <ToggleButton
                            key={locality}
                            selected={value.localities.includes(locality)}
                            onClick={() => toggleArray("localities", locality)}
                        >
                            {locality}
                        </ToggleButton>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Property" icon={SlidersHorizontal}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <FilterSelect
                        label="Purpose"
                        value={value.purpose}
                        placeholder="Any purpose"
                        options={[
                            { value: "sale", label: "Sale" },
                            { value: "rent", label: "Rent" },
                        ]}
                        onChange={(purpose) =>
                            onChange({ ...value, purpose: purpose as SlotFilterState["purpose"] })
                        }
                    />
                    <FilterSelect
                        label="Property type"
                        value={value.propertyType}
                        placeholder="Any type"
                        options={[
                            { value: "Apartment", label: "Apartment" },
                            { value: "Villa", label: "Villa" },
                            { value: "Commercial", label: "Commercial" },
                        ]}
                        onChange={(propertyType) => onChange({ ...value, propertyType })}
                    />
                    <FilterSelect
                        label="BHK"
                        value={value.bhk}
                        placeholder="Any BHK"
                        options={[
                            { value: "2", label: "2 BHK" },
                            { value: "3", label: "3 BHK" },
                            { value: "4", label: "4 BHK" },
                        ]}
                        onChange={(bhk) => onChange({ ...value, bhk })}
                    />
                </div>
            </FilterSection>

            <FilterSection title="Budget" icon={IndianRupee}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FilterSelect
                        label="Minimum"
                        value={value.minBudget}
                        placeholder="No minimum"
                        options={[
                            { value: "5000000", label: "₹50 L" },
                            { value: "10000000", label: "₹1 Cr" },
                            { value: "20000000", label: "₹2 Cr" },
                        ]}
                        onChange={(minBudget) =>
                            onChange({
                                ...value,
                                minBudget,
                                maxBudget:
                                    value.maxBudget && Number(value.maxBudget) < Number(minBudget)
                                        ? minBudget
                                        : value.maxBudget,
                            })
                        }
                    />
                    <FilterSelect
                        label="Maximum"
                        value={value.maxBudget}
                        placeholder="No maximum"
                        options={[
                            { value: "10000000", label: "₹1 Cr" },
                            { value: "20000000", label: "₹2 Cr" },
                            { value: "40000000", label: "₹4 Cr" },
                        ]}
                        onChange={(maxBudget) =>
                            onChange({
                                ...value,
                                maxBudget,
                                minBudget:
                                    maxBudget && Number(value.minBudget) > Number(maxBudget)
                                        ? maxBudget
                                        : value.minBudget,
                            })
                        }
                    />
                </div>
            </FilterSection>

            <FilterSection title="Owner and access" icon={SlidersHorizontal}>
                <FilterSelect
                    label="Owner"
                    value={value.owner}
                    placeholder="All owners"
                    options={[
                        { value: "o_1", label: "Zeet Patel" },
                        { value: "o_2", label: "Ramesh Shah" },
                        { value: "o_3", label: "Bhavna Desai" },
                        { value: "o_4", label: "Manish Vora" },
                    ]}
                    onChange={(owner) => onChange({ ...value, owner })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center justify-between gap-3 rounded-control bg-surface-muted px-4 min-block-14">
                        <span>
                            <span className="body-sm block font-semibold text-ink">
                                Accepted properties only
                            </span>
                            <span className="body-xs block text-ink-muted">
                                Include your own listings automatically
                            </span>
                        </span>
                        <Switch
                            checked={value.onlyAccepted}
                            onCheckedChange={(onlyAccepted) => onChange({ ...value, onlyAccepted })}
                        />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-control bg-surface-muted px-4 min-block-14">
                        <span>
                            <span className="body-sm block font-semibold text-ink">
                                Hide full slots
                            </span>
                            <span className="body-xs block text-ink-muted">
                                Keep booked-by-you slots visible
                            </span>
                        </span>
                        <Switch
                            checked={value.hideFull}
                            onCheckedChange={(hideFull) => onChange({ ...value, hideFull })}
                        />
                    </label>
                </div>
            </FilterSection>
        </div>
    );
}
