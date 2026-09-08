import type { LucideIcon } from "lucide-react";
import { Ban, Bell, CircleCheck, CircleX, Eye, Lock, Send } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import type { RequestTimelineStep } from "@/features/properties/my-requests/types";

const STEP_ICONS: Record<RequestTimelineStep["key"], LucideIcon> = {
    sent: Send,
    seen: Eye,
    nudged: Bell,
    approved: CircleCheck,
    declined: CircleX,
    locked: Lock,
    cancelled: Ban,
};

const STEP_TONES: Record<RequestTimelineStep["key"], string> = {
    sent: "text-ink-muted",
    seen: "text-ink-muted",
    nudged: "text-brand",
    approved: "text-success",
    declined: "text-danger",
    locked: "text-ink-muted",
    cancelled: "text-ink-muted",
};

/** Newest last, so the row reads top-to-bottom as the story of the request. */
export function RequestTimeline({ steps }: { steps: RequestTimelineStep[] }) {
    const now = new Date();

    return (
        <ol className="flex flex-col gap-3 border-bs border-border-warm pbs-4">
            {steps.map((step, index) => {
                const Icon = STEP_ICONS[step.key];
                const isLast = index === steps.length - 1;

                return (
                    <li key={`${step.key}-${step.at}`} className="flex items-start gap-3">
                        <span className="relative flex flex-col items-center">
                            <Icon
                                aria-hidden
                                className={cn("shrink-0 block-4 inline-4", STEP_TONES[step.key])}
                                strokeWidth={1.75}
                            />
                            {!isLast ? (
                                <span
                                    aria-hidden
                                    className="
                                      mbs-1 flex-1 rounded-full bg-border-warm inline-px min-block-3
                                    "
                                />
                            ) : null}
                        </span>

                        <div
                            className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3"
                        >
                            <span className="body-sm text-ink">{step.label}</span>
                            <time dateTime={step.at} className="body-xs text-ink-muted">
                                {formatRelativePast(new Date(step.at), now)}
                            </time>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
