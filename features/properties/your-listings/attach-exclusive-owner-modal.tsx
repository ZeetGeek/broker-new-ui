"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useInfiniteQuery } from "@tanstack/react-query";

import { exclusiveOwnerPhoneDigits } from "@/lib/api/exclusive-owners";
import { propertiesApi } from "@/lib/api/properties";
import { exclusiveOwnerPickerOptions } from "@/lib/contacts/exclusive-owner-picker-query";
import { uniqueInfiniteItems } from "@/lib/pagination/infinite-page";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, UserRound } from "@/components/shared/icons";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string>("");
    const [busy, setBusy] = useState(false);

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

    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(query.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!open || !listing) return undefined;

        const timer = window.setTimeout(() => {
            setQuery("");
            setSearch("");
            setSelectedId(listing.exclusiveOwnerId ?? "");
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [open, listing]);

    const attach = useCallback(() => {
        if (!listing || !selectedId) return;
        if (selectedId === currentOwnerId) {
            onOpenChange(false);
            return;
        }
        setBusy(true);
        void propertiesApi
            .attachExclusiveOwner(listing.id, selectedId)
            .then(() => {
                toast.success(isReplace ? "Exclusive owner updated" : "Exclusive owner attached");
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
    }, [currentOwnerId, isReplace, listing, onAttached, onOpenChange, selectedId]);

    const primaryDisabled =
        !selectedId ||
        busy ||
        loading ||
        (ownersQuery.isError && filtered.length === 0) ||
        !listing ||
        selectedId === currentOwnerId;

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title={isReplace ? "Change exclusive owner" : "Attach exclusive owner"}
            description={
                listing
                    ? isReplace
                        ? `Replace the owner on ${listing.title}. One listing has one owner; the same owner can stay on your other listings.`
                        : `Choose one exclusive owner for ${listing.title}. You can change them later.`
                    : "Choose one exclusive owner for this listing."
            }
            header={
                <div className="flex flex-col gap-3">
                    {isReplace && listing?.ownerName ? (
                        <p
                            className="
                              body-sm rounded-inner bg-surface-muted px-3 py-2 text-ink-muted
                            "
                        >
                            Current owner:{" "}
                            <span className="font-semibold text-ink">{listing.ownerName}</span>
                        </p>
                    ) : null}
                    <Input
                        size="sm"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search exclusive owners"
                        aria-label="Search exclusive owners"
                        startIcon={Search}
                        clearable
                        wrapperClassName="min-inline-56 flex-1"
                    />
                </div>
            }
            footer={
                <AppModalFooter
                    primaryLabel={
                        busy
                            ? isReplace
                                ? "Updating…"
                                : "Attaching…"
                            : isReplace
                              ? "Replace owner"
                              : "Attach owner"
                    }
                    primaryIcon={<UserRound aria-hidden strokeWidth={1.75} />}
                    onPrimary={attach}
                    primaryDisabled={primaryDisabled}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                    secondaryDisabled={busy}
                />
            }
        >
            {loading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-20"
                            aria-hidden
                        />
                    ))}
                </div>
            ) : ownersQuery.isError && filtered.length === 0 ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                    <p className="body-sm text-danger">Could not load owners. Please try again.</p>
                    <Button variant="outline" onClick={() => void ownersQuery.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={UserRound}
                    heading={query ? "No owners match your search" : "No exclusive owners yet"}
                    description={
                        query
                            ? "Try a different name, phone, or society."
                            : "Add an exclusive owner from Contacts, then attach them here."
                    }
                />
            ) : (
                <RadioGroup value={selectedId} onValueChange={setSelectedId}>
                    <VirtualListBox
                        items={filtered}
                        getKey={(owner) => owner.id}
                        estimateItemHeight={88}
                        ariaLabel="Exclusive owners available to attach"
                        renderItem={(owner) => {
                            const digits = exclusiveOwnerPhoneDigits(owner.phone);
                            const selected = selectedId === owner.id;
                            const isCurrent = owner.id === currentOwnerId;
                            return (
                                <label
                                    className={cn(
                                        `
                                          flex cursor-pointer items-start gap-3 rounded-card border
                                          p-3 transition-[background-color,border-color]
                                          duration-160
                                        `,
                                        selected
                                            ? "border-brand bg-brand-soft/50"
                                            : `
                                              border-border-warm bg-surface
                                              hover:border-ink/20 hover:bg-surface-muted/50
                                            `,
                                    )}
                                >
                                    <RadioGroupItem
                                        value={owner.id}
                                        aria-label={`${isCurrent ? "Keep" : "Select"} ${owner.fullName}`}
                                        className="mbs-1 shrink-0"
                                    />
                                    <UserAvatar name={owner.fullName} size="sm" />
                                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="body-sm font-semibold text-ink">
                                                {owner.fullName}
                                            </span>
                                            <Badge color="sky" className="capitalize">
                                                {owner.ownerType}
                                            </Badge>
                                            {isCurrent ? (
                                                <Badge color="emerald">Current</Badge>
                                            ) : null}
                                            {owner.propertyCount > 0 ? (
                                                <Badge color="stone">
                                                    {owner.propertyCount}{" "}
                                                    {owner.propertyCount === 1
                                                        ? "listing"
                                                        : "listings"}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <PhoneNumber
                                            phoneDigits={digits}
                                            className="body-xs text-ink-muted"
                                        />
                                        <p className="body-xs text-ink-muted">
                                            {[owner.society, owner.area, owner.city]
                                                .filter(Boolean)
                                                .join(" · ") || "No address details"}
                                        </p>
                                    </div>
                                </label>
                            );
                        }}
                    />
                </RadioGroup>
            )}
            {!loading &&
            filtered.length > 0 &&
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
            ) : null}
        </AppModal>
    );
}
