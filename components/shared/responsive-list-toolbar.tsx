"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { filterChipClassName, FilterChipCount } from "@/components/shared/filter-chip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import styles from "./responsive-list-toolbar.module.css";

export type ListStatusOption = {
    value: string;
    label: string;
    dotClassName: string;
    count?: number | null;
};

/** The same compact status control used across CRM lists. */
export function ListStatusSelect({
    options,
    value,
    onChange,
    label = "Status",
    isLoading = false,
    hideLabel = false,
}: {
    options: ListStatusOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    isLoading?: boolean;
    hideLabel?: boolean;
}) {
    const selected = options.find((option) => option.value === value);
    return (
        <Select
            value={value}
            items={options}
            onValueChange={(next) => {
                if (next !== null && options.some((option) => option.value === next))
                    onChange(next);
            }}
        >
            <SelectTrigger
                size="sm"
                aria-label={
                    label +
                    ": " +
                    (selected?.label ?? value) +
                    (selected?.count ? ", " + selected.count : "")
                }
                className={cn(
                    filterChipClassName(true),
                    "border! text-sm! block-[38px]! pointer-coarse:min-block-11",
                    styles.trigger,
                )}
            >
                {!hideLabel ? <span className={styles.label}>{label}:</span> : null}
                <span
                    aria-hidden
                    className={cn(
                        "shrink-0 rounded-full block-1.5 inline-1.5",
                        selected?.dotClassName,
                    )}
                />
                <SelectValue className="truncate">{selected?.label}</SelectValue>
                <FilterChipCount
                    count={selected?.count ?? undefined}
                    isActive
                    isLoading={isLoading && selected?.count == null}
                />
            </SelectTrigger>
            <SelectContent align="start" className="min-inline-52">
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        aria-label={option.label + (option.count ? ", " + option.count : "")}
                        showIndicator={false}
                        className="pe-2.5 data-selected:bg-brand-soft data-selected:font-semibold data-selected:text-brand-text data-selected:data-highlighted:bg-brand-soft data-selected:data-highlighted:text-brand-text"
                    >
                        <span
                            aria-hidden
                            className={cn(
                                "shrink-0 rounded-full block-1.5 inline-1.5",
                                option.dotClassName,
                            )}
                        />
                        <span>{option.label}</span>
                        <FilterChipCount
                            count={option.count ?? undefined}
                            isLoading={isLoading && option.count == null}
                            isActive={value === option.value}
                            className="ms-auto"
                        />
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function ResponsiveListStatus({
    children,
    ...props
}: Parameters<typeof ListStatusSelect>[0] & { children: ReactNode }) {
    return (
        <>
            <div className={styles.tabs}>{children}</div>
            <div className={styles.select}>
                <ListStatusSelect {...props} />
            </div>
        </>
    );
}

/** Search expands instead of leaving a second row of right-aligned controls. */
export function ResponsiveListToolbar({
    selection,
    search,
    actions,
    children,
    inlineMobileActions = false,
}: {
    selection: ReactNode;
    search: ReactNode;
    actions: ReactNode;
    children?: ReactNode;
    /** Keep search and compact actions together on phones, below the selection row. */
    inlineMobileActions?: boolean;
}) {
    return (
        <div className={styles.container}>
            <div className={cn(styles.toolbar, inlineMobileActions && styles.inlineMobileActions)}>
                <div className={styles.selection}>{selection}</div>
                <div className={styles.search}>{search}</div>
                <div className={styles.actions}>{actions}</div>
            </div>
            {children}
        </div>
    );
}
