"use client";

import { useQuery } from "@tanstack/react-query";

import {
    type RepresentationItem,
    representationListItems,
    representativeApi,
} from "@/lib/api/representative";

import { Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

import { buildRepresentationTimeline } from "@/features/properties/my-requests/map-my-request";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import type { RequestTimelineStep } from "@/features/properties/my-requests/types";
import { useAppSelector } from "@/store/hooks";

type BrowseRequestTimelineDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
    representationId?: string;
    ownerName?: string;
};

function pendingStepsFromRep(rep: RepresentationItem): RequestTimelineStep[] {
    const attemptNumber = Math.max(1, rep.brokerRequestCount ?? 1);
    return buildRepresentationTimeline(rep, "pending", attemptNumber);
}

/**
 * Same Request timeline dialog as My Deals, for a pending broker request on
 * an owner-listing card.
 */
export function BrowseRequestTimelineDialog({
    open,
    onOpenChange,
    propertyId,
    representationId,
    ownerName,
}: BrowseRequestTimelineDialogProps) {
    const userId = useAppSelector((state) => state.auth.user?.id);
    const query = useQuery({
        queryKey: ["owner-listing-timeline", userId, propertyId, representationId],
        enabled: open && Boolean(propertyId),
        staleTime: 0,
        queryFn: async () => {
            const rows = representationListItems(await representativeApi.brokerList("pending"));
            const rep =
                (representationId ? rows.find((row) => row.id === representationId) : undefined) ??
                rows.find((row) => {
                    const extra = row as RepresentationItem & { property_id?: string };
                    return (
                        (row.propertyId?.trim() || extra.property_id?.trim()) === propertyId &&
                        row.initiatedBy !== "owner"
                    );
                });
            return rep ? pendingStepsFromRep(rep) : [];
        },
    });
    const steps = query.data ?? [];
    const isLoading = query.isPending || query.isFetching;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-md">
                <DialogHeader className="border-be border-border-warm px-5 py-4">
                    <DialogTitle>Request timeline</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="px-5 py-4 min-block-44">
                    {ownerName ? (
                        <p className="body-xs text-ink-muted">Waiting on {ownerName}</p>
                    ) : null}
                    {isLoading ? (
                        <div role="status" aria-busy="true" className="flex flex-col gap-4 pbs-4">
                            <span className="sr-only">Loading request timeline</span>
                            {Array.from({ length: 3 }, (_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Skeleton className="shrink-0 rounded-full block-4 inline-4" />
                                    <Skeleton className="block-4 inline-3/5" />
                                    <Skeleton className="ms-auto block-3 inline-16" />
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {query.isError ? (
                        <div role="alert" className="flex flex-col items-start gap-3 pbs-4">
                            <p className="body-sm text-danger">Could not load the timeline.</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void query.refetch()}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : null}
                    {!isLoading && !query.isError && steps.length === 0 ? (
                        <p className="body-sm pbs-4 text-ink-muted">
                            No timeline is available for this request.
                        </p>
                    ) : null}
                    {!isLoading && !query.isError && steps.length > 0 ? (
                        <RequestTimeline steps={steps} />
                    ) : null}
                </div>
            </DialogPopup>
        </Dialog>
    );
}
