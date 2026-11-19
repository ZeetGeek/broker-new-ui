"use client";

import { type ReactNode } from "react";

import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import { ChevronDown } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
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

function FilterMenu({
    label,
    valueLabel,
    isDefault,
    children,
}: {
    label: string;
    valueLabel: string;
    isDefault: boolean;
    children: ReactNode;
}) {
    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <DropdownMenuTrigger
                            render={
                                <button
                                    type="button"
                                    className={cn(CHIP_CLASS, isDefault && "text-ink-muted")}
                                />
                            }
                        >
                            <span className="hidden sm:inline">{valueLabel}</span>
                            <span className="sm:hidden">{label}</span>
                            <ChevronDown
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                        </DropdownMenuTrigger>
                    }
                />
                <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">{children}</DropdownMenuContent>
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
            >
                {TYPE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value || "all"}
                        onClick={() => onPatch({ dealType: option.value })}
                        className={cn(filters.dealType === option.value && "font-semibold")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

            <FilterMenu
                label="Area"
                valueLabel={formatPlaceName(filters.locality) || "Area"}
                isDefault={!filters.locality}
            >
                <DropdownMenuItem
                    onClick={() => onPatch({ locality: "" })}
                    className={cn(!filters.locality && "font-semibold")}
                >
                    All areas
                </DropdownMenuItem>
                {localities.map((locality) => (
                    <DropdownMenuItem
                        key={locality}
                        onClick={() => onPatch({ locality })}
                        className={cn(filters.locality === locality && "font-semibold")}
                    >
                        {formatPlaceName(locality)}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

            <FilterMenu
                label="Broker"
                valueLabel={filters.brokerName || "Broker"}
                isDefault={!filters.brokerName}
            >
                <DropdownMenuItem
                    onClick={() => onPatch({ brokerName: "" })}
                    className={cn(!filters.brokerName && "font-semibold")}
                >
                    All brokers
                </DropdownMenuItem>
                {brokers.map((broker) => (
                    <DropdownMenuItem
                        key={broker}
                        onClick={() => onPatch({ brokerName: broker })}
                        className={cn(filters.brokerName === broker && "font-semibold")}
                    >
                        {broker}
                    </DropdownMenuItem>
                ))}
            </FilterMenu>

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
