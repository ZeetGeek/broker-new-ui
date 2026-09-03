"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { getVisiblePages } from "@/lib/pagination/get-visible-pages";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
} from "@/components/ui/pagination";

export type AppPaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    /** Accessible name for the nav. Defaults to "Pagination". */
    "aria-label"?: string;
};

/**
 * Themed pager for property lists and other long result sets.
 * Wraps shadcn pagination primitives — use this instead of editing `components/ui`.
 */
export function AppPagination({
    page,
    totalPages,
    onPageChange,
    className,
    "aria-label": ariaLabel = "Pagination",
}: AppPaginationProps) {
    if (totalPages <= 1) return null;

    const current = Math.min(Math.max(1, page), totalPages);
    const tokens = getVisiblePages(current, totalPages);
    const canPrev = current > 1;
    const canNext = current < totalPages;

    return (
        <Pagination aria-label={ariaLabel} className={className}>
            <PaginationContent
                className="
                  gap-1 rounded-full border border-border-warm bg-surface p-1.5
                  shadow-sm
                "
            >
                <PaginationItem>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={!canPrev}
                        aria-label="Go to previous page"
                        className="rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
                        onClick={() => onPageChange(current - 1)}
                    >
                        <ChevronLeft strokeWidth={1.75} className="rtl:rotate-180" />
                    </Button>
                </PaginationItem>

                {tokens.map((token, index) =>
                    token === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={token}>
                            <Button
                                type="button"
                                variant={token === current ? "accent" : "ghost"}
                                size="icon"
                                aria-label={`Go to page ${token}`}
                                aria-current={token === current ? "page" : undefined}
                                className={cn(
                                    "rounded-full font-semibold tabular-nums",
                                    token === current
                                        ? "pointer-events-none shadow-sm"
                                        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                                )}
                                onClick={() => onPageChange(token)}
                            >
                                {token}
                            </Button>
                        </PaginationItem>
                    ),
                )}

                <PaginationItem>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={!canNext}
                        aria-label="Go to next page"
                        className="rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
                        onClick={() => onPageChange(current + 1)}
                    >
                        <ChevronRight strokeWidth={1.75} className="rtl:rotate-180" />
                    </Button>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
