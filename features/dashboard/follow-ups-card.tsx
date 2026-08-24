"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { CardLabel } from "./card-label";
import type { FollowUpItem } from "./mock-data";

export type FollowUpsCardProps = {
    items: FollowUpItem[];
    overdueCount: number;
    className?: string;
};

export function FollowUpsCard({ items, overdueCount, className }: FollowUpsCardProps) {
    const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());

    function toggle(id: string, checked: boolean) {
        setDoneIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }

    return (
        <section
            className={cn(
                "flex flex-col rounded-card bg-brand-ink p-4 text-white md:p-5",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <CardLabel tone="dark">Follow-ups</CardLabel>
                {overdueCount > 0 ? (
                    <Badge variant="urgent" className="border-0">
                        {overdueCount} overdue
                    </Badge>
                ) : null}
            </div>

            <ul className="mbs-2 flex flex-col">
                {items.map((item, index) => {
                    const checked = doneIds.has(item.id);

                    return (
                        <li
                            key={item.id}
                            className={cn(
                                "flex items-start gap-3 py-3",
                                index > 0 && "border-bs border-white/10",
                            )}
                        >
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => toggle(item.id, nextChecked)}
                                aria-label={item.title}
                                className="
                                  mbs-0.5 border-white/35 bg-transparent
                                  hover:border-white/60
                                  data-checked:border-highlight data-checked:bg-highlight
                                  data-checked:text-highlight-ink
                                  data-checked:hover:border-highlight
                                "
                            />
                            <div className="flex-1 min-inline-0">
                                <p
                                    className={cn(
                                        "body font-medium text-white",
                                        checked && "line-through opacity-60",
                                    )}
                                >
                                    {item.title}
                                </p>
                                <p
                                    className={cn(
                                        "body-sm mbs-0.5",
                                        item.isOverdue ? "text-urgent-mid" : "text-brand",
                                    )}
                                >
                                    {item.dueLabel}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
