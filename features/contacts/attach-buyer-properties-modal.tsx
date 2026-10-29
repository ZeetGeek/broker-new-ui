"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { type AttachableProperty, listAttachableProperties } from "@/lib/api/attachable-properties";
import { clientsApi } from "@/lib/api/clients";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2, Link2, Search } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import type { BuyerRow } from "@/features/contacts/types";

/** Minimal buyer shape — works after create before the list row is refetched. */
export type AttachBuyerTarget = {
    id: string;
    name: string;
    attachedProperties?: BuyerRow["attachedProperties"];
};

export function AttachBuyerPropertiesModal({
    open,
    onOpenChange,
    buyer,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buyer: AttachBuyerTarget;
    onSaved: () => void;
}) {
    const [properties, setProperties] = useState<AttachableProperty[]>([]);
    const [attachedIds, setAttachedIds] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [retryVersion, setRetryVersion] = useState(0);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setIsLoading(true);
            setLoadError(false);
            setQuery("");
            setProperties([]);
            const already = (buyer.attachedProperties ?? []).map((item) => item.id);
            setAttachedIds(already);
            setSelectedIds(already);

            void listAttachableProperties(controller.signal)
                .then((rows) => {
                    if (cancelled) return;
                    setProperties(rows);
                })
                .catch(() => {
                    if (cancelled) return;
                    setLoadError(true);
                    setProperties([]);
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [buyer.id, buyer.attachedProperties, open, retryVersion]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return properties;
        return properties.filter(
            (item) =>
                item.title.toLowerCase().includes(needle) ||
                item.city.toLowerCase().includes(needle),
        );
    }, [properties, query]);

    const handleToggle = useCallback((propertyId: string) => {
        setSelectedIds((previous) =>
            previous.includes(propertyId)
                ? previous.filter((id) => id !== propertyId)
                : [...previous, propertyId],
        );
    }, []);

    const handleSave = useCallback(() => {
        if (isLoading || isSaving || loadError) return;
        const toAttach = selectedIds.filter((id) => !attachedIds.includes(id));
        if (toAttach.length === 0) {
            onOpenChange(false);
            return;
        }

        setIsSaving(true);
        void clientsApi
            .attachClientToProperties(buyer.id, toAttach)
            .then(() => {
                toast.success(
                    toAttach.length === 1
                        ? "Client linked to the property."
                        : `Client linked to ${toAttach.length} properties.`,
                );
                onSaved();
                onOpenChange(false);
            })
            .catch((error) => {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Could not link properties. Try again.",
                );
            })
            .finally(() => setIsSaving(false));
    }, [attachedIds, buyer.id, onOpenChange, onSaved, selectedIds, isLoading, isSaving, loadError]);

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!isSaving) onOpenChange(next);
            }}
            size="lg"
            title="Attach properties"
            description={`Choose properties to link to ${buyer.name}. Existing links will be kept.`}
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Input
                        size="sm"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search properties"
                        aria-label="Search properties"
                        startIcon={Search}
                        clearable
                        wrapperClassName="min-inline-56 flex-1"
                    />
                    <span className="body-sm shrink-0 font-medium text-ink-muted">
                        {selectedIds.length} selected
                    </span>
                </div>
            }
            footer={
                <AppModalFooter
                    primaryLabel={isSaving ? "Saving…" : "Save links"}
                    primaryIcon={<Link2 aria-hidden strokeWidth={1.75} />}
                    onPrimary={handleSave}
                    primaryDisabled={isLoading || isSaving || loadError}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                    secondaryDisabled={isSaving}
                />
            }
        >
            {isLoading ? (
                <p role="status" className="body-sm text-ink-muted">
                    Loading properties…
                </p>
            ) : loadError ? (
                <div role="alert" className="flex flex-col gap-3">
                    <p className="body-sm text-danger">Could not load properties. Try again.</p>
                    <Button variant="outline" onClick={() => setRetryVersion((value) => value + 1)}>
                        Retry
                    </Button>
                </div>
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    heading={
                        query ? "No properties match your search" : "No available properties yet"
                    }
                    description={
                        query
                            ? "Try a different title or city."
                            : "Add a property to My Listings, then link this client here."
                    }
                />
            ) : (
                <VirtualListBox
                    items={visible}
                    getKey={(property) => property.id}
                    estimateItemHeight={92}
                    ariaLabel="Properties available to attach"
                    renderItem={(property) => {
                        const isSelected = selectedIds.includes(property.id);
                        const alreadyLinked = attachedIds.includes(property.id);

                        return (
                            <div>
                                <label
                                    className={cn(
                                        `
                                          flex cursor-pointer items-start gap-3 rounded-card border
                                          p-3 transition-[background-color,border-color]
                                          duration-160
                                        `,
                                        isSelected
                                            ? "border-brand bg-brand-soft/50"
                                            : `
                                              border-border-warm bg-surface
                                              hover:border-ink/20 hover:bg-surface-muted/50
                                            `,
                                        alreadyLinked && "opacity-80",
                                    )}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        disabled={alreadyLinked}
                                        onCheckedChange={() => {
                                            if (!alreadyLinked) handleToggle(property.id);
                                        }}
                                        aria-label={`Link ${property.title}`}
                                        className="mbs-0.5 shrink-0"
                                    />
                                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="body-sm font-semibold text-ink">
                                                {property.title}
                                            </span>
                                            {alreadyLinked ? (
                                                <Badge color="emerald">Already linked</Badge>
                                            ) : null}
                                            {property.isDraft ? (
                                                <Badge color="stone">Draft</Badge>
                                            ) : null}
                                        </div>
                                        <p
                                            className="
                                              body-xs flex flex-wrap items-center gap-x-1
                                              text-ink-muted
                                            "
                                        >
                                            {property.city ? (
                                                <>
                                                    <span>{property.city}</span>
                                                    <span aria-hidden>·</span>
                                                </>
                                            ) : null}
                                            <PriceWithCommission
                                                amountInr={property.amountInr}
                                                isRent={property.isRent}
                                                commissionPercent={property.commissionPercent}
                                                commissionAmountInr={property.commissionAmount}
                                                audience="broker"
                                                size="xs"
                                                showEmptyTip
                                                className="text-ink-muted"
                                            />
                                        </p>
                                    </div>
                                </label>
                            </div>
                        );
                    }}
                />
            )}
        </AppModal>
    );
}
