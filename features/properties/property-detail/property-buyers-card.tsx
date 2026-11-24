"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { attachedClientsFor } from "@/lib/api/clients";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";

import { EmptyState } from "@/components/empty-state";
import { AttachedClientsSummary } from "@/components/shared/attached-clients-summary";
import { RefreshCw, UserPlus, Users } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";

import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import type { MyListingItem } from "@/features/properties/your-listings/types";

import styles from "./property-detail.module.css";

export function PropertyBuyersCard({ item }: { item: MyListingItem }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["property-attached-buyers", item.id],
        queryFn: () => attachedClientsFor(item.id),
    });
    const { amountInr, isRent } = toLegacyAmountFields(item);
    return (
        <section className={styles.contact} aria-label="Attached clients">
            <h2>Clients</h2>
            {query.isPending ? (
                <div role="status" aria-busy="true">
                    <span className="sr-only">Loading attached clients</span>
                    <div className={styles.buyersSummary} aria-hidden>
                        <Skeleton className="rounded-full block-10 inline-10" />
                        <Skeleton className="block-4 inline-24" />
                    </div>
                    <div className={styles.contactActions} aria-hidden>
                        <Skeleton className="block-11 inline-full" />
                    </div>
                </div>
            ) : query.isError ? (
                <EmptyState
                    size="card"
                    variant="error"
                    icon={Users}
                    heading="Could not load clients"
                    description="Check your connection and try again."
                    action={{
                        label: "Try again",
                        icon: RefreshCw,
                        onClick: () => void query.refetch(),
                        disabled: query.isFetching,
                    }}
                />
            ) : query.data.length ? (
                <div className={styles.buyersSummary}>
                    <AttachedClientsSummary clients={query.data} size="md" />
                </div>
            ) : (
                <EmptyState
                    size="card"
                    icon={Users}
                    heading="No clients attached yet"
                    description="Attach a client to track their interest in this property."
                    action={
                        !item.isSold
                            ? {
                                  label: "Attach clients",
                                  icon: UserPlus,
                                  onClick: () => setOpen(true),
                              }
                            : undefined
                    }
                />
            )}
            {!item.isSold && !query.isPending && !query.isError && query.data.length > 0 ? (
                <div className={styles.contactActions}>
                    <Button variant="outline" size="md" onClick={() => setOpen(true)}>
                        <UserPlus size={18} aria-hidden />
                        Attach clients
                    </Button>
                </div>
            ) : null}
            <AttachBuyersModal
                open={open}
                onOpenChange={setOpen}
                request={{
                    propertyId: item.id,
                    title: item.title,
                    bhk: item.bhk,
                    amountInr,
                    isRent,
                }}
                onSaved={() => {
                    void query.refetch();
                    void queryClient.invalidateQueries({ queryKey: ["my-requests"] });
                    void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
                }}
            />
        </section>
    );
}
