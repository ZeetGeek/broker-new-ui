"use client";

import { cn } from "@/lib/utils";

import { ArrowRight, Check } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import type { PropertyFormStep } from "@/constants/property";

export function ListingScoreCard({
    score,
    tips,
    onTip,
    className,
}: {
    score: number;
    tips: { label: string; step: PropertyFormStep; points: number }[];
    onTip: (step: PropertyFormStep) => void;
    className?: string;
}) {
    const safeScore = Math.max(0, Math.min(100, score));
    return (
        <article className={cn("rounded-card bg-surface p-4 shadow-sm", className)}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink">Listing score</h2>
                <span className="tabular text-xl font-semibold text-brand-text">{safeScore}%</span>
            </div>
            <div
                role="progressbar"
                aria-label="Listing score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={safeScore}
                className="mbs-3 overflow-hidden rounded-full bg-surface-muted block-1.5"
            >
                <div
                    className="rounded-full bg-brand block-full"
                    style={{ width: `${safeScore}%` }}
                />
            </div>
            <p className="mbs-2 text-xs/5 text-ink-muted">
                {tips.length
                    ? "Add these details to improve your listing."
                    : "All score improvements complete."}
            </p>
            {tips.length ? (
                <div className="mbs-3 flex flex-col divide-y divide-border-warm">
                    {tips.map((tip) => (
                        <Button
                            key={tip.label}
                            type="button"
                            variant="ghost"
                            onClick={() => onTip(tip.step)}
                            className="
                              justify-between gap-2 rounded-none px-0 py-3 text-start
                              whitespace-normal block-auto min-block-11
                              hover:bg-surface-muted/35
                            "
                        >
                            <span className="flex-1 text-xs/5 font-medium text-ink min-inline-0">
                                {tip.label}
                            </span>
                            <span className="tabular shrink-0 text-xs font-semibold text-brand-text">
                                +{tip.points}
                            </span>
                            <ArrowRight
                                className="text-ink-muted block-3.5 inline-3.5"
                                aria-hidden
                            />
                        </Button>
                    ))}
                </div>
            ) : (
                <p className="mbs-3 flex items-center gap-1.5 text-xs font-medium text-brand-text">
                    <Check className="block-4 inline-4" aria-hidden /> Score complete
                </p>
            )}
        </article>
    );
}
