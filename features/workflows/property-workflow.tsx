"use client";
import { useState } from "react";
import Link from "next/link";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { attachedClientsFor } from "@/lib/api/clients";
import { myListingsApi } from "@/lib/api/my-listings";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";
import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import type { WorkflowTarget } from "@/lib/workflows/target";

import { EmptyState } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { AttachedClientsSummary } from "@/components/shared/attached-clients-summary";
import { ContactName } from "@/components/shared/contact-name";
import { DrawerSection } from "@/components/shared/drawer-section";
import { Building2, RefreshCw, UserPlus, Users } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { useWorkflowWorking } from "@/components/shared/workflow-context";
import { Button } from "@/components/ui/button";

import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { PropertyFormDialog } from "@/features/properties/property-form/property-form-dialog";
import { AttachExclusiveOwnerModal } from "@/features/properties/your-listings/attach-exclusive-owner-modal";
import { useAppSelector } from "@/store/hooks";

export function PropertyWorkflow({
    target,
    onClose,
}: {
    target: Extract<WorkflowTarget, { kind: "property" }>;
    onClose: () => void;
}) {
    const client = useQueryClient();
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const [mode, setMode] = useState<"detail" | "edit" | "owner" | "clients">(
        target.mode === "edit" ? "edit" : "detail",
    );
    useWorkflowWorking(target.mode === "create" || mode !== "detail");
    const query = useQuery({
        queryKey: ["workflow-property", accountId, target.id],
        queryFn: () => myListingsApi.get(target.id!),
        enabled: Boolean(target.id),
        staleTime: 0,
    });
    const listing = query.data;
    const clients = useQuery({
        queryKey: ["property-attached-buyers", target.id],
        queryFn: () => attachedClientsFor(target.id!),
        enabled: Boolean(target.id && listing && !listing.deletedAt),
    });
    const refresh = () => {
        void client.invalidateQueries({
            predicate: (item) =>
                /^(workflow-property|inventory|my-listings|dashboard-listings|owned-property|property-attached|property-analytics|people-filter|pipeline|task-link|broker-visits|edit-property)/.test(
                    String(item.queryKey[0]),
                ),
        });
        notifyWorkflowSaved("property");
    };
    const saved = () => {
        refresh();
        onClose();
    };
    const back = (open: boolean) => {
        if (!open) {
            if (target.mode === "detail") setMode("detail");
            else onClose();
        }
    };
    if (target.mode === "create")
        return (
            <PropertyFormDialog
                open
                portal="broker"
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
                onSaved={saved}
            />
        );
    if (listing && mode === "edit" && !listing.deletedAt)
        return (
            <PropertyFormDialog
                open
                portal="broker"
                listing={listing}
                onOpenChange={back}
                onSaved={saved}
            />
        );
    const amount = listing ? toLegacyAmountFields(listing) : { amountInr: 0, isRent: false };
    return (
        <>
            <AppModal
                open={mode === "detail" || !listing || Boolean(listing.deletedAt)}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
                title={listing?.title || "Property details"}
                size="md"
                className="contacts-detail-drawer"
                footer={
                    listing && !listing.deletedAt ? (
                        <AppModalFooter
                            primaryLabel="Edit property"
                            primaryVariant="accent"
                            onPrimary={() => setMode("edit")}
                        />
                    ) : undefined
                }
            >
                {query.isPending ? (
                    <p role="status" className="body-sm text-ink-muted">
                        Loading property…
                    </p>
                ) : query.isError ? (
                    <EmptyState
                        size="card"
                        variant="error"
                        icon={Building2}
                        heading="Could not load this property"
                        description="Check your connection and try again."
                        action={{
                            label: "Try again",
                            icon: RefreshCw,
                            onClick: () => void query.refetch(),
                            disabled: query.isFetching,
                        }}
                    />
                ) : !listing ? (
                    <EmptyState
                        size="card"
                        icon={Building2}
                        heading="Property no longer available"
                        description="It may have been removed. Open My Listings to choose another property."
                        action={{
                            label: "Open My Listings",
                            icon: Building2,
                            href: "/broker/my-listings",
                        }}
                    />
                ) : listing.deletedAt ? (
                    <EmptyState
                        size="card"
                        icon={Building2}
                        heading="Property is deleted"
                        description="Restore this property from the Deleted view in My Listings before editing it."
                        action={{
                            label: "Open My Listings",
                            icon: Building2,
                            href: "/broker/my-listings",
                        }}
                    />
                ) : (
                    <>
                        <div className="mbe-5 flex items-start gap-3 min-inline-0">
                            <PropertyCoverImage
                                src={listing.imageSrc}
                                alt=""
                                size={80}
                                sizes="80px"
                            />
                            <div className="flex flex-col gap-1 min-inline-0">
                                <p className="body font-semibold wrap-anywhere">{listing.title}</p>
                                <p className="body-sm text-ink-muted">
                                    {[listing.locality, listing.city]
                                        .filter(Boolean)
                                        .map(formatPlaceName)
                                        .join(", ")}
                                </p>
                                {listing.saleAmountInr != null && listing.saleAmountInr > 0 ? (
                                    <PriceWithCommission
                                        amountInr={listing.saleAmountInr}
                                        audience="broker"
                                        commissionPercent={listing.commissionPercent}
                                        size="lg"
                                    />
                                ) : null}
                                {listing.rentAmountInr != null && listing.rentAmountInr > 0 ? (
                                    <PriceWithCommission
                                        amountInr={listing.rentAmountInr}
                                        isRent
                                        audience="broker"
                                        commissionAmountInr={listing.commissionAmount}
                                        size="lg"
                                    />
                                ) : null}
                                {!listing.saleAmountInr && !listing.rentAmountInr ? (
                                    <span className="body-sm text-ink-muted">Price on request</span>
                                ) : null}
                            </div>
                        </div>
                        <DrawerSection
                            title="Property"
                            description="Review the property and its location."
                        >
                            <p className="body-sm">
                                {listing.configLabel || listing.propertyTypeLabel}
                            </p>
                            {listing.address ? (
                                <p className="body-sm mbs-2 text-ink-muted">{listing.address}</p>
                            ) : null}
                            {listing.description ? (
                                <p className="body-sm mbs-3 whitespace-pre-line">
                                    {listing.description}
                                </p>
                            ) : null}
                        </DrawerSection>
                        <DrawerSection
                            title="Owner"
                            description="Open the linked owner or change the contact."
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="body-sm font-semibold">
                                    {listing.ownerName ? (
                                        <ContactName
                                            name={listing.ownerName}
                                            contactId={listing.ownerId}
                                            contactType="owner"
                                        />
                                    ) : (
                                        "No owner linked"
                                    )}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMode("owner")}
                                >
                                    {listing.ownerName ? "Change owner" : "Attach owner"}
                                </Button>
                            </div>
                        </DrawerSection>
                        <DrawerSection
                            title="Clients"
                            description="See the clients working on this property."
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {clients.isPending ? (
                                    <p role="status" className="body-sm text-ink-muted">
                                        Loading clients…
                                    </p>
                                ) : clients.isError ? (
                                    <EmptyState
                                        size="card"
                                        variant="error"
                                        icon={Users}
                                        heading="Could not load clients"
                                        description="Check your connection and try again."
                                        action={{
                                            label: "Try again",
                                            icon: RefreshCw,
                                            onClick: () => void clients.refetch(),
                                            disabled: clients.isFetching,
                                        }}
                                    />
                                ) : clients.data?.length ? (
                                    <AttachedClientsSummary clients={clients.data} />
                                ) : (
                                    <EmptyState
                                        size="card"
                                        icon={Users}
                                        heading="No clients linked yet"
                                        description="Attach clients to track their interest in this property."
                                        action={{
                                            label: "Attach clients",
                                            icon: UserPlus,
                                            onClick: () => setMode("clients"),
                                        }}
                                    />
                                )}
                                {clients.data?.length ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMode("clients")}
                                    >
                                        Attach clients
                                    </Button>
                                ) : null}
                            </div>
                        </DrawerSection>
                        {listing.imageSrcs.length > 1 ? (
                            <DrawerSection title="Photos" description="Review the listing photos.">
                                <div className="flex flex-wrap gap-3">
                                    {listing.imageSrcs.map((src, index) => (
                                        <PropertyCoverImage
                                            key={`${index}-${src}`}
                                            src={src}
                                            alt={`Property photo ${index + 1}`}
                                            size={80}
                                            sizes="80px"
                                        />
                                    ))}
                                </div>
                            </DrawerSection>
                        ) : null}
                        <Link
                            href={brokerPropertyDetailHref(listing.id)}
                            className="body-sm mbs-4 inline-block font-semibold text-brand-text underline underline-offset-4"
                            onNavigate={onClose}
                        >
                            Open full property page
                        </Link>
                    </>
                )}
            </AppModal>
            {listing && mode === "owner" ? (
                <AttachExclusiveOwnerModal
                    open
                    listing={listing}
                    onOpenChange={back}
                    onAttached={() => {
                        refresh();
                        setMode("detail");
                    }}
                />
            ) : null}
            {listing && mode === "clients" ? (
                <AttachBuyersModal
                    open
                    request={{
                        propertyId: listing.id,
                        title: listing.title,
                        bhk: listing.bhk,
                        ...amount,
                    }}
                    onOpenChange={back}
                    onSaved={() => {
                        refresh();
                        setMode("detail");
                    }}
                />
            ) : null}
        </>
    );
}
