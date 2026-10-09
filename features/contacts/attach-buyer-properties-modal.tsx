"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Building2, Link2, Search } from "lucide-react";

import { clientsApi } from "@/lib/api/clients";
import { type RepresentationItem, representativeApi } from "@/lib/api/representative";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import type { BuyerRow } from "@/features/contacts/types";

type AttachableProperty = {
    id: string;
    title: string;
    city: string;
    isRent: boolean;
    amountInr: number;
};

function toNumber(value: string | number | null | undefined): number {
    if (value == null || value === "") return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function mapRepresentation(rep: RepresentationItem): AttachableProperty | null {
    if (!rep.propertyId) return null;
    const rent = toNumber(rep.propertyMonthlyRent);
    const sale = toNumber(rep.propertySalePrice);
    const isRent =
        rep.propertyTransactionType === "rent" ||
        (rep.propertyTransactionType !== "sale" && rent > 0 && sale <= 0);
    const title =
        rep.propertyTitle?.trim() ||
        [rep.propertyAddress, rep.propertyCity].filter(Boolean).join(", ") ||
        "Property";

    return {
        id: rep.propertyId,
        title,
        city: rep.propertyCity?.trim() || "",
        isRent,
        amountInr: isRent ? rent : sale,
    };
}

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

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setIsLoading(true);
            setQuery("");

            void representativeApi
                .brokerList("accepted")
                .then((rows) => {
                    if (cancelled) return;
                    const mapped = rows
                        .map(mapRepresentation)
                        .filter((item): item is AttachableProperty => item != null);
                    // Dedupe by property id.
                    const unique = [...new Map(mapped.map((item) => [item.id, item])).values()];
                    const already = (buyer.attachedProperties ?? []).map((item) => item.id);
                    setProperties(unique);
                    setAttachedIds(already);
                    setSelectedIds(already);
                })
                .catch(() => {
                    if (cancelled) return;
                    toast.error("Could not load properties. Try again.");
                    setProperties([]);
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [buyer.attachedProperties, open]);

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
                        ? "Buyer linked to the property."
                        : `Buyer linked to ${toAttach.length} properties.`,
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
    }, [attachedIds, buyer.id, onOpenChange, onSaved, selectedIds]);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title="Attach properties"
            description={`Choose accepted listings to show ${buyer.name}.`}
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Input
                        size="sm"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
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
                    primaryDisabled={isLoading || isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                    secondaryDisabled={isSaving}
                />
            }
        >
            {isLoading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-20"
                            aria-hidden
                        />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    heading={query ? "No properties match your search" : "No accepted listings yet"}
                    description={
                        query
                            ? "Try a different title or city."
                            : "Once an owner accepts your request, you can link buyers here."
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
                        const amount = property.isRent
                            ? formatRentInr(property.amountInr)
                            : formatPriceInr(property.amountInr);

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
                                                <Badge variant="outline">Already linked</Badge>
                                            ) : null}
                                        </div>
                                        <p className="body-xs text-ink-muted">
                                            {[property.city, amount].filter(Boolean).join(" · ")}
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
