"use client";

import { useEffect, useId, useState } from "react";

import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion/tokens";
import { getVisiblePages } from "@/lib/pagination/get-visible-pages";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

/** Matches owner-listings sort / filter chip surface (Newest first). */
const controlChipClass = cn(
    `
      rounded-full border border-border-warm bg-surface font-semibold text-ink shadow-sm
      outline-none transition-[background-color,border-color,color] duration-160
      hover:border-ink/25 hover:bg-surface-muted/60
      focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30
    `,
);

/** Outer shell — same as owner-listings view toggle. */
const arrowGroupClass = cn(
    `
      inline-flex shrink-0 items-center gap-1 rounded-full border border-border-warm
      bg-surface p-1 shadow-sm
    `,
);

/** Page-number cluster — same height as arrow groups, a bit more inner padding. */
const pageGroupClass = cn(
    `
      inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border-warm
      bg-surface px-1.5 py-1 shadow-sm
    `,
);

const arrowButtonClass = cn(
    `
      inline-flex shrink-0 items-center justify-center rounded-full border border-transparent
      text-ink-muted outline-none transition-[color] duration-160
      block-8 inline-8
      focus-visible:ring-2 focus-visible:ring-brand
      disabled:pointer-events-none disabled:opacity-35
      data-[checked=true]:text-brand-text
    `,
);

const pageButtonClass = cn(
    `
      inline-flex items-center justify-center rounded-full outline-none
      transition-[color] duration-160 body-sm block-8 min-inline-8 px-2.5 font-semibold
      tabular-nums
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

    useEffect(() => {
        setPageDraft(String(current));
    }, [current]);

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
                  grid w-full grid-cols-1 items-center gap-4 bg-transparent p-0
                  lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6
                `,
                className,
            )}
        >
            {/* Left — showing page N of M */}
            <div className="flex flex-wrap items-center justify-center gap-2 body-sm text-ink-muted lg:justify-start">
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
                        `
                          body-sm px-3 text-center tabular-nums
                          block-10 inline-14
                        `,
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
                                      pointer-events-none inline-flex items-center justify-center
                                      body-sm text-ink-subtle block-8 min-inline-6
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
                <div className="flex flex-wrap items-center justify-center gap-2 body-sm text-ink-muted lg:justify-end">
                    <label htmlFor={`${pageInputId}-rows`} className="whitespace-nowrap">
                        Rows per page
                    </label>
                    <div className="relative">
                        <select
                            id={`${pageInputId}-rows`}
                            value={pageSize}
                            onChange={(event) =>
                                onPageSizeChange(Number(event.target.value))
                            }
                            className={cn(
                                controlChipClass,
                                `
                                  body-sm appearance-none pe-9 ps-3.5 tabular-nums
                                  block-10 min-inline-18
                                `,
                            )}
                        >
                            {pageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            aria-hidden
                            className="
                              pointer-events-none absolute top-1/2 inset-e-2.5 block-3.5
                              inline-3.5 -translate-y-1/2 text-ink-subtle
                            "
                            strokeWidth={1.75}
                        />
                    </div>
                </div>
            ) : (
                <div className="hidden lg:block" aria-hidden />
            )}
        </nav>
    );
}
