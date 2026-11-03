"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { attachedClientsFor } from "@/lib/api/clients";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { UserPlus, Users } from "@/components/shared/icons";
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
                <div>
                    <p className={styles.actionDescription}>Couldn’t load attached clients.</p>
                    <Button variant="link" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : query.data.length ? (
                <div className={styles.buyersSummary}>
                    <AvatarStack people={query.data} max={3} size="md" />
                    <span>
                        {query.data.length} {query.data.length === 1 ? "client" : "clients"}
                    </span>
                </div>
            ) : (
                <div className={styles.buyersEmpty}>
                    <Users size={24} strokeWidth={1.75} aria-hidden />
                    <p>No clients attached yet.</p>
                </div>
            )}
            {!query.isPending && !query.isError ? (
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
