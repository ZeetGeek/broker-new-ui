"use client";

import Link from "next/link";

import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import type { PropertyBroker } from "@/lib/format/property-brokers";

import { AttachedBrokersRow } from "@/components/shared/attached-people-row";
import {
    CallIcon,
    Eye,
    EyeOff,
    Inbox,
    Lock,
    Pencil,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import type { MyListingItem } from "../your-listings/types";

import { HoldToDeleteProperty } from "./hold-to-delete-property";
import { PropertyBuyersCard } from "./property-buyers-card";
import { listedAgoLabel } from "./property-detail-facts";
import { PropertyPriceBlock } from "./property-price-block";

import styles from "./property-detail.module.css";

export type PropertyActionRailProps = {
    item: MyListingItem;
    portal: "owner" | "broker";
    busy: boolean;
    onTogglePublish: () => void;
    onRequestDelete: () => Promise<void>;
    /** Broker exclusive listings. Caller opens the sold confirm. */
    onMarkSold?: () => void;
    editHref: string;
    requestsHref?: string;
    brokers?: PropertyBroker[];
    brokersState?: "loading" | "ready" | "error";
    onRetryBrokers?: () => void;
};

export function PropertyActionRail({
    item,
    portal,
    busy,
    onTogglePublish,
    onRequestDelete,
    onMarkSold,
    editHref,
    requestsHref,
    brokers = [],
    brokersState = "ready",
    onRetryBrokers,
}: PropertyActionRailProps) {
    const isOwner = portal === "owner";
    const isPublished = item.status === "published";
    const phone = item.ownerPhoneDigits?.replace(/\D/g, "");
    return (
        <>
            <section className={styles.actionCard}>
                <div className={styles.price}>
                    <p className={styles.priceLabel}>
                        {item.transactionType === "rent" ? "Monthly rent" : "Asking price"}
                    </p>
                    <PropertyPriceBlock item={item} audience={portal} compact />
                </div>
                {isOwner ? (
                    <>
                        <div className="flex items-center gap-2">
                            {isPublished ? (
                                <Eye size={20} aria-hidden />
                            ) : (
                                <EyeOff size={20} aria-hidden />
                            )}
                            <h2 className={styles.actionTitle}>
                                {item.isSold
                                    ? "Property sold"
                                    : isPublished
                                      ? "Your listing is live"
                                      : item.status === "draft"
                                        ? "Your listing is a draft"
                                        : "Your listing is unpublished"}
                            </h2>
                        </div>
                        <p className={styles.actionDescription}>
                            {item.isSold
                                ? "This property is no longer available in owner listings."
                                : isPublished
                                  ? "Brokers can discover your property and ask to represent it."
                                  : "Publish your property when you are ready to receive broker requests."}
                        </p>
                        <div className={styles.actionButtons}>
                            {!item.isSold ? (
                                <Button
                                    size="lg"
                                    disabled={busy}
                                    loading={busy}
                                    variant={isPublished ? "outline" : "accent"}
                                    onClick={onTogglePublish}
                                >
                                    {isPublished ? "Unpublish property" : "Publish property"}
                                </Button>
                            ) : null}
                            {requestsHref ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    render={<Link href={requestsHref} />}
                                >
                                    <Inbox size={18} aria-hidden />
                                    Broker requests
                                    {item.inboundRequestCount > 0
                                        ? ` (${item.inboundRequestCount})`
                                        : ""}
                                </Button>
                            ) : null}
                        </div>
                        <p className={styles.railNote}>
                            <Lock size={14} aria-hidden />
                            You choose which brokers can represent this property.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className={styles.actionTitle}>
                            {item.isSold ? "Property sold" : "Your custom property"}
                        </h2>
                        <p className={styles.actionDescription}>
                            {item.isSold
                                ? "This exclusive listing is sold. Open deals on it were closed."
                                : item.visibility === "marketplace"
                                  ? "Manage the property details and the owner linked to this listing."
                                  : "A private property in your inventory. Keep its details up to date as you work the deal."}
                        </p>
                        <div className={styles.actionButtons}>
                            <Button variant="accent" size="lg" render={<Link href={editHref} />}>
                                <Pencil size={18} aria-hidden />
                                Edit property
                            </Button>
                            {!item.isSold && onMarkSold ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={onMarkSold}
                                >
                                    Mark as sold
                                </Button>
                            ) : null}
                        </div>
                        <p className={styles.railNote}>
                            <Lock size={14} aria-hidden />
                            {item.visibility === "marketplace"
                                ? "Marketplace listing"
                                : "Private inventory"}
                        </p>
                    </>
                )}
            </section>
            {isOwner ? (
                <section className={styles.peopleCard}>
                    <h2>Brokers attached</h2>
                    {brokersState === "loading" ? (
                        <div
                            className={styles.peopleLoading}
                            aria-label="Loading attached brokers"
                        />
                    ) : brokersState === "error" ? (
                        <div className={styles.peopleEmpty}>
                            <p>Couldn&apos;t load attached brokers.</p>
                            {onRetryBrokers ? (
                                <Button type="button" variant="link" onClick={onRetryBrokers}>
                                    Try again
                                </Button>
                            ) : null}
                        </div>
                    ) : brokers.length > 0 ? (
                        <AttachedBrokersRow brokers={brokers} />
                    ) : (
                        <p className={styles.peopleEmpty}>
                            No broker is representing this property yet.
                        </p>
                    )}
                </section>
            ) : null}
            {!isOwner ? (
                <section className={styles.contact}>
                    <h2>Property owner</h2>
                    <div className={styles.contactIdentity}>
                        <UserAvatar name={item.ownerName || "Owner"} size="md" />
                        <div>
                            <strong>{item.ownerName || "No owner linked yet"}</strong>
                            <p>
                                {phone
                                    ? formatPhoneIn(phone)
                                    : "Add owner details by editing this property."}
                            </p>
                        </div>
                    </div>
                    {phone ? (
                        <div className={styles.contactActions}>
                            <Button
                                variant="outline"
                                size="md"
                                render={<a href={`tel:+91${phone}`} />}
                            >
                                <CallIcon size={17} aria-hidden />
                                Call
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                render={
                                    <a
                                        href={formatWhatsAppUrl(phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    />
                                }
                            >
                                <WhatsAppIcon size={17} aria-hidden />
                                WhatsApp
                            </Button>
                        </div>
                    ) : null}
                </section>
            ) : null}
            {!isOwner ? <PropertyBuyersCard item={item} /> : null}
            <section className={styles.management} aria-label="Listing management">
                <div className={styles.managementRow}>
                    <span>Added</span>
                    <strong>{listedAgoLabel(item.listedDaysAgo)}</strong>
                </div>
                {isOwner ? (
                    <div className={styles.secondaryActions}>
                        <Button variant="outline" render={<Link href={editHref} />}>
                            <Pencil size={17} aria-hidden />
                            Edit property
                        </Button>
                    </div>
                ) : null}
                <div className={styles.deleteArea}>
                    <HoldToDeleteProperty disabled={busy} onComplete={onRequestDelete} />
                    <p id="property-delete-hint" className={styles.deleteHint}>
                        This cannot be undone. Release early to cancel.
                    </p>
                </div>
            </section>
        </>
    );
}
