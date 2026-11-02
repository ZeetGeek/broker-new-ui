import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

function Bone({ className }: { className?: string }) {
    return <Skeleton className={cn("animate-none", className)} />;
}

function ContactCardSkeleton({ variant }: { variant: "buyer" | "owner" }) {
    return (
        <div
            className={cn(
                "flex flex-col rounded-card border border-border-warm bg-surface p-5 shadow-md",
                variant === "buyer" ? "min-block-96" : "min-block-80",
            )}
        >
            <div className="mbe-3 flex items-center justify-between gap-2">
                <Bone className="rounded-full block-6 inline-40 max-inline-full" />
                <Bone className="shrink-0 rounded-full block-8 inline-8" />
            </div>
            <div className="flex items-center gap-3">
                <Bone className="shrink-0 rounded-full border-2 border-white block-10 inline-10" />
                <div className="flex flex-1 flex-col gap-2 min-inline-0">
                    <Bone className="rounded-sm block-4 inline-28 max-inline-full" />
                    <Bone className="rounded-sm block-3.5 inline-32 max-inline-full" />
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 py-5">
                {variant === "buyer" ? (
                    <div className="space-y-2">
                        <Bone className="rounded-sm block-3 inline-20" />
                        <Bone className="rounded-sm block-4 inline-32 max-inline-full" />
                    </div>
                ) : null}
                <div className="space-y-2">
                    <Bone className="rounded-sm block-3 inline-28" />
                    <Bone className="rounded-sm block-4 inline-full" />
                    <Bone className="rounded-sm block-4 inline-2/3" />
                </div>
            </div>
            <div className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                <div className="flex items-center gap-3 min-block-11">
                    <Bone className="rounded-sm block-3.5 inline-16" />
                    <div className="flex -space-x-2">
                        {[0, 1, 2].map((index) => (
                            <Bone
                                key={index}
                                className="rounded-full ring-2 ring-surface block-7 inline-7"
                            />
                        ))}
                    </div>
                    <Bone className="rounded-sm block-3.5 inline-12" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Bone className="block-11" />
                    <Bone className="block-11" />
                </div>
            </div>
        </div>
    );
}

export function ContactsSkeleton({
    count = 10,
    variant = "buyer",
}: {
    count?: number;
    variant?: "buyer" | "owner";
}) {
    return (
        <div role="status" aria-busy="true" className="motion-safe:animate-pulse">
            <span className="sr-only">
                Loading your {variant === "buyer" ? "clients" : "owners"}
            </span>
            <div
                aria-hidden
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                {Array.from({ length: count }, (_, index) => (
                    <ContactCardSkeleton key={index} variant={variant} />
                ))}
            </div>
        </div>
    );
}

export function ContactsIntroSkeleton() {
    return (
        <div
            role="status"
            aria-busy="true"
            className="flex flex-wrap items-center gap-2 min-block-8 motion-safe:animate-pulse"
        >
            <span className="sr-only">Loading contact summary</span>
            <Bone className="bg-border-warm block-6 inline-28" />
            <Bone className="bg-border-warm block-6 inline-96 max-inline-full" />
        </div>
    );
}

export function ContactsHeaderSkeleton() {
    return (
        <div
            role="status"
            aria-busy="true"
            className="flex items-center justify-between gap-3 motion-safe:animate-pulse sm:gap-4"
        >
            <span className="sr-only">Loading contact filters</span>
            <div className="flex flex-1 gap-2 overflow-hidden min-inline-0">
                {[0, 1].map((index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px]"
                    >
                        <Bone className="rounded-full block-3 inline-3" />
                        <Bone className="block-3 inline-12" />
                        <Bone className="rounded-full block-4 inline-4" />
                    </div>
                ))}
            </div>
            <div className="flex shrink-0 gap-2.5">
                <div className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px] inline-44 sm:inline-52 lg:inline-64">
                    <Bone className="rounded-full block-3 inline-3" />
                    <Bone className="block-3 inline-3/4" />
                </div>
                <div className="flex items-center rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px] inline-24">
                    <Bone className="block-3 inline-full" />
                </div>
                <div className="hidden items-center rounded-control bg-surface px-3 block-[38px] inline-32 md:flex">
                    <Bone className="block-3 inline-full" />
                </div>
            </div>
        </div>
    );
}

export function ContactsPageSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <ContactsIntroSkeleton />
            <ContactsHeaderSkeleton />
            <ContactsSkeleton />
        </div>
    );
}

function FieldSkeleton() {
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <Bone className="block-4 inline-24 max-inline-full" />
            <Bone className="border-2 border-border-warm block-control-xl inline-full" />
        </div>
    );
}

export function ContactFormSkeleton({
    variant = "buyer",
    bothBudgets = false,
}: {
    variant?: "buyer" | "owner";
    bothBudgets?: boolean;
}) {
    return (
        <div role="status" aria-busy="true" className="motion-safe:animate-pulse">
            <span className="sr-only">Loading {variant === "buyer" ? "client" : "owner"} form</span>
            <div
                aria-hidden
                className="flex flex-col divide-y divide-border-warm [&>*+*]:pbs-6 [&>*:not(:last-child)]:pbe-6"
            >
                {(variant === "buyer" ? [2, 1, 4, bothBudgets ? 4 : 2, 3] : [2, 1, 4, 4]).map(
                    (fields, section) => (
                        <div key={section}>
                            <div className="flex items-center justify-between gap-4">
                                <Bone className="block-6 inline-52 max-inline-full" />
                                <Bone className="shrink-0 block-5 inline-5" />
                            </div>
                            <Bone className="mbs-1.5 block-6 inline-80 max-inline-full" />
                            <div className="flex flex-col gap-4 pbs-5">
                                {section === 2 ? (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <FieldSkeleton />
                                            <FieldSkeleton />
                                            <FieldSkeleton />
                                        </div>
                                        <Bone className="block-5 inline-32" />
                                        <FieldSkeleton />
                                    </>
                                ) : (
                                    <div
                                        className={cn("grid gap-4", fields > 1 && "sm:grid-cols-2")}
                                    >
                                        {Array.from({ length: fields }, (_, index) => (
                                            <FieldSkeleton key={index} />
                                        ))}
                                    </div>
                                )}
                                {section === 0 ? (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div />
                                        <Bone className="block-5 inline-44 max-inline-full" />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ),
                )}
            </div>
        </div>
    );
}
