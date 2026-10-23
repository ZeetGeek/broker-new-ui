import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

const PLACEHOLDER_MESSAGES = [
    { own: false, width: "inline-[66%]", lines: 2 },
    { own: true, width: "inline-[48%]", lines: 1 },
    { own: false, width: "inline-[58%]", lines: 2 },
    { own: true, width: "inline-[62%]", lines: 2 },
    { own: false, width: "inline-[42%]", lines: 1 },
];

export function ChatSkeleton() {
    return (
        <div role="status" className="px-4 py-5 sm:px-5">
            <span className="sr-only">Loading conversation…</span>
            <div aria-hidden="true" className="flex flex-col gap-6">
                <Skeleton className="mx-auto mbe-2 block-2 inline-12" />
                {PLACEHOLDER_MESSAGES.map(({ own, width, lines }, index) => (
                    <div
                        key={index}
                        className={cn("flex items-end gap-2", own && "flex-row-reverse")}
                    >
                        {!own ? (
                            <Skeleton className="mbe-4 shrink-0 rounded-full block-8 inline-8" />
                        ) : null}
                        <div className={cn("flex flex-col gap-2 min-inline-0", width)}>
                            <div
                                className={cn(
                                    "space-y-2.5 rounded-inner px-4 py-3.5",
                                    own
                                        ? "rounded-ee-sm bg-brand-soft/60"
                                        : `
                                  rounded-es-sm bg-surface-muted/60
                                `,
                                )}
                            >
                                <Skeleton
                                    className={cn(
                                        "block-2 inline-full",
                                        own
                                            ? "bg-brand/15"
                                            : `
                                  bg-border-warm
                                `,
                                    )}
                                />
                                {lines > 1 ? (
                                    <Skeleton
                                        className={cn(
                                            "block-2 inline-2/3",
                                            own
                                                ? `
                                  bg-brand/15
                                `
                                                : `bg-border-warm`,
                                        )}
                                    />
                                ) : null}
                            </div>
                            <Skeleton className={cn("block-1.5 inline-9", own && "self-end")} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
