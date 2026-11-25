"use client";

import { type ReactNode, useState } from "react";

import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { Check, ChevronDown } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type OwnerLeadsDealType = "" | "sale" | "rent";
export type OwnerLeadsSort = "recent" | "oldest";

export type OwnerLeadsFilters = {
    q: string;
    dealType: OwnerLeadsDealType;
    locality: string;
    brokerName: string;
    sort: OwnerLeadsSort;
};

const SORT_OPTIONS: { value: OwnerLeadsSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
];

const TYPE_OPTIONS: { value: OwnerLeadsDealType; label: string }[] = [
    { value: "", label: "All types" },
    { value: "sale", label: "Sale" },
    { value: "rent", label: "Rent" },
];

const CHIP_CLASS = `
  body-sm flex shrink-0 items-center gap-1.5 rounded-control border border-border-warm bg-surface
  px-3 font-medium text-ink transition-colors duration-160 block-control-md
  hover:border-ink/25
`;

function FilterMenu<T extends string>({
    label,
    valueLabel,
    isDefault,
    value,
    options,
    onChange,
}: {
    label: string;
    valueLabel: string;
    isDefault: boolean;
    value: T;
    options: readonly { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const trigger = (
        <button type="button" className={cn(CHIP_CLASS, isDefault && "text-ink-muted")}>
            <span className="hidden sm:inline">{valueLabel}</span>
            <span className="sm:hidden">{label}</span>
            <ChevronDown aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
        </button>
    );

    if (mobile) {
        return (
            <MobileActionDrawer open={open} onOpenChange={setOpen} title={label} trigger={trigger}>
                {options.map((option) => (
                    <button
                        key={option.value || "all"}
                        type="button"
                        className={mobileActionClass}
                        aria-pressed={value === option.value}
                        onClick={() => {
                            onChange(option.value);
                            setOpen(false);
                        }}
                    >
                        {option.label}
                        {value === option.value ? <Check aria-hidden className="ms-auto" /> : null}
                    </button>
                ))}
            </MobileActionDrawer>
        );
    }

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger render={<DropdownMenuTrigger render={trigger} />} />
                <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value || "all"}
                        onClick={() => onChange(option.value)}
                        className={cn(value === option.value && "font-semibold")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function OwnerLeadsToolbar({
    filters,
    localities,
    brokers,
    onPatch,
    trailing,
}: {
    filters: OwnerLeadsFilters;
    localities: string[];
    brokers: string[];
    onPatch: (patch: Partial<OwnerLeadsFilters>) => void;
    trailing?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <FilterMenu
                label="Deal type"
                valueLabel={
                    TYPE_OPTIONS.find((option) => option.value === filters.dealType)?.label ??
                    "All types"
                }
                isDefault={filters.dealType === ""}
                value={filters.dealType}
                options={TYPE_OPTIONS}
                onChange={(dealType) => onPatch({ dealType })}
            />

            <FilterMenu
                label="Area"
                valueLabel={formatPlaceName(filters.locality) || "Area"}
                isDefault={!filters.locality}
                value={filters.locality}
                options={[
                    { value: "", label: "All areas" },
                    ...localities.map((locality) => ({
                        value: locality,
                        label: formatPlaceName(locality),
                    })),
                ]}
                onChange={(locality) => onPatch({ locality })}
            />

            <FilterMenu
                label="Broker"
                valueLabel={filters.brokerName || "Broker"}
                isDefault={!filters.brokerName}
                value={filters.brokerName}
                options={[
                    { value: "", label: "All brokers" },
                    ...brokers.map((broker) => ({ value: broker, label: broker })),
                ]}
                onChange={(brokerName) => onPatch({ brokerName })}
            />

            <ListToolbarSelect
                label="Sort leads"
                value={filters.sort}
                options={SORT_OPTIONS}
                defaultValue="recent"
                mobileLabel="Sort"
                tooltip="Change the order of the cards."
                onChange={(sort) => onPatch({ sort })}
            />

            <div className="ms-auto flex flex-wrap items-center gap-2">
                <ListSearchField
                    placeholder="Search broker, buyer or area"
                    aria-label="Search your leads"
                    value={filters.q}
                    onChange={(q) => onPatch({ q })}
                />
                {trailing}
            </div>
        </div>
    );
}
