"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQuery } from "@tanstack/react-query";

import {
    buildReferralPresentation,
    filterAndSortReferrals,
    referralsApi,
} from "@/lib/api/referrals";
import { buildWhatsAppInviteUrl } from "@/lib/share/referral";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { InfiniteListStatus } from "@/components/shared/infinite-list-status";

import { CreditsLedger } from "@/features/referrals/credits-ledger";
import { EarningsCard } from "@/features/referrals/earnings-card";
import { HowToEarnCard } from "@/features/referrals/how-to-earn-card";
import { InviteBrokerModal } from "@/features/referrals/invite-broker-modal";
import { ReferralDetailModal } from "@/features/referrals/referral-detail-modal";
import { buildInviteMessage } from "@/features/referrals/referral-meta";
import type { ReferralRowHandlers } from "@/features/referrals/referral-row";
import { ReferralShareCard } from "@/features/referrals/referral-share-card";
import {
    ReferralsFilteredEmpty,
    ReferralsFirstRunEmpty,
} from "@/features/referrals/referrals-empty";
import { ReferralsHeader } from "@/features/referrals/referrals-header";
import { ReferralsIntro } from "@/features/referrals/referrals-intro";
import { ReferralsList } from "@/features/referrals/referrals-list";
import { ReferralsListSkeleton } from "@/features/referrals/referrals-skeleton";
import { DEFAULT_REFERRALS_FILTERS, type ReferralsFilters } from "@/features/referrals/types";
import { useAppSelector } from "@/store/hooks";

/** Which modal is open. One at a time — both are about a single decision. */
type ModalState = { kind: "none" } | { kind: "invite" } | { kind: "detail"; referralId: string };

export function ReferralsPage() {
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);

    /**
     * The name that signs every invite message. Falls back the same way the
     * portal shell does, so the header greeting and the WhatsApp signature
     * cannot end up calling the same person two different things.
     */
    const inviterName =
        profile?.fullName?.trim() || user?.fullName?.trim() || "a broker on the platform";

    const [filters, setFilters] = useState<ReferralsFilters>(DEFAULT_REFERRALS_FILTERS);
    const [modal, setModal] = useState<ModalState>({ kind: "none" });

    const invitesQuery = useInfiniteItems({
        queryKey: ["referrals", "invites"],
        queryFn: ({ cursor, signal }) => referralsApi.listInvitesPage(cursor, signal),
    });
    const ledgerQuery = useInfiniteItems({
        queryKey: ["referrals", "credit-history"],
        queryFn: ({ cursor, signal }) => referralsApi.listHistoryPage(cursor, signal),
    });
    const overviewQuery = useQuery({
        queryKey: ["referrals", "overview"],
        queryFn: ({ signal }) => referralsApi.overview(signal),
    });

    /**
     * One clock for the whole screen, ticking each minute. Every "gone quiet"
     * flag and nudge cooldown derives from it, so no two parts of the page can
     * disagree about what time it is.
     */
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const referrals = useMemo(
        () => filterAndSortReferrals(invitesQuery.items, filters, now),
        [filters, invitesQuery.items, now],
    );
    const presentation = useMemo(() => {
        const overview = overviewQuery.data;
        const invitesSummary = invitesQuery.data?.pages[0]?.summary;
        if (!overview || !invitesSummary) return null;

        return buildReferralPresentation(
            overview,
            invitesSummary,
            invitesQuery.items,
            ledgerQuery.items,
            now,
        );
    }, [invitesQuery.data?.pages, invitesQuery.items, ledgerQuery.items, now, overviewQuery.data]);
    const referralCode = presentation?.referralCode ?? null;
    const earnings = presentation?.earnings ?? null;
    const summary = presentation?.summary ?? null;
    const isFetching =
        overviewQuery.isFetching ||
        (invitesQuery.isFetching && !invitesQuery.isFetchingNextPage) ||
        (ledgerQuery.isFetching && !ledgerQuery.isFetchingNextPage);
    const error = overviewQuery.error ?? invitesQuery.error ?? ledgerQuery.error;

    const activeReferral = useMemo(() => {
        if (modal.kind !== "detail") return null;
        return invitesQuery.items.find((referral) => referral.id === modal.referralId) ?? null;
    }, [invitesQuery.items, modal]);

    const handleNudge = useCallback(
        (referralId: string) => {
            const referral = invitesQuery.items.find((item) => item.id === referralId);
            if (!referral || !referralCode) return;

            const message = buildInviteMessage({
                inviterName,
                shareUrl: referralCode.shareUrl,
            });
            // No remind write API — open WhatsApp with the invite link instead.
            window.open(
                buildWhatsAppInviteUrl(message, referral.person.phoneDigits || undefined),
                "_blank",
                "noopener,noreferrer",
            );
            toast.success(`Opened WhatsApp for ${referral.person.name.split(" ")[0]}`);
        },
        [inviterName, invitesQuery.items, referralCode],
    );

    const handlers = useMemo<ReferralRowHandlers>(
        () => ({
            onNudge: handleNudge,
            onOpen: (referralId) => setModal({ kind: "detail", referralId }),
        }),
        [handleNudge],
    );

    const handlePatch = useCallback((patch: Partial<ReferralsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters(DEFAULT_REFERRALS_FILTERS);
    }, []);

    const handleInvited = useCallback((firstName: string) => {
        toast.success(`Message ready for ${firstName}`);
    }, []);

    const isFirstLoad = invitesQuery.isPending;
    const hasFilters =
        filters.q.trim().length > 0 || filters.status !== DEFAULT_REFERRALS_FILTERS.status;
    /** True first-run: nobody invited, and no filter hid them. */
    const isFirstRun = !hasFilters && summary != null && summary.invitedCount === 0;

    return (
        <div className="flex flex-col gap-6">
            <ReferralsIntro summary={summary} isLoading={isFetching} />

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    Could not load all referral activity. Check your connection and try again.
                </p>
            ) : null}

            {/* The share card leads and the progress card sits beside it on a
                wide screen. On a phone they stack in that same order: the
                broker came here to share, and reads how it pays after. */}
            <div className="grid gap-3 lg:grid-cols-[3fr_2fr] lg:gap-4">
                <ReferralShareCard
                    referralCode={referralCode}
                    inviterName={inviterName}
                    onInvite={() => setModal({ kind: "invite" })}
                />
                <EarningsCard summary={summary} earnings={earnings} />
            </div>

            <section className="flex flex-col gap-4">
                <h2 className="h5 text-ink">Your invites</h2>

                {!isFirstRun ? (
                    <ReferralsHeader filters={filters} summary={summary} onPatch={handlePatch} />
                ) : null}

                {invitesQuery.isError && invitesQuery.items.length === 0 ? null : isFirstLoad &&
                  isFetching ? (
                    <ReferralsListSkeleton />
                ) : isFirstRun ? (
                    <ReferralsList
                        referrals={[]}
                        handlers={handlers}
                        inviterName={inviterName}
                        shareUrl={referralCode?.shareUrl ?? ""}
                        busyId={null}
                        now={now}
                        emptyState={
                            <ReferralsFirstRunEmpty onInvite={() => setModal({ kind: "invite" })} />
                        }
                    />
                ) : (
                    // Filter changes dim the list rather than wiping it.
                    // docs/LOADING.md rule 3.
                    <div
                        className={
                            isFetching ? "opacity-60 transition-opacity duration-160" : undefined
                        }
                    >
                        <ReferralsList
                            referrals={referrals}
                            handlers={handlers}
                            inviterName={inviterName}
                            shareUrl={referralCode?.shareUrl ?? ""}
                            busyId={null}
                            now={now}
                            emptyState={<ReferralsFilteredEmpty onClear={handleClearFilters} />}
                        />
                        <InfiniteListStatus
                            hasNextPage={Boolean(invitesQuery.hasNextPage)}
                            isFetchingNextPage={invitesQuery.isFetchingNextPage}
                            error={invitesQuery.isFetchNextPageError ? invitesQuery.error : null}
                            onLoadMore={() => void invitesQuery.fetchNextPage()}
                        />
                    </div>
                )}
            </section>

            {/* Rules and statement side by side: one says how the balance
                moves, the other shows it moving. */}
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                <HowToEarnCard />
                {ledgerQuery.isError && ledgerQuery.items.length === 0 ? null : (
                    <CreditsLedger
                        ledger={ledgerQuery.isPending ? null : ledgerQuery.items}
                        total={ledgerQuery.total}
                        footer={
                            <InfiniteListStatus
                                hasNextPage={Boolean(ledgerQuery.hasNextPage)}
                                isFetchingNextPage={ledgerQuery.isFetchingNextPage}
                                error={ledgerQuery.isFetchNextPageError ? ledgerQuery.error : null}
                                onLoadMore={() => void ledgerQuery.fetchNextPage()}
                            />
                        }
                    />
                )}
            </div>

            <InviteBrokerModal
                open={modal.kind === "invite"}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                inviterName={inviterName}
                shareUrl={referralCode?.shareUrl ?? ""}
                onInvited={handleInvited}
            />

            <ReferralDetailModal
                referral={activeReferral}
                open={modal.kind === "detail"}
                onOpenChange={(open) => !open && setModal({ kind: "none" })}
                inviterName={inviterName}
                shareUrl={referralCode?.shareUrl ?? ""}
                isBusy={false}
                now={now}
                onNudge={handleNudge}
            />
        </div>
    );
}
