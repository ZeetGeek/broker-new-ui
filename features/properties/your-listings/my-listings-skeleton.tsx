"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { Skeleton } from "@/components/shared/skeleton";

import { MY_LISTINGS_GRID_CLASS } from "@/features/properties/your-listings/my-listings-grid-class";
import { MyListingsToolbarSkeleton } from "@/features/properties/your-listings/my-listings-header";
import { MyListingsIntro } from "@/features/properties/your-listings/my-listings-intro";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

function TextSkeleton({
    children,
    className,
    width,
}: {
    children: ReactNode;
    className: string;
    width: string;
}) {
    return (
        <div className={cn("relative", className)}>
            <span className="invisible">{children}</span>
            <Skeleton
                className={cn("absolute inset-bs-1/2 -translate-y-1/2 block-[0.8em]", width)}
            />
        </div>
    );
}

function ListingCardSkeleton({ portal }: { portal: "broker" | "owner" }) {
    return (
        <div
            aria-hidden
            className="flex flex-1 flex-col overflow-hidden rounded-card bg-surface shadow-md"
        >
            <div className="relative aspect-4/3 shrink-0 bg-border-warm inline-full">
                <Skeleton className="rounded-none bg-ink/3 block-full inline-full" />
                <div className="absolute inset-x-3 inset-bs-3 flex items-start gap-1.5">
                    <Skeleton className="rounded-full bg-surface/60 block-5 inline-20" />
                    <Skeleton className="rounded-full bg-surface/60 block-5 inline-16" />
                    <Skeleton className="ms-auto rounded-full bg-surface/60 block-10 inline-10" />
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3.5 min-inline-0">
                    <div className="flex flex-col gap-2 min-inline-0">
                        <TextSkeleton className="h5" width="inline-1/2">
                            Price
                        </TextSkeleton>
                        <div className="flex flex-col gap-1">
                            <TextSkeleton className="body font-semibold" width="inline-4/5">
                                Property
                            </TextSkeleton>
                            <TextSkeleton className="body-sm" width="inline-3/5">
                                Location
                            </TextSkeleton>
                        </div>
                    </div>
                    {portal === "broker" ? (
                        <>
                            <TextSkeleton className="body-sm" width="inline-3/5">
                                Owner
                            </TextSkeleton>
                            <TextSkeleton className="body-sm" width="inline-2/3">
                                Buyers
                            </TextSkeleton>
                        </>
                    ) : null}
                </div>
                <div className="mbs-auto flex flex-col gap-2 pbs-1">
                    <Skeleton
                        className={
                            portal === "owner" ? "block-12 inline-full" : "block-11 inline-full"
                        }
                    />
                </div>
            </div>
        </div>
    );
}

export function MyListingsPageSkeleton({ portal = "broker" }: { portal?: "broker" | "owner" }) {
    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyListingsIntro
                    summary={null}
                    resultTotal={0}
                    status={DEFAULT_MY_LISTINGS_FILTERS.status}
                    hasActiveFilters={false}
                    isLoading
                />
            </PortalSectionNav>
            <MyListingsToolbarSkeleton />
            <MyListingsResultsSkeleton portal={portal} />
        </div>
    );
}

export function MyListingsResultsSkeleton({
    count = 5,
    portal = "broker",
    label = "Loading your listings",
}: {
    count?: number;
    portal?: "broker" | "owner";
    label?: string;
}) {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">{label}</span>
            <div className={MY_LISTINGS_GRID_CLASS}>
                {Array.from({ length: count }, (_, index) => (
                    <ListingCardSkeleton key={index} portal={portal} />
                ))}
            </div>
        </div>
    );
}
