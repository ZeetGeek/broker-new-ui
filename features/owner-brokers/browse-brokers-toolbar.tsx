"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownUp, BadgeCheck, Briefcase, ChevronDown, Tags } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
    BrowseBrokersExperience,
    BrowseBrokersFilters,
    BrowseBrokersSort,
} from "@/features/owner-brokers/browse-brokers-filters";
import { hasActiveBrowseFilters } from "@/features/owner-brokers/browse-brokers-filters";
import type { OwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import { OwnerListingsViewToggle } from "@/features/properties/owner-listings/owner-listings-view-toggle";

const EXPERIENCE_OPTIONS: { value: BrowseBrokersExperience; label: string }[] = [
    { value: 0, label: "Any experience" },
    { value: 2, label: "2+ years" },
    { value: 5, label: "5+ years" },
    { value: 10, label: "10+ years" },
];

const SORT_OPTIONS: { value: BrowseBrokersSort; label: string }[] = [
    { value: "relevance", label: "Verified first" },
    { value: "experience", label: "Most experience" },
    { value: "deals", label: "Most deals closed" },
    { value: "name", label: "Name A–Z" },
];

function ChipMenu<T extends string | number>({
    icon: Icon,
    label,
    activeLabel,
    value,
    defaultValue,
    options,
    onChange,
    align = "start",
}: {
    icon: LucideIcon;
    label: string;
    /** Shown on the chip when a non-default option is picked. */
    activeLabel?: string;
    value: T;
    defaultValue: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    align?: "start" | "end";
}) {
    const isActive = value !== defaultValue;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            ownerListingsChipClassName(isActive),
                            "gap-2",
                            !isActive && "text-ink-muted",
                        )}
                    >
                        <Icon
                            aria-hidden
                            className="text-brand block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="truncate max-inline-40">
                            {isActive && activeLabel ? activeLabel : label}
                        </span>
                        <ChevronDown
                            aria-hidden
                            className="opacity-60 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </button>
                }
            />
            <DropdownMenuContent align={align} className="min-inline-48">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={String(option.value)}
                        onClick={() => onChange(option.value)}
                        className={cn(value === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function BrowseBrokersToolbar({
    filters,
    onFiltersChange,
    onClear,
    specialties,
    resultCount,
    totalCount,
    isLoading,
    view,
    onViewChange,
}: {
    filters: BrowseBrokersFilters;
    onFiltersChange: (patch: Partial<BrowseBrokersFilters>) => void;
    onClear: () => void;
    specialties: { key: string; label: string }[];
    resultCount: number;
    totalCount: number;
    isLoading: boolean;
    view: OwnerRequestsView;
    onViewChange: (view: OwnerRequestsView) => void;
}) {
    const experienceLabel = EXPERIENCE_OPTIONS.find(
        (o) => o.value === filters.minExperience,
    )?.label;
    const specialtyLabel = specialties.find((s) => s.key === filters.specialty)?.label;
    const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "Sort";
    const filtered = hasActiveBrowseFilters(filters);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    aria-pressed={filters.verifiedOnly}
                    onClick={() => onFiltersChange({ verifiedOnly: !filters.verifiedOnly })}
                    className={cn(
                        ownerListingsChipClassName(filters.verifiedOnly),
                        "gap-2",
                        !filters.verifiedOnly && "text-ink-muted",
                    )}
                >
                    <BadgeCheck
                        aria-hidden
                        className="text-brand block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    Verified only
                </button>

                <ChipMenu
                    icon={Briefcase}
                    label="Experience"
                    activeLabel={experienceLabel}
                    value={filters.minExperience}
                    defaultValue={0}
                    options={EXPERIENCE_OPTIONS}
                    onChange={(minExperience) => onFiltersChange({ minExperience })}
                />

                {specialties.length > 0 ? (
                    <ChipMenu
                        icon={Tags}
                        label="Specialty"
                        activeLabel={specialtyLabel}
                        value={filters.specialty}
                        defaultValue=""
                        options={[
                            { value: "", label: "Any specialty" },
                            ...specialties.map((s) => ({ value: s.key, label: s.label })),
                        ]}
                        onChange={(specialty) => onFiltersChange({ specialty })}
                    />
                ) : null}

                {filtered ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="
                          body-sm px-2 font-semibold text-brand underline-offset-4
                          hover:underline
                        "
                    >
                        Clear all
                    </button>
                ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="h6 text-ink tabular-nums" aria-live="polite">
                    {isLoading && totalCount === 0 ? (
                        <span className="text-ink-muted">Finding brokers…</span>
                    ) : (
                        <>
                            {resultCount === 0
                                ? "No matches"
                                : `${resultCount} ${resultCount === 1 ? "broker" : "brokers"}`}
                            {filtered && resultCount !== totalCount ? (
                                <span className="text-ink-muted"> of {totalCount}</span>
                            ) : null}
                        </>
                    )}
                </p>

                <div className="flex shrink-0 items-center gap-2.5">
                    <ChipMenu
                        icon={ArrowDownUp}
                        label={sortLabel}
                        activeLabel={sortLabel}
                        value={filters.sort}
                        defaultValue="relevance"
                        options={SORT_OPTIONS}
                        onChange={(sort) => onFiltersChange({ sort })}
                        align="end"
                    />
                    <OwnerListingsViewToggle
                        view={view}
                        onViewChange={onViewChange}
                        className="hidden sm:flex"
                    />
                </div>
            </div>
        </div>
    );
}
