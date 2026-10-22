"use client";

import { useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Search } from "@/components/shared/icons";

import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import type { PropertyBrokersSummary } from "@/lib/format/property-brokers";
import { ownerRequestsHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { brokerDisplayName } from "@/features/owner-brokers/browse-brokers-filters";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export function InvitePropertyBrokerModal({
    listing,
    open,
    onOpenChange,
    summary,
    summaryState,
    onRetrySummary,
    onInvited,
}: {
    listing: MyListingItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    summary?: PropertyBrokersSummary;
    summaryState: "loading" | "error" | "ready";
    onRetrySummary: () => void;
    onInvited: () => void;
}) {
    const id = useId();
    const [search, setSearch] = useState("");
    const [term, setTerm] = useState("");
    const [selected, setSelected] = useState<BrokerProfile | null>(null);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const query = useInfiniteItems({
        queryKey: ["owner-property-invite-brokers", term],
        enabled: open && listing.status === "published",
        queryFn: async ({ cursor, signal }) => {
            const page = await representativeApi.ownerBrokers(
                { search: term || undefined, cursor: cursor ?? undefined, limit: 12 },
                signal,
            );
            return { items: page.items, total: page.total, nextCursor: page.nextCursor ?? null };
        },
    });

    function unavailableReason(brokerId: string): string | undefined {
        if (summary?.brokers.some((broker) => broker.id === brokerId))
            return "Already working on this property";
        if (summary?.pendingInvitations.some((broker) => broker.id === brokerId))
            return "Invitation pending";
        if (summary?.pendingRequests.some((broker) => broker.id === brokerId))
            return "Request awaiting your approval";
    }

    const canInvite =
        listing.status === "published" &&
        summaryState === "ready" &&
        selected &&
        !unavailableReason(selected.id);

    async function sendInvite() {
        if (!canInvite || !selected || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await representativeApi.ownerInvite({
                propertyId: listing.id,
                brokerId: selected.id,
                message: message.trim() || undefined,
            });
            onInvited();
            toast.success("Invitation sent");
            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Couldn't send the invitation. Try again.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!submitting) onOpenChange(next);
            }}
            title="Invite broker"
            description="Choose a broker for this property. They start working on it after accepting your invitation."
            size="md"
            footer={
                <AppModalFooter
                    primaryLabel={submitting ? "Sending…" : "Send invite"}
                    primaryDisabled={!canInvite || submitting}
                    onPrimary={() => void sendInvite()}
                    secondaryLabel="Cancel"
                    secondaryDisabled={submitting}
                    onSecondary={() => onOpenChange(false)}
                />
            }
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1 min-inline-0">
                    <p className="body font-semibold wrap-break-word text-ink">{listing.title}</p>
                    <p className="body-sm text-ink-muted">
                        {listing.locality}, {listing.city}
                    </p>
                </div>
                {summaryState === "loading" ? (
                    <p className="body-sm text-ink-muted" role="status">
                        Loading this property&apos;s brokers…
                    </p>
                ) : summaryState === "error" ? (
                    <div className="flex flex-col items-start gap-2" role="alert">
                        <p className="body-sm text-danger">
                            Couldn&apos;t load this property&apos;s brokers.
                        </p>
                        <Button variant="outline" onClick={onRetrySummary}>
                            Try again
                        </Button>
                    </div>
                ) : (
                    <>
                        {summary?.brokers.length ? (
                            <div className="flex flex-col gap-2">
                                <p className="body-sm font-semibold text-ink">
                                    Working on this property · {summary.brokers.length}
                                </p>
                                {summary.brokers.map((broker) => (
                                    <div
                                        key={broker.id}
                                        className="flex items-center gap-3 min-inline-0"
                                    >
                                        <UserAvatar
                                            name={broker.name}
                                            imageUrl={broker.avatarUrl}
                                            size="xs"
                                        />
                                        <span
                                            className="
                                          body-sm wrap-break-word text-ink min-inline-0
                                        "
                                        >
                                            {broker.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        {summary?.pendingInvitations.length ? (
                            <p className="body-sm wrap-break-word text-ink-muted">
                                Invitations pending:{" "}
                                {summary.pendingInvitations.map((broker) => broker.name).join(", ")}
                            </p>
                        ) : null}
                        {summary?.pendingRequests.length ? (
                            <Link
                                href={ownerRequestsHref()}
                                className="
                                  body-sm font-semibold text-brand underline underline-offset-4
                                "
                            >
                                Review {summary.pendingRequests.length}{" "}
                                {summary.pendingRequests.length === 1
                                    ? "broker request"
                                    : "broker requests"}
                            </Link>
                        ) : null}
                    </>
                )}
                <div className="flex flex-col gap-3">
                    <Input
                        value={search}
                        onValueChange={setSearch}
                        startIcon={Search}
                        placeholder="Search brokers by name"
                        aria-label="Search brokers"
                        clearable
                        disabled={submitting}
                    />
                    {listing.status !== "published" ? (
                        <p className="body-sm text-ink-muted">
                            Publish this property to invite more brokers.
                        </p>
                    ) : query.isPending ? (
                        <div
                            className="flex flex-col gap-2"
                            role="status"
                            aria-label="Loading brokers"
                        >
                            {[0, 1, 2].map((row) => (
                                <div
                                    key={row}
                                    className="
                                      rounded-control bg-surface-muted block-16
                                      motion-safe:animate-pulse
                                    "
                                />
                            ))}
                        </div>
                    ) : query.isError && query.items.length === 0 ? (
                        <div className="flex flex-col items-start gap-2" role="alert">
                            <p className="body-sm text-danger">
                                Couldn&apos;t load brokers. Try again.
                            </p>
                            <Button variant="outline" onClick={() => void query.refetch()}>
                                Try again
                            </Button>
                        </div>
                    ) : query.items.length === 0 ? (
                        <p className="body-sm text-ink-muted">
                            {term
                                ? "No brokers match this search. Try another name."
                                : "No brokers available to invite yet."}
                        </p>
                    ) : (
                        <RadioGroup
                            aria-label="Choose a broker to invite"
                            value={selected?.id ?? ""}
                            onValueChange={(value) => {
                                setSelected(
                                    query.items.find((broker) => broker.id === value) ?? null,
                                );
                                setError(null);
                            }}
                            className="gap-2"
                        >
                            {query.items.map((broker, index) => {
                                const reason = unavailableReason(broker.id);
                                const name = brokerDisplayName(broker);
                                return (
                                    <label
                                        key={broker.id}
                                        className={cn(
                                            `
                                              flex cursor-pointer items-center gap-3 rounded-control
                                              border border-border-warm p-3 min-block-12
                                              min-inline-0
                                            `,
                                            selected?.id === broker.id &&
                                                "border-brand bg-brand-soft",
                                            (reason || submitting || summaryState !== "ready") &&
                                                "cursor-default opacity-60",
                                        )}
                                    >
                                        <RadioGroupItem
                                            id={`${id}-${index}`}
                                            value={broker.id}
                                            disabled={
                                                Boolean(reason) ||
                                                submitting ||
                                                summaryState !== "ready"
                                            }
                                        />
                                        <UserAvatar
                                            name={name}
                                            imageUrl={broker.avatarUrl ?? undefined}
                                            size="xs"
                                        />
                                        <span className="flex flex-col gap-0.5 min-inline-0">
                                            <span
                                                className="
                                              body-sm font-semibold wrap-break-word text-ink
                                            "
                                            >
                                                {name}
                                            </span>
                                            <span className="body-xs wrap-break-word text-ink-muted">
                                                {reason ||
                                                    broker.orgName ||
                                                    broker.city ||
                                                    "Independent broker"}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </RadioGroup>
                    )}
                    {query.hasNextPage || query.isFetchNextPageError ? (
                        <Button
                            variant="outline"
                            loading={query.isFetchingNextPage}
                            onClick={() => void query.fetchNextPage()}
                        >
                            {query.isFetchNextPageError
                                ? "Try loading more again"
                                : "Load more brokers"}
                        </Button>
                    ) : null}
                    {selected ? (
                        <p className="body-sm wrap-break-word text-ink-muted">
                            Selected: {brokerDisplayName(selected)}
                        </p>
                    ) : null}
                </div>
                <label className="flex flex-col gap-1.5">
                    <span className="body-sm font-semibold text-ink">Note (optional)</span>
                    <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        disabled={submitting}
                        placeholder="Add a note about this property"
                        rows={2}
                    />
                </label>
                {error ? (
                    <p className="body-sm text-danger" role="alert">
                        {error}
                    </p>
                ) : null}
            </div>
        </AppModal>
    );
}
