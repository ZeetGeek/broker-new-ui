"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { ownerInvitesApi } from "@/lib/api/owner-invites";
import { propertiesApi } from "@/lib/api/properties";
import {
    findPendingBrokerRepresentationId,
    findPendingOwnerInvitationId,
    representativeApi,
} from "@/lib/api/representative";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import {
    BROKER_MY_DEALS_HREF,
    BROKER_OWNER_LISTINGS_HREF,
    brokerOwnerProfileHref,
} from "@/lib/routes/broker";

import { CallIcon, Lock, WhatsAppIcon } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { OwnerListingDetailSkeleton } from "@/features/properties/owner-listings/owner-listings-skeleton";
import { PropertyBuyersCard } from "@/features/properties/property-detail/property-buyers-card";
import { PropertyDetailLayout } from "@/features/properties/property-detail/property-detail-layout";
import { PropertyPriceBlock } from "@/features/properties/property-detail/property-price-block";
import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";
import type { MyListingItem } from "@/features/properties/your-listings/types";
import { useAppSelector } from "@/store/hooks";

import styles from "@/features/properties/property-detail/property-detail.module.css";

type RepresentationStanding = {
    id: string;
    status: string;
    initiatedBy?: string | null;
};

type OwnerListingDetail = {
    listing: MyListingItem;
    ownerUserId?: string;
    ownerName: string;
    ownerAvatarUrl?: string;
    ownerPhoneDigits?: string;
    representation: RepresentationStanding | null;
    commissionPercent: number | null;
    commissionAmount: number | null;
};

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function normalizePhoneDigits(value: string | null | undefined): string | undefined {
    const digits = digitsOnly(value);
    if (!digits) return undefined;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

function standingLabel(standing: RepresentationStanding | null): string {
    if (!standing) return "Available to request";
    if (standing.status === "accepted") return "Representing";
    if (standing.status === "pending") {
        return standing.initiatedBy === "owner" ? "Invite pending" : "Request pending";
    }
    return "Available to request";
}

function OwnerContactCard({ detail }: { detail: OwnerListingDetail }) {
    const accepted = detail.representation?.status === "accepted";
    const phone = accepted ? detail.ownerPhoneDigits : undefined;
    return (
        <section className={styles.contact}>
            <h2>Listed by the owner</h2>
            <div className={styles.contactIdentity}>
                <UserAvatar name={detail.ownerName} imageUrl={detail.ownerAvatarUrl} size="md" />
                <div>
                    {detail.ownerUserId ? (
                        <Link href={brokerOwnerProfileHref(detail.ownerUserId)}>
                            {detail.ownerName}
                        </Link>
                    ) : (
                        <strong>{detail.ownerName}</strong>
                    )}
                    <p>
                        {phone
                            ? formatPhoneIn(phone)
                            : accepted
                              ? "Representation approved"
                              : "Contact shared after approval"}
                    </p>
                </div>
            </div>
            {phone ? (
                <div className={styles.contactActions}>
                    <Button variant="outline" size="md" render={<a href={`tel:+91${phone}`} />}>
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
            ) : accepted ? (
                <p className={styles.actionDescription}>
                    Owner contact details aren&apos;t available right now.
                </p>
            ) : null}
        </section>
    );
}

function OwnerListingActionRail({
    detail,
    busy,
    inviteActionPending,
    onRequest,
    onCancelRequest,
    onAcceptInvite,
    onCancelInvite,
}: {
    detail: OwnerListingDetail;
    busy: boolean;
    inviteActionPending?: "accept" | "cancel";
    onRequest: () => void;
    onCancelRequest?: () => void;
    onAcceptInvite?: () => void;
    onCancelInvite?: () => void;
}) {
    const accepted = detail.representation?.status === "accepted";
    const pending = detail.representation?.status === "pending";
    const ownerInvite = pending && detail.representation?.initiatedBy === "owner";
    return (
        <>
            <section className={styles.actionCard}>
                <div className={styles.price}>
                    <p className={styles.priceLabel}>
                        {detail.listing.transactionType === "rent"
                            ? "Monthly rent"
                            : "Asking price"}
                    </p>
                    <PropertyPriceBlock
                        item={{
                            ...detail.listing,
                            commissionPercent: detail.commissionPercent,
                            commissionAmount: detail.commissionAmount,
                        }}
                        compact
                    />
                </div>
                <h2 className={styles.actionTitle}>
                    {accepted
                        ? "You represent this property"
                        : ownerInvite
                          ? "The owner invited you"
                          : pending
                            ? "Your request is with the owner"
                            : "Represent this property"}
                </h2>
                <p className={styles.actionDescription}>
                    {accepted
                        ? "This property is ready to work in My Deals."
                        : ownerInvite
                          ? "Accept the invitation to start working with this owner."
                          : pending
                            ? "We’ll notify you when the owner responds."
                            : "Interested in working this property? Send the owner a request to represent it."}
                </p>
                <div className={styles.actionButtons}>
                    {accepted ? (
                        <Button
                            variant="accent"
                            size="lg"
                            render={<Link href={BROKER_MY_DEALS_HREF} />}
                        >
                            Open in My Deals
                        </Button>
                    ) : ownerInvite ? (
                        <>
                            <Button
                                variant="accent"
                                size="lg"
                                disabled={Boolean(inviteActionPending)}
                                loading={inviteActionPending === "accept"}
                                onClick={onAcceptInvite}
                            >
                                Accept invitation
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                disabled={Boolean(inviteActionPending)}
                                loading={inviteActionPending === "cancel"}
                                onClick={onCancelInvite}
                            >
                                Decline invitation
                            </Button>
                        </>
                    ) : pending ? (
                        <Button
                            size="lg"
                            variant="outline"
                            disabled={busy}
                            loading={busy}
                            onClick={onCancelRequest}
                        >
                            Cancel request
                        </Button>
                    ) : (
                        <Button
                            variant="accent"
                            size="lg"
                            disabled={busy}
                            loading={busy}
                            onClick={onRequest}
                        >
                            {busy ? "Sending request…" : "Request to represent"}
                        </Button>
                    )}
                </div>
                {!accepted ? (
                    <p className={styles.railNote}>
                        <Lock size={14} aria-hidden />
                        Owner contact details unlock after approval.
                    </p>
                ) : null}
            </section>
            <OwnerContactCard detail={detail} />
            {accepted ? <PropertyBuyersCard item={detail.listing} /> : null}
        </>
    );
}

function OwnerListingDetailView({
    initial,
    onRefresh,
}: {
    initial: OwnerListingDetail;
    onRefresh: () => Promise<OwnerListingDetail | undefined>;
}) {
    const [detail, setDetail] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [inviteActionPending, setInviteActionPending] = useState<"accept" | "cancel" | null>(
        null,
    );

    const item = detail.listing;

    const handleRequest = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            const rep = await representativeApi.requestRepresentation(item.id);
            setDetail((prev) => ({
                ...prev,
                representation: {
                    id: rep.id,
                    status: rep.status,
                    initiatedBy: rep.initiatedBy,
                },
            }));
            toast.success("Request sent. The owner will be notified.");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not send request";
            toast.error(message);
        } finally {
            setBusy(false);
        }
    }, [busy, item.id]);

    const handleCancelRequest = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            let representationId = detail.representation?.id;
            if (!representationId) {
                representationId = await findPendingBrokerRepresentationId(item.id);
            }
            if (!representationId) {
                toast.error("Could not cancel request");
                return;
            }
            await representativeApi.withdraw(representationId);
            setDetail((prev) => ({ ...prev, representation: null }));
            toast.success("Request cancelled");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not cancel request";
            toast.error(message);
        } finally {
            setBusy(false);
        }
    }, [busy, detail.representation, item.id]);

    const handleAcceptInvite = useCallback(async () => {
        if (busy || inviteActionPending) return;
        setInviteActionPending("accept");
        try {
            let invitationId = detail.representation?.id;
            if (!invitationId) {
                invitationId = await findPendingOwnerInvitationId(item.id);
            }
            if (!invitationId) {
                toast.error("Could not accept invite");
                return;
            }
            await ownerInvitesApi.accept(invitationId);
            setDetail((prev) => ({
                ...prev,
                representation: {
                    id: invitationId,
                    status: "accepted",
                    initiatedBy: "owner",
                },
            }));
            const refreshed = await onRefresh();
            if (refreshed) setDetail(refreshed);
            else toast.error("Invitation accepted. Reload the page to load owner contact details.");
            toast.success("Invite accepted — you can sell this property");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not accept invite";
            toast.error(message);
        } finally {
            setInviteActionPending(null);
        }
    }, [busy, detail.representation, inviteActionPending, item.id, onRefresh]);

    const handleCancelInvite = useCallback(async () => {
        if (busy || inviteActionPending) return;
        setInviteActionPending("cancel");
        try {
            let invitationId = detail.representation?.id;
            if (!invitationId) {
                invitationId = await findPendingOwnerInvitationId(item.id);
            }
            if (!invitationId) {
                toast.error("Could not cancel invitation");
                return;
            }
            await ownerInvitesApi.decline(invitationId);
            setDetail((prev) => ({ ...prev, representation: null }));
            toast.success("Invitation cancelled");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not cancel invitation";
            toast.error(message);
        } finally {
            setInviteActionPending(null);
        }
    }, [busy, detail.representation, inviteActionPending, item.id]);

    const canRequest =
        !detail.representation || !["pending", "accepted"].includes(detail.representation.status);

    return (
        <PropertyDetailLayout
            item={item}
            audience="broker"
            statusColor={
                detail.representation?.status === "accepted"
                    ? "emerald"
                    : detail.representation?.status === "pending"
                      ? "amber"
                      : "stone"
            }
            backHref={BROKER_OWNER_LISTINGS_HREF}
            backLabel="Owner listings"
            status={standingLabel(detail.representation)}
            revealAddress={detail.representation?.status === "accepted"}
            rail={
                <OwnerListingActionRail
                    detail={detail}
                    busy={busy}
                    inviteActionPending={inviteActionPending ?? undefined}
                    onRequest={() => void handleRequest()}
                    onCancelRequest={() => void handleCancelRequest()}
                    onAcceptInvite={() => void handleAcceptInvite()}
                    onCancelInvite={() => void handleCancelInvite()}
                />
            }
            mobileAction={
                canRequest ? (
                    <Button
                        variant="accent"
                        size="lg"
                        disabled={busy}
                        loading={busy}
                        onClick={() => void handleRequest()}
                    >
                        Request to represent
                    </Button>
                ) : detail.representation?.status === "pending" &&
                  detail.representation.initiatedBy === "owner" ? (
                    <Button
                        variant="accent"
                        size="lg"
                        disabled={Boolean(inviteActionPending)}
                        loading={inviteActionPending === "accept"}
                        onClick={() => void handleAcceptInvite()}
                    >
                        Accept invitation
                    </Button>
                ) : detail.representation?.status === "pending" ? (
                    <Button
                        size="lg"
                        variant="outline"
                        disabled={busy}
                        loading={busy}
                        onClick={() => void handleCancelRequest()}
                    >
                        Cancel request
                    </Button>
                ) : (
                    <Button
                        variant="accent"
                        size="lg"
                        render={<Link href={BROKER_MY_DEALS_HREF} />}
                    >
                        Open in My Deals
                    </Button>
                )
            }
        />
    );
}

function NotFoundState() {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="h3">Listing not found</h1>
            <p className="body max-w-prose text-ink-muted">
                This owner listing may be private, unpublished, or no longer available.
            </p>
            <Button
                variant="accent"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Back to owner listings
            </Button>
        </div>
    );
}

export function OwnerListingDetailPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;
    const userId = useAppSelector((state) => state.auth.user?.id);
    const query = useQuery({
        queryKey: ["owner-listing-detail", userId, propertyId],
        queryFn: async ({ signal }): Promise<OwnerListingDetail> => {
            const raw = await propertiesApi.browseById(propertyId, signal);
            const commissionRaw = Number(raw.commissionPercent);
            const commissionAmountRaw = Number(raw.commissionAmount);
            return {
                listing: mapPropertyListingToMyItem(raw),
                ownerUserId: raw.ownerUserId ?? raw.owner?.userId ?? undefined,
                ownerName: raw.ownerName?.trim() || raw.organizationName?.trim() || "Owner",
                ownerAvatarUrl: raw.ownerAvatarUrl ?? undefined,
                ownerPhoneDigits: normalizePhoneDigits(raw.ownerPhone),
                representation: raw.representation
                    ? {
                          id: raw.representation.id,
                          status: raw.representation.status,
                          initiatedBy: raw.representation.initiatedBy,
                      }
                    : null,
                commissionPercent:
                    Number.isFinite(commissionRaw) && commissionRaw > 0 ? commissionRaw : null,
                commissionAmount:
                    Number.isFinite(commissionAmountRaw) && commissionAmountRaw > 0
                        ? commissionAmountRaw
                        : null,
            };
        },
        retry: (failureCount, error) =>
            !(error instanceof ApiError && error.status === 404) && failureCount < 1,
        // The view owns optimistic representation actions; always load fresh standing on return.
        staleTime: 0,
        gcTime: 0,
    });

    if (query.isPending) return <OwnerListingDetailSkeleton />;
    if (query.isError) {
        if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundState />;
        return (
            <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
                <h1 className="h3 text-ink">Could not load this property</h1>
                <p className="body text-ink-muted">Check your connection and try again.</p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                    Try again
                </Button>
                <Link
                    href={BROKER_OWNER_LISTINGS_HREF}
                    className="body-sm inline-flex items-center text-brand min-block-11"
                >
                    Back to owner listings
                </Link>
            </div>
        );
    }

    return (
        <OwnerListingDetailView
            key={propertyId}
            initial={query.data}
            onRefresh={async () => {
                const result = await query.refetch();
                return result.isSuccess ? result.data : undefined;
            }}
        />
    );
}
