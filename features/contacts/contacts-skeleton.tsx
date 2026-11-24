import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { ListPageHeading } from "@/components/shared/list-page-heading";
import { ResponsiveListToolbar } from "@/components/shared/responsive-list-toolbar";
import { Skeleton } from "@/components/shared/skeleton";

function Bone({ className }: { className?: string }) {
    return <Skeleton className={cn("animate-none", className)} />;
}

function ContactCardSkeleton({ variant }: { variant: "buyer" | "owner" }) {
    return (
        <div
            className={cn(
                "flex flex-col rounded-card border border-border-warm bg-surface p-4 shadow-md sm:p-5",
                variant === "buyer" ? "min-block-96" : "min-block-80",
            )}
        >
            <div className="mbe-3 flex items-center justify-between gap-2">
                <Bone className="rounded-full block-6 inline-40 max-inline-full" />
                <Bone className="shrink-0 rounded-full block-8 inline-8" />
            </div>
            <div className="flex items-center gap-3">
                <Bone className="shrink-0 rounded-full border-2 border-white block-12 inline-12" />
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
                <div className="flex items-center justify-center gap-3 rounded-control border border-dashed border-brand/40 px-3 min-block-11">
                    <Bone className="rounded-sm block-3.5 inline-16" />
                    <div className="flex -space-x-2">
                        {[0, 1, 2].map((index) => (
                            <Bone
                                key={index}
                                className="rounded-full ring-2 ring-surface block-6 inline-6"
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
                className="grid grid-cols-1 gap-card-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
        <div role="status" aria-busy="true">
            <ListPageHeading
                title={
                    <>
                        <span className="sr-only">Loading client summary</span>
                        <Bone className="bg-border-warm block-6 inline-28" />
                    </>
                }
            >
                <Bone className="bg-border-warm block-5 inline-80 max-inline-full" />
            </ListPageHeading>
        </div>
    );
}

export function ContactsHeaderSkeleton() {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">Loading client filters</span>
            <div aria-hidden>
                <ResponsiveListToolbar
                    selection={
                        <Bone className="flex-1 block-11 min-inline-0 sm:flex-none sm:inline-48" />
                    }
                    search={<Bone className="block-11 inline-full" />}
                    actions={
                        <>
                            <Bone className="block-11 inline-11 sm:inline-36" />
                            <Bone className="hidden block-11 inline-32 md:block" />
                        </>
                    }
                />
            </div>
        </div>
    );
}

export function ContactsPageSkeleton() {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PortalSectionNav>
                <ContactsIntroSkeleton />
            </PortalSectionNav>
            <ContactsHeaderSkeleton />
            <ContactsSkeleton />
        </div>
    );
}

function FieldSkeleton() {
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <Bone className="block-4 inline-24 max-inline-full" />
            <Bone className="border-2 border-border-warm block-control-lg inline-full" />
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
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
