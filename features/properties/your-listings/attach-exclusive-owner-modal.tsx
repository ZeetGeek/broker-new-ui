"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { exclusiveOwnerPhoneDigits } from "@/lib/api/exclusive-owners";
import { propertiesApi } from "@/lib/api/properties";
import { exclusiveOwnerPickerOptions } from "@/lib/contacts/exclusive-owner-picker-query";
import { formatPersonName } from "@/lib/format/person-name";
import { uniqueInfiniteItems } from "@/lib/pagination/infinite-page";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";

import type { PeoplePickerPerson } from "@/components/shared/people-picker";
import { PeoplePicker } from "@/components/shared/people-picker";
import { Button } from "@/components/ui/button";

import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export function AttachExclusiveOwnerModal({
    open,
    onOpenChange,
    listing,
    onAttached,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listing: MyListingItem | null;
    onAttached?: () => void;
}) {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const currentOwnerId = listing?.exclusiveOwnerId ?? null;
    const isReplace = Boolean(currentOwnerId);
    const ownersQuery = useInfiniteQuery(
        exclusiveOwnerPickerOptions(search, open && Boolean(listing)),
    );
    const filtered = useMemo(
        () =>
            uniqueInfiniteItems(
                ownersQuery.data?.pages.map((page) => ({ ...page, nextCursor: null })) ?? [],
            ),
        [ownersQuery.data],
    );
    const loading = ownersQuery.isLoading || query.trim() !== search;

    const people = useMemo<PeoplePickerPerson[]>(
        () =>
            filtered.map((owner) => {
                const digits = exclusiveOwnerPhoneDigits(owner.phone);
                const isCurrent = owner.id === currentOwnerId;
                return {
                    id: owner.id,
                    name: owner.fullName,
                    role: "owner" as const,
                    phoneDigits: digits || undefined,
                    ownerType: owner.ownerType,
                    statusChips: [
                        ...(isCurrent ? [{ label: "Current", color: "emerald" as const }] : []),
                        ...(owner.propertyCount > 0
                            ? [
                                  {
                                      label: `${owner.propertyCount} ${owner.propertyCount === 1 ? "listing" : "listings"}`,
                                      color: "stone" as const,
                                  },
                              ]
                            : []),
                    ],
                };
            }),
        [currentOwnerId, filtered],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(query.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!open || !listing) return undefined;

        const timer = window.setTimeout(() => {
            setQuery("");
            setSearch("");
            setSelectedId(listing.exclusiveOwnerId ?? null);
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [open, listing]);

    const attach = useCallback(
        (id: string | null) => {
            if (!listing || !id) return;
            if (id === currentOwnerId) {
                onOpenChange(false);
                return;
            }
            setBusy(true);
            void propertiesApi
                .attachExclusiveOwner(listing.id, id)
                .then(() => {
                    toast.success(
                        isReplace ? "Exclusive owner updated" : "Exclusive owner attached",
                    );
                    onAttached?.();
                    onOpenChange(false);
                })
                .catch((error) => {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : isReplace
                              ? "Couldn't change exclusive owner"
                              : "Couldn't attach exclusive owner",
                    );
                })
                .finally(() => setBusy(false));
        },
        [currentOwnerId, isReplace, listing, onAttached, onOpenChange],
    );

    return (
        <>
            <PeoplePicker
                open={open && Boolean(listing)}
                onOpenChange={(next) => {
                    if (!next) onOpenChange(false);
                    else onOpenChange(true);
                }}
                kinds="owner"
                people={people}
                value={selectedId}
                onConfirm={(id) => {
                    setSelectedId(id);
                    attach(id);
                }}
                commitOnSelect={false}
                closeOnConfirm={false}
                confirmLabel={
                    busy
                        ? isReplace
                            ? "Updating…"
                            : "Attaching…"
                        : isReplace
                          ? "Replace owner"
                          : "Attach owner"
                }
                confirmDisabled={busy || loading || (ownersQuery.isError && people.length === 0)}
                title={isReplace ? "Change exclusive owner" : "Attach exclusive owner"}
                description={
                    listing
                        ? isReplace
                            ? `Replace the owner on ${listing.title}. One listing has one owner; the same owner can stay on your other listings.`
                            : `Choose one exclusive owner for ${listing.title}. You can change them later.`
                        : "Choose one exclusive owner for this listing."
                }
                searchPlaceholder="Search exclusive owners"
                searchValue={query}
                onSearchChange={setQuery}
                skipLocalFilter
                loading={loading}
                errorText={
                    ownersQuery.isError && people.length === 0
                        ? "Could not load owners. Please try again."
                        : undefined
                }
                onRetry={() => void ownersQuery.refetch()}
                onCreate={() => setCreateOpen(true)}
                createLabel="Create owner"
                emptyHeading={query ? "No owners match your search" : "No exclusive owners yet"}
                emptyDescription={
                    query
                        ? "Try a different name, phone, or society."
                        : "Create an owner above, then attach them here."
                }
                filteredEmptyHeading="No owners match your search"
                filteredEmptyDescription="Try a different name, phone, or society."
                size="lg"
                headerExtra={
                    isReplace && listing?.ownerName ? (
                        <p className="body-sm rounded-inner bg-surface-muted px-3 py-2 text-ink-muted">
                            Current owner:{" "}
                            <span className="font-semibold text-ink">
                                {formatPersonName(listing.ownerName)}
                            </span>
                        </p>
                    ) : null
                }
                listFooter={
                    !loading &&
                    people.length > 0 &&
                    (ownersQuery.hasNextPage || ownersQuery.isFetchNextPageError) ? (
                        <div className="flex flex-col items-center gap-2 pbs-3" aria-live="polite">
                            {ownersQuery.isFetchNextPageError ? (
                                <p role="alert" className="body-sm text-danger">
                                    Could not load more owners. Please try again.
                                </p>
                            ) : null}
                            <Button
                                variant="outline"
                                disabled={ownersQuery.isFetchingNextPage}
                                onClick={() => void ownersQuery.fetchNextPage()}
                            >
                                {ownersQuery.isFetchingNextPage
                                    ? "Loading owners…"
                                    : ownersQuery.isFetchNextPageError
                                      ? "Try again"
                                      : "Load more owners"}
                            </Button>
                        </div>
                    ) : null
                }
            />
            <AddOwnerModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSaved={(name, _mode, id) => {
                    toast.success("Owner added");
                    for (const queryKey of [
                        ["contacts"],
                        ["exclusive-owner-picker"],
                        ["people-filter-options"],
                    ]) {
                        void queryClient.invalidateQueries({ queryKey });
                    }
                    notifyWorkflowSaved("contact");
                    setQuery(name);
                    setSearch(name);
                    if (id) setSelectedId(id);
                    setCreateOpen(false);
                }}
            />
        </>
    );
}
