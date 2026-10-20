"use client";

import { useEffect, useState } from "react";

import {
    findPendingBrokerRepresentationId,
    representationListItems,
    representativeApi,
    type RepresentationItem,
} from "@/lib/api/representative";

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
    const [steps, setSteps] = useState<RequestTimelineStep[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                let id = representationId?.trim() || undefined;
                if (!id) {
                    id = await findPendingBrokerRepresentationId(propertyId);
                }
                const rows = representationListItems(await representativeApi.brokerList("pending"));
                const rep =
                    (id ? rows.find((row) => row.id === id) : undefined) ??
                    rows.find((row) => {
                        const extra = row as RepresentationItem & { property_id?: string };
                        const rowPropertyId = row.propertyId?.trim() || extra.property_id?.trim();
                        return rowPropertyId === propertyId && row.initiatedBy !== "owner";
                    });

                if (cancelled) return;

                if (rep) {
                    setSteps(pendingStepsFromRep(rep));
                } else {
                    setSteps([
                        {
                            key: "sent",
                            label: "You sent the request",
                            at: new Date().toISOString(),
                        },
                    ]);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load the timeline. Try again.");
                    setSteps([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [open, propertyId, representationId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-md">
                <DialogHeader className="border-be border-border-warm px-5 py-4">
                    <DialogTitle>Request timeline</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="px-5 py-4">
                    {ownerName ? (
                        <p className="body-xs text-ink-muted">Waiting on {ownerName}</p>
                    ) : null}
                    {isLoading ? <p className="body-sm text-ink-muted">Loading timeline…</p> : null}
                    {error ? <p className="body-sm text-danger">{error}</p> : null}
                    {!isLoading && !error && steps.length > 0 ? (
                        <RequestTimeline steps={steps} />
                    ) : null}
                </div>
            </DialogPopup>
        </Dialog>
    );
}
