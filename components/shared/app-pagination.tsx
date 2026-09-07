"use client";

import { useId, useState } from "react";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion/tokens";
import { getVisiblePages } from "@/lib/pagination/get-visible-pages";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

/** Matches owner-listings sort / filter chip surface (Newest first). */
const controlChipClass = cn(
    `
      rounded-full border border-border-warm bg-surface font-semibold text-ink shadow-sm
      transition-[background-color,border-color,color] duration-160 outline-none
      hover:border-ink/25 hover:bg-surface-muted/60
      focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30
    `,
);

/** Outer shell — same as owner-listings view toggle. */
const arrowGroupClass = cn(
    `
      inline-flex shrink-0 items-center gap-1 rounded-full border border-border-warm bg-surface p-1
      shadow-sm
    `,
);

/** Page-number cluster — same height as arrow groups, a bit more inner padding. */
const pageGroupClass = cn(
    `
      inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border-warm bg-surface
      px-1.5 py-1 shadow-sm
    `,
);

const arrowButtonClass = cn(
    `
      inline-flex shrink-0 items-center justify-center rounded-full border border-transparent
      text-ink-muted transition-[color] duration-160 outline-none block-8 inline-8
      focus-visible:ring-2 focus-visible:ring-brand
      disabled:pointer-events-none disabled:opacity-35
      data-[checked=true]:text-brand-text
    `,
);

const pageButtonClass = cn(
    `
      body-sm inline-flex items-center justify-center rounded-full px-2.5 font-semibold tabular-nums
      transition-[color] duration-160 outline-none block-8 min-inline-8
      focus-visible:ring-2 focus-visible:ring-brand
    `,
);

export type AppPaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    /** Accessible name for the nav. Defaults to "Pagination". */
    "aria-label"?: string;
    /** Rows-per-page value. Omit to hide the control. */
    pageSize?: number;
    pageSizeOptions?: readonly number[];
    onPageSizeChange?: (pageSize: number) => void;
};

/**
 * Full-width property-list pager — no shell chrome; sits on the page canvas.
 */
export function AppPagination({
    page,
    totalPages,
    onPageChange,
    className,
    "aria-label": ariaLabel = "Pagination",
    pageSize,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    onPageSizeChange,
}: AppPaginationProps) {
    const pageInputId = useId();
    const reduceMotion = useReducedMotion();
    const safeTotal = Math.max(0, totalPages);
    const current = safeTotal === 0 ? 1 : Math.min(Math.max(1, page), safeTotal);
    const [pageDraft, setPageDraft] = useState(String(current));
    const [syncedPage, setSyncedPage] = useState(current);

    // Keep the draft input aligned when the controlled page changes (React render-time sync).
    if (current !== syncedPage) {
        setSyncedPage(current);
        setPageDraft(String(current));
    }

    if (safeTotal <= 0) return null;

    const tokens = getVisiblePages(current, safeTotal);
    const canPrev = current > 1;
    const canNext = current < safeTotal;
    const showPageSize = pageSize != null && typeof onPageSizeChange === "function";

    const commitPageDraft = () => {
        const parsed = Number(pageDraft);
        if (!Number.isFinite(parsed)) {
            setPageDraft(String(current));
            return;
        }
        const next = Math.min(Math.max(1, Math.round(parsed)), safeTotal);
        setPageDraft(String(next));
        if (next !== current) {
            onPageChange(next);
        }
    };

    return (
        <nav
            aria-label={ariaLabel}
            className={cn(
                `
                  grid grid-cols-1 items-center gap-4 bg-transparent p-0 inline-full
                  lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6
                `,
                className,
            )}
        >
            {/* Left — showing page N of M */}
            <div
                className="
                  body-sm flex flex-wrap items-center justify-center gap-2 text-ink-muted
                  lg:justify-start
                "
            >
                <label htmlFor={pageInputId} className="whitespace-nowrap">
                    Showing page
                </label>
                <input
                    id={pageInputId}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageDraft}
                    onChange={(event) => setPageDraft(event.target.value.replace(/\D/g, ""))}
                    onBlur={commitPageDraft}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.currentTarget.blur();
                        }
                    }}
                    aria-label="Current page"
                    className={cn(
                        controlChipClass,
                        `body-sm px-3 text-center tabular-nums block-10 inline-14`,
                    )}
                />
                <span className="whitespace-nowrap tabular-nums">of {safeTotal}</span>
            </div>

            {/* Center — nav cluster */}
            <div className="mx-auto flex flex-wrap items-center justify-center gap-2 p-0">
                <div className={arrowGroupClass}>
                    <AnimatedBackground
                        enableHover
                        className="rounded-full border border-brand bg-brand-soft shadow-none"
                        transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    >
                        <button
                            type="button"
                            data-id="first"
                            className={arrowButtonClass}
                            disabled={!canPrev}
                            aria-label="Go to first page"
                            onClick={() => onPageChange(1)}
                        >
                            <ChevronsLeft className="block-4 inline-4" strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            data-id="prev"
                            className={arrowButtonClass}
                            disabled={!canPrev}
                            aria-label="Go to previous page"
                            onClick={() => onPageChange(current - 1)}
                        >
                            <ChevronLeft className="block-4 inline-4" strokeWidth={1.75} />
                        </button>
                    </AnimatedBackground>
                </div>

                <div className={pageGroupClass}>
                    <AnimatedBackground
                        defaultValue={String(current)}
                        onValueChange={(id) => {
                            if (!id || id.startsWith("ellipsis-")) return;
                            const next = Number(id);
                            if (Number.isFinite(next)) onPageChange(next);
                        }}
                        className="rounded-full bg-brand shadow-sm"
                        transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    >
                        {tokens.map((token, index) =>
                            token === "ellipsis" ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    data-id={`ellipsis-${index}`}
                                    aria-hidden
                                    className="
                                      body-sm pointer-events-none inline-flex items-center
                                      justify-center text-ink-subtle block-8 min-inline-6
                                    "
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={token}
                                    data-id={String(token)}
                                    type="button"
                                    aria-label={`Go to page ${token}`}
                                    aria-current={token === current ? "page" : undefined}
                                    className={cn(
                                        pageButtonClass,
                                        token === current
                                            ? "text-surface"
                                            : "text-ink-muted hover:text-ink",
                                    )}
                                >
                                    {token}
                                </button>
                            ),
                        )}
                    </AnimatedBackground>
                </div>

                <div className={arrowGroupClass}>
                    <AnimatedBackground
                        enableHover
                        className="rounded-full border border-brand bg-brand-soft shadow-none"
                        transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    >
                        <button
                            type="button"
                            data-id="next"
                            className={arrowButtonClass}
                            disabled={!canNext}
                            aria-label="Go to next page"
                            onClick={() => onPageChange(current + 1)}
                        >
                            <ChevronRight className="block-4 inline-4" strokeWidth={1.75} />
                        </button>
                        <button
                            type="button"
                            data-id="last"
                            className={arrowButtonClass}
                            disabled={!canNext}
                            aria-label="Go to last page"
                            onClick={() => onPageChange(safeTotal)}
                        >
                            <ChevronsRight className="block-4 inline-4" strokeWidth={1.75} />
                        </button>
                    </AnimatedBackground>
                </div>
            </div>

            {/* Right — rows per page */}
            {showPageSize ? (
                <div
                    className="
                      body-sm flex flex-wrap items-center justify-center gap-2 text-ink-muted
                      lg:justify-end
                    "
                >
                    <label htmlFor={`${pageInputId}-rows`} className="whitespace-nowrap">
                        Rows per page
                    </label>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(next) => {
                            if (next == null) return;
                            onPageSizeChange(Number(next));
                        }}
                    >
                        <SelectTrigger
                            id={`${pageInputId}-rows`}
                            size="sm"
                            aria-label="Rows per page"
                            className={cn(
                                controlChipClass,
                                `
                                  gap-2 border-border-warm bg-surface px-3.5 font-semibold text-ink
                                  tabular-nums shadow-sm block-9.5 min-inline-18
                                  data-[size=sm]:block-9.5
                                `,
                            )}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            align="end"
                            alignItemWithTrigger={false}
                            className="min-inline-24"
                        >
                            {pageSizeOptions.map((option) => (
                                <SelectItem key={option} value={String(option)}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="hidden lg:block" aria-hidden />
            )}
        </nav>
    );
}
