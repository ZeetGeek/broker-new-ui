"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Search, UserRound } from "lucide-react";

import {
    exclusiveOwnerPhoneDigits,
    exclusiveOwnersApi,
    type ExclusiveOwnerItem,
} from "@/lib/api/exclusive-owners";
import { propertiesApi } from "@/lib/api/properties";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { MyListingItem } from "@/features/properties/your-listings/types";

function matchesQuery(owner: ExclusiveOwnerItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [
        owner.fullName,
        owner.phone,
        owner.email ?? "",
        owner.society,
        owner.area ?? "",
        owner.city ?? "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
}

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
    const [owners, setOwners] = useState<ExclusiveOwnerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string>("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open || !listing) return undefined;

        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setLoading(true);
            setQuery("");
            setSelectedId(listing.exclusiveOwnerId ?? "");

            void exclusiveOwnersApi
                .list({ limit: 100, sort: "name" })
                .then((page) => {
                    if (!cancelled) setOwners(page.items);
                })
                .catch(() => {
                    if (!cancelled) {
                        setOwners([]);
                        toast.error("Couldn't load exclusive owners");
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
    }, [open, listing]);

    const filtered = useMemo(
        () => owners.filter((owner) => matchesQuery(owner, query)),
        [owners, query],
    );

    const attach = useCallback(() => {
        if (!listing || !selectedId) return;
        setBusy(true);
        void propertiesApi
            .update(listing.id, { exclusiveOwnerId: selectedId })
            .then(() => {
                toast.success("Exclusive owner attached");
                onAttached?.();
                onOpenChange(false);
            })
            .catch((error) => {
                toast.error(
                    error instanceof Error ? error.message : "Couldn't attach exclusive owner",
                );
            })
            .finally(() => setBusy(false));
    }, [listing, onAttached, onOpenChange, selectedId]);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title="Attach exclusive owner"
            description={
                listing
                    ? `Choose a private owner contact for ${listing.title}.`
                    : "Choose a private owner contact for this listing."
            }
            header={
                <Input
                    size="sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search exclusive owners"
                    aria-label="Search exclusive owners"
                    startIcon={Search}
                    clearable
                    wrapperClassName="min-inline-56 flex-1"
                />
            }
            footer={
                <AppModalFooter
                    primaryLabel={busy ? "Attaching…" : "Attach owner"}
                    primaryIcon={<UserRound aria-hidden strokeWidth={1.75} />}
                    onPrimary={attach}
                    primaryDisabled={!selectedId || busy || loading || !listing}
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
                                        value={owner.id}
                                        aria-label={`Attach ${owner.fullName}`}
                                        className="mbs-1 shrink-0"
                                    />
                                    <UserAvatar name={owner.fullName} size="sm" />
                                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="body-sm font-semibold text-ink">
                                                {owner.fullName}
                                            </span>
                                            <Badge variant="outline" className="capitalize">
                                                {owner.ownerType}
                                            </Badge>
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
        </AppModal>
    );
}
