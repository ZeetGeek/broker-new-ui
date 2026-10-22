"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { attachedClientsFor } from "@/lib/api/clients";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";

import { UserPlus, Users } from "@/components/shared/icons";
import { AvatarStack } from "@/components/shared/avatar-stack";
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
        <section className={styles.contact} aria-label="Attached buyers">
            <h2>Buyers</h2>
            {query.isPending ? (
                <p className={styles.actionDescription} role="status">
                    Loading buyers…
                </p>
            ) : query.isError ? (
                <div>
                    <p className={styles.actionDescription}>Couldn’t load attached buyers.</p>
                    <Button variant="link" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : query.data.length ? (
                <div className={styles.buyersSummary}>
                    <AvatarStack people={query.data} max={3} size="2xs" />
                    <span>
                        {query.data.length} {query.data.length === 1 ? "buyer" : "buyers"}
                    </span>
                </div>
            ) : (
                <div className={styles.buyersEmpty}>
                    <Users size={24} strokeWidth={1.75} aria-hidden />
                    <p>No buyers attached yet.</p>
                </div>
            )}
            {!query.isPending && !query.isError ? (
                <div className={styles.actionButtons}>
                    <Button variant="outline" onClick={() => setOpen(true)}>
                        <UserPlus size={18} aria-hidden />
                        Attach buyers
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
