"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { AppIcon } from "@/components/shared/icons";
import { X } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Skeleton } from "@/components/shared/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CHIP_HOVER_TRANSITION = "transition-[background-color,border-color,color] duration-160";

export function filterChipClassName(isActive: boolean) {
    return cn(
        `
          touch-target inline-flex shrink-0 items-center gap-1.5 rounded-control border px-3.5
          text-sm font-semibold whitespace-nowrap block-[38px]
        `,
        CHIP_HOVER_TRANSITION,
        isActive
            ? `
              border-brand bg-brand-soft text-brand-text shadow-none
              hover:border-brand-text hover:bg-brand-soft/80
            `
            : `
              border-border-warm bg-surface text-ink shadow-sm
              hover:border-ink/25 hover:bg-surface-muted/60
            `,
    );
}

/** @deprecated Prefer `filterChipClassName` — kept for existing call sites. */
export const ownerListingsChipClassName = filterChipClassName;

export type FilterChipCountProps = {
    reserveSpace?: boolean;
    count?: number;
    isActive?: boolean;
    isLoading?: boolean;
    warning?: boolean;
    className?: string;
};

/**
 * Compact count badge for filter / tab chips.
 * Hidden when count is 0 (unless loading).
 */
export function FilterChipCount({
    count,
    isActive = false,
    isLoading = false,
    warning = false,
    className,
    reserveSpace = false,
}: FilterChipCountProps) {
    if (reserveSpace) {
        return (
            <span
                className="inline-flex shrink-0 items-center justify-center block-5 inline-8"
                aria-hidden
            >
                {isLoading ? (
                    <Skeleton className="block-4 inline-7" />
                ) : count != null ? (
                    <span
                        className={cn(
                            `
                              body-xs inline-flex items-center justify-center rounded-full px-1.5
                              font-semibold tabular-nums block-5 min-inline-5
                            `,
                            isActive
                                ? "bg-brand-text/12 text-brand-text"
                                : "bg-ink/6 text-ink-muted",
                            className,
                        )}
                    >
                        {count > 99 ? "99+" : count}
                    </span>
                ) : null}
            </span>
        );
    }
    if (count == null || (!isLoading && count <= 0)) return null;

    // Loading: bare Tailspin only — no rounded count badge behind it.
    if (isLoading) {
        return (
            <LoadingSpinner
                label="Loading count"
                size="sm"
                className={cn(isActive ? "text-brand-text" : "text-ink-muted", className)}
            />
        );
    }

    return (
        <span
            className={cn(
                `
                  body-xs inline-flex items-center justify-center rounded-full px-1.5 font-semibold
                  tracking-normal tabular-nums block-5 min-inline-5
                `,
                isActive ? "bg-brand-text/12 text-brand-text" : "bg-ink/6 text-ink-muted",
                warning && !isActive && "bg-urgent-soft text-pending",
                className,
            )}
            aria-hidden
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}

/** @deprecated Prefer `FilterChipCount`. */
export function ownerListingsChipCountClassName(isActive: boolean) {
    return cn(
        `
          body-xs inline-flex items-center justify-center rounded-full px-1.5 font-semibold
          tabular-nums block-5 min-inline-5
        `,
        isActive ? "bg-brand-text/12 text-brand-text" : "bg-ink/6 text-ink-muted",
    );
}

/** @deprecated Prefer `FilterChipCount` — parentheses counts are retired. */
export function formatChipCount(count: number, isLoading?: boolean) {
    if (isLoading) return "";
    if (count <= 0) return "";
    return count > 99 ? "99+" : String(count);
}

export type FilterChipProps = {
    reserveCountSpace?: boolean;
    label: ReactNode;
    mobileLabel?: ReactNode;
    count?: number;
    isLoading?: boolean;
    isActive?: boolean;
    onClick: () => void;
    /** Shown while active. Defaults to `onClick` (toggle-off). */
    onClear?: () => void;
    /** When true and active, show an X to clear the filter. */
    clearable?: boolean;
    icon?: AppIcon;
    description?: string;
    warning?: boolean;
    className?: string;
    "aria-label"?: string;
};

export function FilterChip({
    label,
    mobileLabel,
    count,
    isLoading = false,
    reserveCountSpace = false,
    isActive = false,
    onClick,
    onClear,
    clearable = false,
    icon: Icon,
    description,
    warning = false,
    className,
    "aria-label": ariaLabel,
}: FilterChipProps) {
    const showClear = clearable && isActive;
    const handleClear = onClear ?? onClick;

    const button = (
        <button
            type="button"
            className={cn(
                filterChipClassName(isActive),
                warning &&
                    !isActive &&
                    "border-pending/20 bg-urgent-soft/70 text-pending shadow-none",
                className,
            )}
            onClick={onClick}
            aria-pressed={isActive}
            aria-label={ariaLabel}
        >
            {Icon ? (
                <Icon
                    aria-hidden
                    className={cn(
                        "block-4 inline-4",
                        isActive ? "text-brand-text" : warning ? "text-pending" : "text-brand",
                    )}
                    strokeWidth={1.75}
                />
            ) : null}
            {mobileLabel != null ? (
                <>
                    <span className="md:hidden">{mobileLabel}</span>
                    <span className="hidden md:inline">{label}</span>
                </>
            ) : (
                <span>{label}</span>
            )}
            {count != null || reserveCountSpace ? (
                <FilterChipCount
                    count={count}
                    isActive={isActive}
                    isLoading={isLoading}
                    reserveSpace={reserveCountSpace}
                    warning={warning}
                />
            ) : null}
            {showClear ? (
                <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Clear filter"
                    className={cn(
                        `
                          -me-1 inline-flex items-center justify-center rounded-full
                          text-brand-text/70 block-5 inline-5
                          hover:bg-brand-text/10 hover:text-brand-text
                        `,
                        CHIP_HOVER_TRANSITION,
                    )}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleClear();
                    }}
                >
                    <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                </span>
            ) : null}
        </button>
    );

    if (!description) return button;

    return (
        <Tooltip>
            <TooltipTrigger render={button} />
            <TooltipContent side="bottom">{description}</TooltipContent>
        </Tooltip>
    );
}
