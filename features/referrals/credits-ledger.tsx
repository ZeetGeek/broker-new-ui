"use client";

import { type ReactNode, useState } from "react";

import { FileText, Gift, type LucideIcon, Sparkles } from "lucide-react";

import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";

import type { CreditEntry, CreditEntryKind } from "@/features/referrals/types";

const ENTRY_ICON: Record<CreditEntryKind, LucideIcon> = {
    referral_qualified: Sparkles,
    bonus: Gift,
    listing_published: FileText,
};

/** How many lines show before the list asks to be expanded. */
const COLLAPSED_COUNT = 4;

type CreditsLedgerProps = {
    ledger: CreditEntry[] | null;
    total?: number;
    footer?: ReactNode;
    className?: string;
};

function CreditRow({ entry, hasBorder }: { entry: CreditEntry; hasBorder: boolean }) {
    const Icon = ENTRY_ICON[entry.kind];
    const isSpend = entry.amount < 0;

    return (
        <div
            className={cn(
                "flex items-center gap-3 py-2.5",
                hasBorder && "border-be border-border-warm",
            )}
        >
            <span
                aria-hidden
                className={cn(
                    `flex shrink-0 items-center justify-center rounded-control block-8 inline-8`,
                    isSpend ? "bg-surface-muted text-ink-muted" : "bg-brand-soft text-brand-text",
                )}
            >
                <Icon className="block-4 inline-4" strokeWidth={1.75} />
            </span>

            <div className="flex flex-1 flex-col min-inline-0">
                <span className="body-sm truncate text-ink">{entry.label}</span>
                <span className="body-xs text-ink-subtle">
                    {formatDateShort(new Date(entry.at))}
                </span>
            </div>

            <span
                className={cn(
                    "body-sm tabular shrink-0 font-semibold",
                    isSpend ? "text-ink" : "text-brand",
                )}
            >
                {isSpend ? "" : "+"}
                {entry.amount}
            </span>
        </div>
    );
}

/**
 * The credit statement.
 *
 * Kept as a plain running list rather than a balance with a tooltip: a broker
 * who cannot see which invite paid what will not believe the number, and this
 * is the only place the programme's arithmetic is visible.
 *
 * What credits are *worth* is deliberately not stated anywhere here.
 * Redemption is an open product question (AGENTS.md), and inventing a rupee
 * value in the UI is the kind of promise that has to be honoured later.
 */
export function CreditsLedger({ ledger, total, footer, className }: CreditsLedgerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!ledger) {
        return (
            <section
                className={cn(
                    `
                      flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4
                      sm:p-5
                    `,
                    className,
                )}
                aria-busy
                aria-label="Loading your credits"
            >
                <span className="animate-pulse rounded-sm bg-surface-muted block-5 inline-32" />
                <span className="animate-pulse rounded-sm bg-surface-muted block-4 inline-full" />
                <span className="animate-pulse rounded-sm bg-surface-muted block-4 inline-52" />
            </section>
        );
    }

    // Empty cards collapse to their content rather than reserving the loaded
    // height. docs/EMPTY_STATES.md rule 3.
    if (ledger.length === 0) {
        return (
            <section
                className={cn(
                    `
                      flex flex-col gap-1.5 rounded-card border border-border-warm bg-surface p-4
                      sm:p-5
                    `,
                    className,
                )}
                aria-labelledby="credits-ledger-heading"
            >
                <h2 id="credits-ledger-heading" className="h6 text-ink">
                    No credits yet
                </h2>
                <p className="body-sm text-ink-muted">
                    Every broker you bring in who starts working a property earns you credits. They
                    will be listed here.
                </p>
            </section>
        );
    }

    const visible = isExpanded ? ledger : ledger.slice(0, COLLAPSED_COUNT);
    const hiddenCount = Math.max(0, (total ?? ledger.length) - visible.length);

    return (
        <section
            className={cn(
                "flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4 sm:p-5",
                className,
            )}
            aria-labelledby="credits-ledger-heading"
        >
            <div className="flex flex-col gap-1">
                <h2 id="credits-ledger-heading" className="h6 text-ink">
                    Credits
                </h2>
                <p className="body-sm text-ink-muted">
                    Everything that moved your balance, newest first.
                </p>
            </div>

            <WindowVirtualGrid
                items={visible}
                getKey={(entry) => entry.id}
                estimateRowHeight={52}
                gap={0}
                overscan={4}
                ariaLabel="Credit activity"
                renderItem={(entry, index) => (
                    <CreditRow entry={entry} hasBorder={index < visible.length - 1} />
                )}
            />

            {isExpanded ? footer : null}

            {hiddenCount > 0 || isExpanded ? (
                <Button
                    variant="ghost"
                    size="sm"
                    className="self-start px-0 text-ink-muted hover:bg-transparent hover:text-ink"
                    onClick={() => setIsExpanded((prev) => !prev)}
                >
                    {isExpanded ? "Show less" : `Show ${hiddenCount} more`}
                </Button>
            ) : null}
        </section>
    );
}
