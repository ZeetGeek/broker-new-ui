"use client";

import type { ListingScoreTask } from "@/lib/hooks/use-listing-score";
import { cn } from "@/lib/utils";

import { ArrowRight, Check, LockKeyhole } from "@/components/shared/icons";

import type { PropertyFormStep } from "@/constants/property";

export function ListingScoreCard({
    score,
    tasks,
    onTip,
    className,
}: {
    score: number;
    tasks: ListingScoreTask[];
    onTip: (step: PropertyFormStep) => void;
    className?: string;
}) {
    const safeScore = Math.max(0, Math.min(100, score));
    const allComplete = tasks.every((task) => task.completed);
    return (
        <article
            className={cn(
                "rounded-card border border-border-warm bg-surface p-4 min-inline-0",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-ink">Listing score</h2>
                <span className="tabular text-xl font-bold text-brand-text">{safeScore}%</span>
            </div>
            <div
                role="progressbar"
                aria-label="Listing score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={safeScore}
                className="mbs-3 overflow-hidden rounded-full bg-surface-muted block-2"
            >
                <div
                    className="rounded-full bg-brand block-full"
                    style={{ width: `${safeScore}%` }}
                />
            </div>
            <p className="mbs-2 text-xs/5 font-medium text-ink-muted">
                {allComplete
                    ? "All score improvements complete."
                    : "Complete each task to unlock the next."}
            </p>
            <ol className="mbs-3 flex flex-col">
                {tasks.map((task) => (
                    <li key={task.label}>
                        <button
                            type="button"
                            disabled={task.locked || task.completed}
                            aria-current={!task.completed && !task.locked ? "step" : undefined}
                            onClick={() => {
                                if (!task.locked && !task.completed) onTip(task.step);
                            }}
                            className={cn(
                                "flex items-center gap-3 rounded-control bg-transparent py-3 text-start inline-full min-block-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                                task.completed
                                    ? "text-brand-text"
                                    : task.locked
                                      ? "cursor-not-allowed text-ink-muted"
                                      : "cursor-pointer text-ink hover:text-brand-text",
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "flex shrink-0 items-center justify-center rounded-full block-5 inline-5",
                                    task.completed
                                        ? "bg-brand-soft text-brand-text"
                                        : task.locked
                                          ? "text-ink-subtle"
                                          : "border border-brand/40",
                                )}
                            >
                                {task.completed ? (
                                    <Check className="block-3.5 inline-3.5" strokeWidth={2.5} />
                                ) : task.locked ? (
                                    <LockKeyhole className="block-3.5 inline-3.5" />
                                ) : null}
                            </span>
                            <span className="flex-1 text-xs/5 font-semibold min-inline-0">
                                {task.label}
                            </span>
                            <span
                                className={cn(
                                    "tabular shrink-0 text-xs font-semibold",
                                    !task.locked && "text-brand-text",
                                )}
                            >
                                {task.completed ? "Complete" : `+${task.points}`}
                            </span>
                            {task.locked ? (
                                <span className="sr-only">
                                    Locked. Complete the previous task first.
                                </span>
                            ) : !task.completed ? (
                                <ArrowRight className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                            ) : null}
                        </button>
                    </li>
                ))}
            </ol>
        </article>
    );
}
