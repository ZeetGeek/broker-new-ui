"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { propertiesApi } from "@/lib/api/properties";
import {
    findPendingBrokerRepresentationId,
    findPendingOwnerInvitationId,
    representativeApi,
} from "@/lib/api/representative";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { isNewInServiceAreas } from "@/features/properties/owner-listings/count-new-listings-this-week";
import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
    /** Broker's service areas — listings new in these get the highlighted card. */
    serviceAreas?: string[];
};

const NO_SERVICE_AREAS: string[] = [];

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

/** `false` cancelled locally; `true` requested but id unknown; a string is the pending id. */
type RequestOverride = string | false | true;

/** `false` declined; `"accepted"` accepted; a string is the pending invitation id. */
type InviteOverride = string | false | "accepted";

type BusyKind = "request" | "cancel" | "accept" | "invite-cancel" | "bookmark";

function mutationErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return fallback;
}

function initialRequestOverrides(items: OwnerListingItem[]): Record<string, RequestOverride> {
    return Object.fromEntries(
        items
            .filter((item) => item.pendingRepresentationId)
            .map((item) => [item.id, item.pendingRepresentationId!]),
    );
}

function initialInviteOverrides(items: OwnerListingItem[]): Record<string, InviteOverride> {
    return Object.fromEntries(
        items
            .filter((item) => item.pendingInvitationId)
            .map((item) => [item.id, item.pendingInvitationId!]),
    );
}

export function OwnerListingsGrid({
    items,
    serviceAreas = NO_SERVICE_AREAS,
}: OwnerListingsGridProps) {
    const serviceAreaSet = useMemo(() => new Set(serviceAreas), [serviceAreas]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [busyKind, setBusyKind] = useState<BusyKind | null>(null);
    const [requestOverrides, setRequestOverrides] = useState<Record<string, RequestOverride>>(() =>
        initialRequestOverrides(items),
    );
    const [inviteOverrides, setInviteOverrides] = useState<Record<string, InviteOverride>>(() =>
        initialInviteOverrides(items),
    );
    // Optimistic overrides until the next browse refetch.
    const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});

    const isSaved = useCallback(
        (item: OwnerListingItem): boolean => savedOverrides[item.id] ?? item.isBookmarked,
        [savedOverrides],
    );

    const handleToggleSave = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId === item.id && busyKind === "bookmark") return;

            const nextSaved = !isSaved(item);
            setSavedOverrides((prev) => ({ ...prev, [item.id]: nextSaved }));
            setBusyId(item.id);
            setBusyKind("bookmark");
            try {
                if (nextSaved) {
                    await propertiesApi.bookmark(item.id);
                    toast.success("Property saved");
                } else {
                    await propertiesApi.unbookmark(item.id);
                    toast.success("Removed from saved");
                }
            } catch (error) {
                setSavedOverrides((prev) => ({ ...prev, [item.id]: !nextSaved }));
                toast.error(mutationErrorMessage(error, "Could not update bookmark"));
            } finally {
                setBusyId(null);
                setBusyKind(null);
            }
        },
        [busyId, busyKind, isSaved],
    );

    const representationIdFor = useCallback(
        (item: OwnerListingItem): string | undefined => {
            const override = requestOverrides[item.id];
            if (override === false) return undefined;
            if (typeof override === "string") return override;
            return item.pendingRepresentationId;
        },
        [requestOverrides],
    );

    const invitationIdFor = useCallback(
        (item: OwnerListingItem): string | undefined => {
            const override = inviteOverrides[item.id];
            if (override === false || override === "accepted") return undefined;
            if (typeof override === "string") return override;
            return item.pendingInvitationId;
        },
        [inviteOverrides],
    );

    const hasRequested = useCallback(
        (item: OwnerListingItem): boolean => {
            const override = requestOverrides[item.id];
            if (override === false) return false;
            if (override === true || typeof override === "string") return true;
            return item.hasRequested;
        },
        [requestOverrides],
    );

    const isInvitePending = useCallback(
        (item: OwnerListingItem): boolean => {
            const override = inviteOverrides[item.id];
            if (override === false || override === "accepted") return false;
            if (typeof override === "string") return true;
            return Boolean(item.isInvitePending);
        },
        [inviteOverrides],
    );

    const isRepresenting = useCallback(
        (item: OwnerListingItem): boolean => {
            if (inviteOverrides[item.id] === "accepted") return true;
            return Boolean(item.isRepresenting);
        },
        [inviteOverrides],
    );

    const handleRequest = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || hasRequested(item) || isRepresenting(item) || isInvitePending(item)) {
                return;
            }

            setBusyId(item.id);
            setBusyKind("request");
            try {
                const representation = await representativeApi.requestRepresentation(item.id);
                setRequestOverrides((prev) => ({
                    ...prev,
                    [item.id]: representation.id || true,
                }));
                toast.success("Request sent. The owner will be notified.");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not send request"));
            } finally {
                setBusyId(null);
                setBusyKind(null);
            }
        },
        [busyId, hasRequested, isInvitePending, isRepresenting],
    );

    const handleCancelRequest = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || !hasRequested(item)) return;

            setBusyId(item.id);
            setBusyKind("cancel");
            try {
                let representationId = representationIdFor(item);
                if (!representationId) {
                    representationId = await findPendingBrokerRepresentationId(item.id);
                    if (representationId) {
                        const pendingId = representationId;
                        setRequestOverrides((prev) => ({ ...prev, [item.id]: pendingId }));
                    }
                }
                if (!representationId) {
                    toast.error("Could not cancel request");
                    return;
                }
                await representativeApi.withdraw(representationId);
                setRequestOverrides((prev) => ({ ...prev, [item.id]: false }));
                toast.success("Request cancelled");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not cancel request"));
            } finally {
                setBusyId(null);
                setBusyKind(null);
            }
        },
        [busyId, hasRequested, representationIdFor],
    );

    const resolveInvitationId = useCallback(
        async (item: OwnerListingItem): Promise<string | undefined> => {
            let invitationId = invitationIdFor(item);
            if (!invitationId) {
                invitationId = await findPendingOwnerInvitationId(item.id);
                if (invitationId) {
                    const pendingId = invitationId;
                    setInviteOverrides((prev) => ({ ...prev, [item.id]: pendingId }));
                }
            }
            return invitationId;
        },
        [invitationIdFor],
    );

    const handleAcceptInvite = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || !isInvitePending(item)) return;

            setBusyId(item.id);
            setBusyKind("accept");
            try {
                const invitationId = await resolveInvitationId(item);
                if (!invitationId) {
                    toast.error("Could not accept invite");
                    return;
                }
                await ownerInvitesApi.accept(invitationId);
                setInviteOverrides((prev) => ({ ...prev, [item.id]: "accepted" }));
                toast.success("Invite accepted — you can sell this property");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not accept invite"));
            } finally {
                setBusyId(null);
                setBusyKind(null);
            }
        },
        [busyId, isInvitePending, resolveInvitationId],
    );

    const handleCancelInvite = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || !isInvitePending(item)) return;

            setBusyId(item.id);
            setBusyKind("invite-cancel");
            try {
                const invitationId = await resolveInvitationId(item);
                if (!invitationId) {
                    toast.error("Could not cancel invitation");
                    return;
                }
                await ownerInvitesApi.decline(invitationId);
                setInviteOverrides((prev) => ({ ...prev, [item.id]: false }));
                toast.success("Invitation cancelled");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not cancel invitation"));
            } finally {
                setBusyId(null);
                setBusyKind(null);
            }
        },
        [busyId, isInvitePending, resolveInvitationId],
    );

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={520}
            gap={24}
            breakpoints={GRID_BREAKPOINTS}
            ariaLabel="Owner listings"
            renderItem={(item, index) => {
                const listing = toBrowsePropertyCardListing(item);
                const requested = hasRequested(item);
                const invitePending = isInvitePending(item);
                const representing = isRepresenting(item);
                const pendingRepresentationId = representationIdFor(item);
                const isBusy = busyId === item.id;
                const inviteActionPending =
                    isBusy && busyKind === "accept"
                        ? "accept"
                        : isBusy && busyKind === "invite-cancel"
                          ? "cancel"
                          : undefined;

                return (
                    <PropertyCard
                        variant="browse"
                        listing={{
                            ...listing,
                            hasRequested: requested,
                            isInvitePending: invitePending,
                            isRepresenting: representing,
                            pendingRepresentationId,
                        }}
                        detailsHref={brokerOwnerListingDetailHref(item.id)}
                        priority={index === 0}
                        imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        isRequestPending={
                            isBusy && (busyKind === "request" || busyKind === "cancel")
                        }
                        inviteActionPending={inviteActionPending}
                        onRequest={() => void handleRequest(item)}
                        onCancelRequest={
                            requested ? () => void handleCancelRequest(item) : undefined
                        }
                        onAcceptInvite={
                            invitePending ? () => void handleAcceptInvite(item) : undefined
                        }
                        onCancelInvite={
                            invitePending ? () => void handleCancelInvite(item) : undefined
                        }
                        isSaved={isSaved(item)}
                        onToggleSave={() => handleToggleSave(item)}
                        isNewInYourArea={isNewInServiceAreas(item, serviceAreaSet)}
                    />
                );
            }}
        />
    );
}
