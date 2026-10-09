"use client";

import {
    type OwnerRepQueueSort,
    type RepresentationItem,
    representativeApi,
} from "@/lib/api/representative";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { mapRepresentationToOwnerCard } from "@/features/owner-requests/map-owner-request";
import type { OwnerRequestCardItem } from "@/features/owner-requests/types";

/** Which owner-side representation queue to scroll. */
export type OwnerRepQueueKind = "requests" | "invitations" | "active";

const QUEUE_PAGE_SIZE = 20;

function mapItems(rows: RepresentationItem[]): OwnerRequestCardItem[] {
    return rows
        .map((row) => mapRepresentationToOwnerCard(row))
        .filter((row): row is OwnerRequestCardItem => row != null);
}

function loadPage(
    kind: OwnerRepQueueKind,
    params: { search?: string; sort: OwnerRepQueueSort; cursor?: string; limit: number },
    signal: AbortSignal,
) {
    if (kind === "requests") {
        return representativeApi.ownerRequestPage({ status: "pending", ...params }, signal);
    }
    if (kind === "invitations") {
        return representativeApi.ownerInvitationPage({ status: "pending", ...params }, signal);
    }
    return representativeApi.ownerActivePage(params, signal);
}

/**
 * Cursor-paged owner queue for infinite scroll. Search and sort run server-side,
 * so changing either resets to the first page.
 */
export function useOwnerRepQueue({
    kind,
    search,
    sort,
    enabled = true,
}: {
    kind: OwnerRepQueueKind;
    search: string;
    sort: OwnerRepQueueSort;
    enabled?: boolean;
}) {
    const term = search.trim();

    return useInfiniteItems({
        queryKey: ["owner-rep-queue", kind, term, sort],
        enabled,
        queryFn: async ({ cursor, signal }) => {
            const page = await loadPage(
                kind,
                {
                    search: term || undefined,
                    sort,
                    cursor: cursor ?? undefined,
                    limit: QUEUE_PAGE_SIZE,
                },
                signal,
            );
            return {
                items: mapItems(page.items),
                total: page.total,
                nextCursor: page.nextCursor ?? null,
            };
        },
    });
}
