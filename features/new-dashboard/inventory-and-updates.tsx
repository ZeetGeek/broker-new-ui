"use client";

import { useEffect, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { myListingsApi } from "@/lib/api/my-listings";
import { formatRelativePast } from "@/lib/format/date";
import { brokerPropertyDetailHref, brokerPropertyEditHref } from "@/lib/routes/broker";
import { isTestSampleMode } from "@/lib/testing/test-lab";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { EmptyState, LoadingState } from "@/components/empty-state";
import toast from "@/components/shared/app-toast";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { CardLink } from "@/components/shared/card-link";
import { ContactName } from "@/components/shared/contact-name";
import { IconButton } from "@/components/shared/icon-button";
import {
    Activity,
    ArrowRight,
    Building2,
    CalendarCheck,
    CalendarClock,
    CalendarPlus,
    CheckCircle2,
    Clock,
    ImagePlus,
    List,
    MapPin,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
    UserRoundPlus,
    UserRoundSearch,
} from "@/components/shared/icons";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import {
    listingCommissionTip,
    PriceWithCommission,
} from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import type { ActivityData } from "@/features/dashboard/mock-data";
import { PropertyDeleteDialog } from "@/features/properties/property-detail/property-delete-dialog";
import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";
import type { MyListingItem } from "@/features/properties/your-listings/types";

import { activityIcon } from "./activity-icon";
import { DashboardListingRowsSkeleton } from "./dashboard-skeleton";

import styles from "./inventory-and-updates.module.css";

type InventoryTab = "published" | "draft";
const INVENTORY_TABS = [
    { value: "published", label: "Active" },
    { value: "draft", label: "Drafts" },
] as const;

function InventoryTabs({
    value,
    onChange,
    counts,
}: {
    value: InventoryTab;
    onChange: (value: InventoryTab) => void;
    counts?: { published: number; draft: number };
}) {
    return (
        <SlidingTabs
            value={value}
            onValueChange={onChange}
            label="Filter your listings"
            panelId="dashboard-listings-panel"
            className={styles.listingTabs}
            options={INVENTORY_TABS.map((tab) => ({
                ...tab,
                id: `dashboard-listings-tab-${tab.value}`,
                count: counts?.[tab.value],
            }))}
        />
    );
}

function AskingPrice({ listing }: { listing: MyListingItem }) {
    const prices = [
        ...(listing.transactionType !== "rent"
            ? [{ amount: listing.saleAmountInr, isRent: false }]
            : []),
        ...(listing.transactionType !== "sale"
            ? [{ amount: listing.rentAmountInr, isRent: true }]
            : []),
    ];

    return (
        <div className={styles.prices}>
            {prices.map(({ amount, isRent }) => {
                if (amount == null || amount <= 0)
                    return (
                        <span key={String(isRent)} className={styles.secondary}>
                            Price on request
                        </span>
                    );
                const input = {
                    amountInr: amount,
                    isRent,
                    commissionPercent: listing.commissionPercent,
                    commissionAmountInr: listing.commissionAmount,
                    audience: "broker" as const,
                };
                const tip = listingCommissionTip(input);
                return (
                    <div key={String(isRent)} className={styles.price}>
                        <PriceWithCommission
                            {...input}
                            size="md"
                            className={`font-bold ${styles.askingPrice}`}
                        />
                        {tip && !tip.plain && !isRent ? (
                            <span className={styles.commission}>
                                You get{" "}
                                <span className={styles.commissionAmount}>
                                    {tip.headline.slice("You get ".length)}
                                </span>
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function ListingClients({ listing }: { listing: MyListingItem }) {
    const mobile = useMobileMenu();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const clients = listing.attachedClients ?? [];
    if (listing.status === "draft") return <span className={styles.secondary}>Not published</span>;
    if (!clients.length) {
        const count = listing.interestedBuyerIds?.length ?? 0;
        return (
            <span className={styles.secondary}>
                {count ? `${count} ${count === 1 ? "client" : "clients"}` : "No clients yet"}
            </span>
        );
    }
    const remaining = clients.slice(3);
    const person = (client: (typeof clients)[number]) => (
        <span className={styles.clientPerson}>
            <UserAvatar name={client.name} imageUrl={client.avatarUrl} size="2xs" />
            <ContactName
                name={client.name}
                contactId={client.id}
                contactType="buyer"
                className={styles.clientName}
            />
        </span>
    );
    return (
        <div className={styles.clientList}>
            <AvatarStack
                people={clients.slice(0, 3)}
                max={3}
                size="sm"
                avatarClassName={styles.clientAvatar}
            />
            {remaining.length && mobile ? (
                <MobileActionDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    title="More clients"
                    description={`${remaining.length} more ${remaining.length === 1 ? "client" : "clients"}`}
                    trigger={
                        <button
                            type="button"
                            className={styles.moreClients}
                            aria-label={`View ${remaining.length} more clients`}
                        >
                            +{remaining.length} {remaining.length === 1 ? "Client" : "Clients"}
                        </button>
                    }
                >
                    {remaining.map((client) => (
                        <div key={client.id} className={mobileActionClass}>
                            {person(client)}
                        </div>
                    ))}
                </MobileActionDrawer>
            ) : remaining.length ? (
                <Popover>
                    <PopoverTrigger
                        className={styles.moreClients}
                        aria-label={`View ${remaining.length} more clients`}
                    >
                        +{remaining.length} {remaining.length === 1 ? "Client" : "Clients"}
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        className="gap-3 inline-44 max-inline-[calc(100vw-2rem)]"
                    >
                        <PopoverTitle className="body-sm font-semibold">More clients</PopoverTitle>
                        <ul className={styles.overflowClients}>
                            {remaining.map((client) => (
                                <li key={client.id}>{person(client)}</li>
                            ))}
                        </ul>
                    </PopoverContent>
                </Popover>
            ) : (
                <span className={styles.clientTotal}>
                    {clients.length} {clients.length === 1 ? "Client" : "Clients"}
                </span>
            )}
        </div>
    );
}

function ListingRow({
    listing,
    now,
    onDelete,
}: {
    listing: MyListingItem;
    now: Date;
    onDelete: (listing: MyListingItem) => void;
}) {
    const updated = new Date(listing.updatedAt);
    const validDate = Number.isFinite(updated.getTime());
    const href =
        listing.status === "draft"
            ? brokerPropertyEditHref(listing.id)
            : brokerPropertyDetailHref(listing.id);

    return (
        <tr data-linked-card className={styles.listingRow}>
            <td className={styles.propertyCell}>
                <CardLink href={href} label={`Open ${listing.title}`} />
                <Link href={href} className={styles.propertyLink}>
                    <PropertyCoverImage
                        src={listing.imageSrc}
                        alt=""
                        size={72}
                        sizes="72px"
                        className={styles.thumbnail}
                    />
                    <span className={styles.propertyText}>
                        <span
                            data-card-title
                            className={styles.propertyTitle}
                            title={listing.title}
                        >
                            {listing.title}
                        </span>
                        <span className={styles.location}>
                            <MapPin aria-hidden />
                            {[listing.locality, listing.city].filter(Boolean).join(", ")}
                        </span>
                        <span className={styles.listingType}>
                            {listing.transactionType !== "rent" ? (
                                <span className={styles.transactionBadge} data-type="sale">
                                    For sale
                                </span>
                            ) : null}
                            {listing.transactionType !== "sale" ? (
                                <span className={styles.transactionBadge} data-type="rent">
                                    For rent
                                </span>
                            ) : null}
                        </span>
                    </span>
                </Link>
            </td>
            <td className={styles.priceCell}>
                <AskingPrice listing={listing} />
            </td>
            <td className={styles.clientsCell}>
                <ListingClients listing={listing} />
            </td>
            <td className={styles.updatedCell}>
                <div className={styles.updatedContent}>
                    {validDate ? (
                        <time
                            dateTime={updated.toISOString()}
                            title={updated.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        >
                            <Clock aria-hidden />
                            {formatRelativePast(updated, now)}
                        </time>
                    ) : (
                        "—"
                    )}
                </div>
            </td>
            <td className={styles.actionsCell}>
                <div className={styles.rowActions}>
                    <IconButton
                        size="sm"
                        nativeButton={false}
                        render={<Link href={brokerPropertyEditHref(listing.id)} />}
                        aria-label={`Edit ${listing.title}`}
                        title="Edit listing"
                        className=""
                    >
                        <Pencil aria-hidden />
                    </IconButton>
                    <IconButton
                        tone="danger"
                        size="sm"
                        onClick={() => onDelete(listing)}
                        aria-label={`Delete ${listing.title}`}
                        title="Delete listing"
                        className=""
                    >
                        <Trash2 aria-hidden />
                    </IconButton>
                </div>
            </td>
        </tr>
    );
}

// Design-mode activity only; live accounts use the dashboard API's event feed.
function previewUpdates(now: Date) {
    return [
        {
            id: "preview-visit",
            title: "Visit scheduled",
            subtitle: "Priya Desai · Orchid Homes",
            href: "/broker/visits",
            minutes: 20,
            icon: CalendarPlus,
        },
        {
            id: "preview-task",
            title: "Task created",
            subtitle: "Confirm visit with Priya Desai",
            href: "#preview-tasks-title",
            minutes: 35,
            icon: List,
        },
        {
            id: "preview-client",
            title: "Client added",
            subtitle: "Nisha Patel · Tenant",
            href: "/broker/contacts",
            minutes: 60,
            icon: UserRoundPlus,
        },
        {
            id: "preview-listing",
            title: "Listing updated",
            subtitle: "Your latest property details were saved",
            href: "/broker/my-listings",
            minutes: 120,
            icon: Pencil,
        },
        {
            id: "preview-visit-completed",
            title: "Visit marked as attended",
            subtitle: "Aarav Shah · Happy Elegance",
            href: "/broker/visits",
            minutes: 180,
            icon: CalendarCheck,
        },
        {
            id: "preview-client-preferences",
            title: "Client preferences updated",
            subtitle: "Rahul Mehta · Looking for a 3 BHK in Vesu",
            href: "/broker/contacts",
            minutes: 240,
            icon: UserRoundSearch,
        },
        {
            id: "preview-task-completed",
            title: "Task completed",
            subtitle: "Share Orchid Homes documents with Priya",
            href: "#preview-tasks-title",
            minutes: 300,
            icon: CheckCircle2,
        },
        {
            id: "preview-listing-published",
            title: "Listing published",
            subtitle: "4 BHK · Palm Residency · Pal, Surat",
            href: "/broker/my-listings",
            minutes: 420,
            icon: Building2,
        },
        {
            id: "preview-visit-rescheduled",
            title: "Visit rescheduled",
            subtitle: "Mehul Patel · Business Centre · New time saved",
            href: "/broker/visits",
            minutes: 1500,
            icon: CalendarClock,
        },
        {
            id: "preview-client-buyer",
            title: "Client added",
            subtitle: "Ananya Shah · Buyer",
            href: "/broker/contacts",
            minutes: 1620,
            icon: UserRoundPlus,
        },
        {
            id: "preview-listing-photos",
            title: "Listing photos updated",
            subtitle: "2 BHK · River View Apartments · Jahangirpura",
            href: "/broker/my-listings",
            minutes: 1800,
            icon: ImagePlus,
        },
        {
            id: "preview-follow-up-task",
            title: "Follow-up task created",
            subtitle: "Call Rahul about the Vesu shortlist",
            href: "#preview-tasks-title",
            minutes: 2940,
            icon: List,
        },
    ].map((item) => ({
        ...item,
        occurredAt: new Date(now.getTime() - item.minutes * 60_000).toISOString(),
    }));
}

function previewListings(now: Date): MyListingItem[] {
    const examples = [
        {
            title: "3 BHK · Happy Elegance",
            locality: "Vesu",
            saleAmountInr: 8500000,
            rentAmountInr: null,
            commissionPercent: 1,
            commissionAmount: null,
            transactionType: "sale" as const,
            clients: 3,
            hours: 2,
        },
        {
            title: "2 BHK · Orchid Homes",
            locality: "Adajan",
            saleAmountInr: 12500000,
            rentAmountInr: null,
            commissionPercent: 1,
            commissionAmount: null,
            transactionType: "sale" as const,
            clients: 4,
            hours: 24,
        },
        {
            title: "Office · Business Centre",
            locality: "Piplod",
            saleAmountInr: null,
            rentAmountInr: 35000,
            commissionPercent: null,
            commissionAmount: 35000,
            transactionType: "rent" as const,
            clients: 2,
            hours: 48,
        },
        {
            title: "4 BHK · Palm Residency",
            locality: "Pal",
            saleAmountInr: 18500000,
            rentAmountInr: null,
            commissionPercent: 1.5,
            commissionAmount: null,
            transactionType: "sale" as const,
            clients: 5,
            hours: 72,
        },
        {
            title: "2 BHK · River View Apartments",
            locality: "Jahangirpura",
            saleAmountInr: null,
            rentAmountInr: 22000,
            commissionPercent: null,
            commissionAmount: 22000,
            transactionType: "rent" as const,
            clients: 3,
            hours: 96,
        },
        {
            title: "Villa · Shantivan Bungalows",
            locality: "Dumas",
            saleAmountInr: 32000000,
            rentAmountInr: null,
            commissionPercent: null,
            commissionAmount: null,
            transactionType: "sale" as const,
            clients: 0,
            hours: 120,
        },
    ];
    return examples.map((example, index) => ({
        ...MOCK_MY_LISTINGS_SEED[index]!,
        ...example,
        city: "Surat",
        status: "published",
        imageSrc: `/properties/${index + 1}.jpg`,
        updatedAt: new Date(now.getTime() - example.hours * 3_600_000).toISOString(),
        attachedClients: Array.from({ length: example.clients }, (_, i) => ({
            id: `preview-client-${i}`,
            name: ["Rahul Mehta", "Priya Desai", "Aarav Shah", "Nisha Patel", "Mehul Patel"][
                (index + i) % 5
            ],
        })),
    }));
}

export function InventoryAndUpdates({ activity, now }: { activity: ActivityData; now: Date }) {
    // Demo mode has no API data, so it shows the sample listings and updates.
    const preview = isMockMode() && !isTestSampleMode();
    const [selectedTab, setSelectedTab] = useState<InventoryTab>("published");
    const queryClient = useQueryClient();
    const [deletingListing, setDeletingListing] = useState<MyListingItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [removedPreviews, setRemovedPreviews] = useState<MyListingItem[]>([]);
    async function confirmDelete() {
        if (!deletingListing || deleteBusy) return;
        setDeleteBusy(true);
        try {
            if (preview) {
                setRemovedPreviews((current) => [...current, deletingListing]);
                toast.success("Listing removed from preview");
            } else {
                await myListingsApi.remove(deletingListing.id);
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["dashboard-listings"] }),
                    queryClient.invalidateQueries({ queryKey: ["my-listings-summary"] }),
                    queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
                ]);
                toast.success("Moved to Deleted");
            }
            setDeletingListing(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't remove listing");
        } finally {
            setDeleteBusy(false);
        }
    }
    const listingViewportRef = useRef<HTMLDivElement>(null);
    const listingContentRef = useRef<HTMLDivElement>(null);
    const [hasMoreListings, setHasMoreListings] = useState(false);
    const [listingsScrolled, setListingsScrolled] = useState(false);
    const updateViewportRef = useRef<HTMLDivElement>(null);
    const updateContentRef = useRef<HTMLDivElement>(null);
    const [hasMoreUpdates, setHasMoreUpdates] = useState(false);
    const [updatesScrolled, setUpdatesScrolled] = useState(false);

    const summary = useQuery({
        queryKey: ["my-listings-summary", "broker"],
        queryFn: () => myListingsApi.summary(),
        enabled: !preview,
    });
    const listings = useQuery({
        queryKey: ["dashboard-listings", "broker", selectedTab],
        queryFn: ({ signal }) =>
            myListingsApi.list({ status: selectedTab, sort: "newest" }, signal),
        enabled: !preview,
    });
    const draftPreviews = MOCK_MY_LISTINGS_SEED.filter(
        (listing) => listing.status === "draft",
    ).slice(0, 2);
    const visibleItems = preview
        ? selectedTab === "published"
            ? previewListings(now)
            : draftPreviews
        : (listings.data?.items.slice(0, 3) ?? []);
    const items = visibleItems.filter(
        (item) => !removedPreviews.some((removed) => removed.id === item.id),
    );
    const counts = preview
        ? {
              published: 12 - removedPreviews.filter((item) => item.status === "published").length,
              draft:
                  draftPreviews.length -
                  removedPreviews.filter((item) => item.status === "draft").length,
          }
        : summary.data;
    const updates = preview
        ? previewUpdates(now)
        : [...activity.items]
              .filter((item) => Number.isFinite(new Date(item.occurredAt).getTime()))
              .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
              .slice(0, 4)
              .map((item) => ({ ...item, icon: activityIcon(item.category) }));

    const inventoryEmpty =
        !items.length &&
        (preview || (!listings.isPending && !listings.isError)) &&
        counts != null &&
        counts.published === 0 &&
        counts.draft === 0;

    useEffect(() => {
        const viewport = updateViewportRef.current;
        const content = updateContentRef.current;
        if (!viewport || !content) return;
        const measure = () => {
            setHasMoreUpdates(
                viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1,
            );
            setUpdatesScrolled(viewport.scrollTop > 1);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        observer.observe(content);
        viewport.addEventListener("scroll", measure, { passive: true });
        return () => {
            observer.disconnect();
            viewport.removeEventListener("scroll", measure);
        };
    }, [updates.length]);

    useEffect(() => {
        const viewport = listingViewportRef.current;
        const content = listingContentRef.current;
        if (!viewport || !content) return;
        const measure = () => {
            setHasMoreListings(
                viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1,
            );
            setListingsScrolled(viewport.scrollTop > 1);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        observer.observe(content);
        viewport.addEventListener("scroll", measure, { passive: true });
        return () => {
            observer.disconnect();
            viewport.removeEventListener("scroll", measure);
        };
    }, [selectedTab, inventoryEmpty]);

    return (
        <div className={styles.layout}>
            <section
                className={`${styles.panel} ${styles.listingsPanel}`}
                data-empty={inventoryEmpty}
                aria-labelledby="dashboard-listings-heading"
            >
                {inventoryEmpty ? (
                    <EmptyState
                        size="card"
                        icon={Building2}
                        headingId="dashboard-listings-heading"
                        heading="No listings yet"
                        description="Add a property to keep its details and interested clients together."
                        action={{
                            label: "Add listing",
                            icon: Plus,
                            href: "/broker/properties/new",
                        }}
                    />
                ) : (
                    <>
                        <header className={styles.listingsHeader}>
                            <h2 id="dashboard-listings-heading" className="h5 text-ink">
                                Your listings
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                nativeButton={false}
                                render={<Link href="/broker/properties/new" />}
                            >
                                <Plus aria-hidden /> Add listing
                            </Button>
                        </header>
                        <div className={styles.inventorySummary}>
                            <InventoryTabs
                                value={selectedTab}
                                onChange={setSelectedTab}
                                counts={counts}
                            />
                        </div>
                        <div
                            id="dashboard-listings-panel"
                            role="tabpanel"
                            aria-labelledby={`dashboard-listings-tab-${selectedTab}`}
                            className={styles.inventoryContent}
                        >
                            <div
                                ref={listingViewportRef}
                                className={styles.scrollViewport}
                                data-scrolled={listingsScrolled}
                                role="region"
                                aria-label={`${selectedTab === "draft" ? "Draft" : "Active"} listing list`}
                                tabIndex={0}
                            >
                                <div
                                    key={selectedTab}
                                    ref={listingContentRef}
                                    className="t-tabs-panel"
                                >
                                    {!preview && listings.isPending ? (
                                        <LoadingState label="Loading your listings">
                                            <DashboardListingRowsSkeleton />
                                        </LoadingState>
                                    ) : !preview && listings.isError ? (
                                        <EmptyState
                                            size="card"
                                            variant="error"
                                            icon={Building2}
                                            heading="Could not load your listings"
                                            description="Check your connection and try again."
                                            action={{
                                                icon: RefreshCw,
                                                label: listings.isFetching
                                                    ? "Trying again..."
                                                    : "Try again",
                                                disabled: listings.isFetching,
                                                onClick: () => void listings.refetch(),
                                            }}
                                        />
                                    ) : !items.length ? (
                                        <EmptyState
                                            size="card"
                                            icon={Building2}
                                            heading={
                                                selectedTab === "draft"
                                                    ? "No draft listings"
                                                    : "No active listings yet"
                                            }
                                            description={
                                                selectedTab === "draft"
                                                    ? "Properties you save as drafts will appear here, ready to finish later."
                                                    : "Add a property to keep its details and interested clients together."
                                            }
                                            action={{
                                                label: "Add listing",
                                                icon: Plus,
                                                href: "/broker/properties/new",
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <table className={styles.table}>
                                                <caption className="sr-only">
                                                    Your latest{" "}
                                                    {selectedTab === "draft" ? "draft" : "active"}{" "}
                                                    listings, asking prices, interested clients and
                                                    last update
                                                </caption>
                                                <colgroup>
                                                    <col />
                                                    <col />
                                                    <col />
                                                    <col />
                                                    <col />
                                                </colgroup>
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Property</th>
                                                        <th scope="col">Asking price</th>
                                                        <th scope="col">Clients interested</th>
                                                        <th scope="col">Last updated</th>
                                                        <th
                                                            scope="col"
                                                            className={styles.actionsHeading}
                                                        >
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((listing) => (
                                                        <ListingRow
                                                            key={listing.id}
                                                            listing={listing}
                                                            now={now}
                                                            onDelete={setDeletingListing}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </div>
                            </div>
                            <footer className={styles.footer} data-scroll-shadow={hasMoreListings}>
                                <Link
                                    href={`/broker/my-listings?status=${selectedTab}`}
                                    className={styles.footerLink}
                                >
                                    Open listings <ArrowRight aria-hidden />
                                </Link>
                                {items.length > 0 &&
                                !(!preview && (listings.isPending || listings.isError)) ? (
                                    <p className={styles.footerNote}>
                                        Showing {items.length} of{" "}
                                        {counts?.[selectedTab] ??
                                            listings.data?.total ??
                                            items.length}{" "}
                                        {selectedTab === "draft" ? "draft" : "active"} listings
                                    </p>
                                ) : null}
                            </footer>
                        </div>
                    </>
                )}
            </section>
            <section
                className={`${styles.panel} ${styles.updatesPanel}`}
                data-empty={!updates.length}
                data-scroll-fade={hasMoreUpdates}
                aria-labelledby="dashboard-updates-heading"
            >
                {!updates.length ? (
                    <EmptyState
                        size="card"
                        icon={Activity}
                        headingId="dashboard-updates-heading"
                        heading="No recent updates"
                        description="Updates to your listings, clients and visits will appear here."
                        action={{
                            label: "View all updates",
                            icon: Activity,
                            href: "/broker/recent-updates",
                        }}
                    />
                ) : (
                    <>
                        <header className={styles.header} data-scrolled={updatesScrolled}>
                            <h2 id="dashboard-updates-heading" className="h5 text-ink">
                                Recent updates
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                nativeButton={false}
                                render={<Link href="/broker/recent-updates" />}
                            >
                                View all <ArrowRight aria-hidden />
                            </Button>
                        </header>
                        <div
                            className={styles.scrollViewport}
                            role="region"
                            aria-label="Recent update list"
                            ref={updateViewportRef}
                            tabIndex={0}
                        >
                            <div ref={updateContentRef}>
                                {updates.length ? (
                                    <ol className={styles.updates}>
                                        {updates.map((item) => (
                                            <li key={item.id}>
                                                <Link
                                                    data-linked-card
                                                    href={item.href || "/broker/recent-updates"}
                                                    className={styles.updateLink}
                                                >
                                                    <span className={styles.eventIcon}>
                                                        <item.icon aria-hidden strokeWidth={1.75} />
                                                    </span>
                                                    <span className={styles.updateText}>
                                                        <span
                                                            data-card-title
                                                            className={styles.eventTitle}
                                                            title={item.title}
                                                        >
                                                            {item.title}
                                                        </span>
                                                        {item.subtitle?.trim() ? (
                                                            <span
                                                                className={styles.secondary}
                                                                title={item.subtitle}
                                                            >
                                                                {item.subtitle}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    <time
                                                        dateTime={item.occurredAt}
                                                        className={styles.eventTime}
                                                    >
                                                        {formatRelativePast(
                                                            new Date(item.occurredAt),
                                                            now,
                                                        )}
                                                    </time>
                                                </Link>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <EmptyState
                                        size="card"
                                        icon={Activity}
                                        heading="No recent updates"
                                        description="Updates to your listings, clients and visits will appear here."
                                        action={{
                                            label: "View all updates",
                                            icon: Activity,
                                            href: "/broker/recent-updates",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </section>
            <PropertyDeleteDialog
                open={deletingListing != null}
                onOpenChange={(open) => {
                    if (!open && !deleteBusy) setDeletingListing(null);
                }}
                title={deletingListing?.title ?? "Listing"}
                busy={deleteBusy}
                onConfirm={() => void confirmDelete()}
            />
        </div>
    );
}
