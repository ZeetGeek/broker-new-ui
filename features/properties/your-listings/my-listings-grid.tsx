"use client";

import type { PropertyBrokersSummary } from "@/lib/format/property-brokers";
import { useRouter } from "@/lib/navigation";
import {
    brokerPropertyAnalyticsHref,
    brokerPropertyDetailHref,
    brokerPropertyEditHref,
} from "@/lib/routes/broker";
import { ownerPropertyDetailHref, ownerPropertyEditHref } from "@/lib/routes/owner";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import {
    BROKER_MY_LISTINGS_GRID_CLASS,
    MY_LISTINGS_GRID_CLASS,
} from "@/features/properties/your-listings/my-listings-grid-class";
import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export type MyListingsGridProps = {
    items: MyListingItem[];
    /** Owner inventory uses `/owner/properties/*` instead of broker routes. */
    portal?: "broker" | "owner";
    /** When set, "Edit property" opens a modal instead of the edit route. */
    onEditListing?: (listing: MyListingItem) => void;
    /** When set, each card offers "Attach owner" for that listing. */
    onAttachOwner?: (listing: MyListingItem) => void;
    onAttachClients?: (listing: MyListingItem) => void;
    /** When set, each card offers delete (caller shows confirm). */
    onDeleteListing?: (listing: MyListingItem) => void;
    onInviteBroker?: (listing: MyListingItem) => void;
    brokersByProperty?: Map<string, PropertyBrokersSummary>;
    brokerSummaryState?: "loading" | "error" | "ready";
    /** Broker portal only. Save / remove save on the card menu. */
    onToggleSave?: (listing: MyListingItem) => void;
    isSaved?: (listing: MyListingItem) => boolean;
    pinnedIds?: readonly string[];
    clientsUnavailable?: boolean;
    clientsLoading?: boolean;
    onTogglePin?: (listing: MyListingItem) => void;
    /** Deleted tab: cards become read-only with Restore / Delete permanently. */
    deletedActions?: {
        onRestore: (listing: MyListingItem) => void;
        onDeletePermanently: (listing: MyListingItem) => void;
        restoringId?: string | null;
        disabled?: boolean;
    };
};

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

// Keep phone cards full-width, then use the same 2 → 3 → 4 progression as Contacts.
const BROKER_GRID_BREAKPOINTS = [
    { minWidth: 768, columns: 2 },
    { minWidth: 1024, columns: 3 },
    { minWidth: 1280, columns: 4 },
];

const BROKER_IMAGE_SIZES =
    "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";
const IMAGE_SIZES =
    "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw";

export function MyListingsGrid({
    items,
    portal = "broker",
    onEditListing,
    onAttachOwner,
    onAttachClients,
    onDeleteListing,
    onInviteBroker,
    brokersByProperty,
    brokerSummaryState,
    onToggleSave,
    isSaved,
    pinnedIds,
    clientsUnavailable,
    clientsLoading,
    onTogglePin,
    deletedActions,
}: MyListingsGridProps) {
    const router = useRouter();
    const detailHref = portal === "owner" ? ownerPropertyDetailHref : brokerPropertyDetailHref;
    const editHref = portal === "owner" ? ownerPropertyEditHref : brokerPropertyEditHref;

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={520}
            gap="card-grid"
            breakpoints={portal === "broker" ? BROKER_GRID_BREAKPOINTS : GRID_BREAKPOINTS}
            ariaLabel="My Listings"
            gridClassName={
                portal === "broker" ? BROKER_MY_LISTINGS_GRID_CLASS : MY_LISTINGS_GRID_CLASS
            }
            renderItem={(item, index) => {
                const listing = toOwnedPropertyCardListing(item);

                if (deletedActions) {
                    return (
                        <PropertyCard
                            variant="owned"
                            showStatus={portal !== "broker"}
                            ownerRowStyle={portal === "broker" ? "linked" : "inline"}
                            listing={listing}
                            audience={portal}
                            detailsHref={detailHref(item.id)}
                            deleted={{
                                onRestore: () => deletedActions.onRestore(item),
                                onDeletePermanently: () => deletedActions.onDeletePermanently(item),
                                isRestoring: deletedActions.restoringId === item.id,
                                disabled:
                                    deletedActions.disabled || deletedActions.restoringId != null,
                            }}
                            priority={index === 0}
                            imageSizes={portal === "broker" ? BROKER_IMAGE_SIZES : IMAGE_SIZES}
                        />
                    );
                }

                return (
                    <PropertyCard
                        variant="owned"
                        isPinned={pinnedIds?.includes(item.id)}
                        clientsUnavailable={clientsUnavailable}
                        clientsLoading={clientsLoading}
                        onTogglePin={onTogglePin ? () => onTogglePin(item) : undefined}
                        showStatus={portal !== "broker"}
                        ownerRowStyle={portal === "broker" ? "linked" : "inline"}
                        listing={listing}
                        audience={portal}
                        detailsHref={detailHref(item.id)}
                        editHref={editHref(item.id)}
                        onEdit={onEditListing ? () => onEditListing(item) : undefined}
                        onAttachOwner={onAttachOwner ? () => onAttachOwner(item) : undefined}
                        onAddBuyer={onAttachClients ? () => onAttachClients(item) : undefined}
                        onAnalytics={
                            portal === "broker"
                                ? () => router.push(brokerPropertyAnalyticsHref(item.id))
                                : undefined
                        }
                        onDelete={onDeleteListing ? () => onDeleteListing(item) : undefined}
                        onInviteBroker={
                            portal === "owner" && onInviteBroker && !item.isSold
                                ? () => onInviteBroker(item)
                                : undefined
                        }
                        brokerSummary={brokersByProperty?.get(item.id)}
                        brokerSummaryState={brokerSummaryState}
                        isSaved={isSaved?.(item) ?? false}
                        onToggleSave={onToggleSave ? () => onToggleSave(item) : undefined}
                        priority={index === 0}
                        imageSizes={portal === "broker" ? BROKER_IMAGE_SIZES : IMAGE_SIZES}
                    />
                );
            }}
        />
    );
}
