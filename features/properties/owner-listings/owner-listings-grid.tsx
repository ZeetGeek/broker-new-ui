"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import {
    findPendingBrokerRepresentationId,
    findPendingOwnerInvitationId,
    representativeApi,
} from "@/lib/api/representative";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
    view?: OwnerListingsView;
};

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

const LIST_BREAKPOINTS = [{ minWidth: 768, columns: 2 }];

/** `false` cancelled locally; `true` requested but id unknown; a string is the pending id. */
type RequestOverride = string | false | true;

/** `false` declined; `"accepted"` accepted; a string is the pending invitation id. */
type InviteOverride = string | false | "accepted";

type BusyKind = "request" | "cancel" | "accept" | "invite-cancel";

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

export function OwnerListingsGrid({ items, view = "grid" }: OwnerListingsGridProps) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [busyKind, setBusyKind] = useState<BusyKind | null>(null);
    const [requestOverrides, setRequestOverrides] = useState<Record<string, RequestOverride>>(() =>
        initialRequestOverrides(items),
    );
    const [inviteOverrides, setInviteOverrides] = useState<Record<string, InviteOverride>>(() =>
        initialInviteOverrides(items),
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

    const isListView = view === "list";

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={isListView ? 268 : 580}
            gap={isListView ? 24 : 24}
            breakpoints={isListView ? LIST_BREAKPOINTS : GRID_BREAKPOINTS}
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
                        layout={view}
                        listing={{
                            ...listing,
                            hasRequested: requested,
                            isInvitePending: invitePending,
                            isRepresenting: representing,
                            pendingRepresentationId,
                        }}
                        detailsHref={brokerOwnerListingDetailHref(item.id)}
                        priority={index === 0}
                        imageSizes={
                            isListView
                                ? "(max-width: 768px) 55vw, 320px"
                                : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        }
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
                    />
                );
            }}
        />
    );
}
