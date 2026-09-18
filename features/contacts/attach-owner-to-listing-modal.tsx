"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Search, Building2 } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { propertiesApi } from "@/lib/api/properties";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { OwnerRow } from "@/features/contacts/types";
import type { MyListingItem } from "@/features/properties/your-listings/types";

function matchesQuery(listing: MyListingItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [listing.title, listing.locality, listing.city, listing.society]
        .join(" ")
        .toLowerCase()
        .includes(needle);
}

export function AttachOwnerToListingModal({
    open,
    onOpenChange,
    owner,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    owner: OwnerRow;
    onSaved: () => void;
}) {
    const [listings, setListings] = useState<MyListingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setLoading(true);
            setQuery("");
            setSelectedId("");
            void myListingsApi
                .list({ page: 1 })
                .then((result) => {
                    if (!cancelled) setListings(result.items);
                })
                .catch(() => {
                    if (!cancelled) {
                        setListings([]);
                        toast.error("Couldn't load your listings");
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open]);

    const filtered = useMemo(
        () => listings.filter((listing) => matchesQuery(listing, query)),
        [listings, query],
    );

    const attach = useCallback(() => {
        if (!selectedId) return;
        setBusy(true);
        void propertiesApi
            .attachExclusiveOwner(selectedId, owner.id)
            .then(() => {
                toast.success(`Attached ${owner.name} to listing`);
                onSaved();
                onOpenChange(false);
            })
            .catch((error) => {
                toast.error(
                    error instanceof Error ? error.message : "Couldn't attach owner to listing",
                );
            })
            .finally(() => setBusy(false));
    }, [onOpenChange, onSaved, owner.id, owner.name, selectedId]);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title="Attach to listing"
            description={`Pick one of your listings to link ${owner.name} as the exclusive owner.`}
            header={
                <Input
                    size="sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search your listings"
                    aria-label="Search your listings"
                    startIcon={Search}
                    clearable
                    wrapperClassName="min-inline-56 flex-1"
                />
            }
            footer={
                <AppModalFooter
                    primaryLabel={busy ? "Attaching…" : "Attach to listing"}
                    primaryIcon={<Building2 aria-hidden strokeWidth={1.75} />}
                    onPrimary={attach}
                    primaryDisabled={!selectedId || busy || loading}
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
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    heading={query ? "No listings match" : "No listings yet"}
                    description={
                        query
                            ? "Try a different title or locality."
                            : "Add a property in Your listings first, then attach this owner."
                    }
                />
            ) : (
                <RadioGroup value={selectedId} onValueChange={setSelectedId}>
                    <VirtualListBox
                        items={filtered}
                        getKey={(listing) => listing.id}
                        estimateItemHeight={80}
                        ariaLabel="Your listings"
                        renderItem={(listing) => {
                            const selected = selectedId === listing.id;
                            return (
                                <label
                                    className={cn(
                                        `
                                          flex cursor-pointer items-start gap-3 rounded-card border p-3
                                          transition-[background-color,border-color] duration-160
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
                                        value={listing.id}
                                        aria-label={`Attach to ${listing.title}`}
                                        className="mbs-1 shrink-0"
                                    />
                                    <div className="min-inline-0 flex-1">
                                        <p className="body-sm font-semibold text-ink">
                                            {listing.title}
                                        </p>
                                        <p className="body-xs text-ink-muted">
                                            {[listing.locality, listing.city]
                                                .filter(Boolean)
                                                .join(", ")}
                                            {listing.exclusiveOwnerId
                                                ? listing.exclusiveOwnerId === owner.id
                                                    ? " · Already attached"
                                                    : " · Has another owner"
                                                : ""}
                                        </p>
                                    </div>
                                </label>
                            );
                        }}
                    />
                </RadioGroup>
            )}
        </AppModal>
    );
}
