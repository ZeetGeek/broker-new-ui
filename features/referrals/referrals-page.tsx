"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { referralsApi } from "@/lib/api/referrals";

import { CreditsLedger } from "@/features/referrals/credits-ledger";
import { EarningsCard } from "@/features/referrals/earnings-card";
import { HowToEarnCard } from "@/features/referrals/how-to-earn-card";
import { InviteBrokerModal } from "@/features/referrals/invite-broker-modal";
import { ReferralDetailModal } from "@/features/referrals/referral-detail-modal";
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
import {
    type CreditEntry,
    DEFAULT_REFERRALS_FILTERS,
    type ReferralCode,
    type ReferralEarningsPoint,
    type ReferralItem,
    type ReferralsFilters,
    type ReferralsSummary,
} from "@/features/referrals/types";
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
    const [referrals, setReferrals] = useState<ReferralItem[] | null>(null);
    const [ledger, setLedger] = useState<CreditEntry[] | null>(null);
    const [earnings, setEarnings] = useState<ReferralEarningsPoint[] | null>(null);
    const [summary, setSummary] = useState<ReferralsSummary | null>(null);
    const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ kind: "none" });
    /** Bumped after a mutation so the list, ledger and counts all refetch. */
    const [revision, setRevision] = useState(0);

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

    useEffect(() => {
        let cancelled = false;

        // Deferred so the loading flag does not set state inside the effect
        // body, which would cascade an extra render on every filter change.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsFetching(true);
            setError(null);

            void referralsApi
                .list(filters)
                .then((next) => {
                    if (cancelled) return;
                    setReferrals(next.items);
                    setLedger(next.ledger);
                    setEarnings(next.earnings);
                    setSummary(next.summary);
                    setReferralCode(next.referralCode);
                })
                .catch(() => {
                    if (!cancelled) {
                        setError(
                            "Could not load your invites. Check your connection and try again.",
                        );
                    }
                })
                .finally(() => {
                    if (!cancelled) setIsFetching(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [filters, revision]);

    const activeReferral = useMemo(() => {
        if (modal.kind !== "detail") return null;
        return referrals?.find((referral) => referral.id === modal.referralId) ?? null;
    }, [modal, referrals]);

    const runMutation = useCallback(
        async (referralId: string, action: () => Promise<void>, message?: string) => {
            setBusyId(referralId);
            try {
                await action();
                setRevision((prev) => prev + 1);
                if (message) toast.success(message);
            } catch (mutationError) {
                toast.error(
                    mutationError instanceof Error && mutationError.message
                        ? mutationError.message
                        : "Could not do that. Try again.",
                );
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const handleNudge = useCallback(
        (referralId: string) => {
            const name =
                referrals
                    ?.find((referral) => referral.id === referralId)
                    ?.person.name.split(" ")[0] ?? "them";
            void runMutation(referralId, () => referralsApi.remind(referralId), `Nudged ${name}`);
        },
        [referrals, runMutation],
    );

    /**
     * Withdrawing is not confirmed in a modal on purpose. Nothing is destroyed
     * — the person keeps whatever link they already have, and the broker can
     * invite them again in ten seconds. A confirmation for that is friction
     * without a risk behind it (docs/MESSAGES.md).
     */
    const handleCancel = useCallback(
        (referralId: string) => {
            void runMutation(referralId, () => referralsApi.cancel(referralId), "Invite withdrawn");
            setModal({ kind: "none" });
        },
        [runMutation],
    );

    const handlers = useMemo<ReferralRowHandlers>(
        () => ({
            onNudge: handleNudge,
            onCancel: handleCancel,
            onOpen: (referralId) => setModal({ kind: "detail", referralId }),
        }),
        [handleCancel, handleNudge],
    );

    const handlePatch = useCallback((patch: Partial<ReferralsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters(DEFAULT_REFERRALS_FILTERS);
    }, []);

    const handleInvited = useCallback((firstName: string) => {
        setRevision((prev) => prev + 1);
        toast.success(`Invite recorded for ${firstName}`);
    }, []);

    const isFirstLoad = referrals === null;
    const hasFilters =
        filters.q.trim().length > 0 || filters.status !== DEFAULT_REFERRALS_FILTERS.status;
    /** True first-run: nobody invited, and no filter hid them. */
    const isFirstRun = !hasFilters && summary != null && summary.invitedCount === 0;

    return (
        <div className="flex flex-col gap-6">
            <ReferralsIntro summary={summary} isLoading={isFetching} />

            {error ? (
                <p role="alert" className="body-sm text-urgent">
                    {error}
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

                {isFirstLoad && isFetching ? (
                    <ReferralsListSkeleton />
                ) : isFirstRun ? (
                    <ReferralsList
                        referrals={[]}
                        handlers={handlers}
                        inviterName={inviterName}
                        shareUrl={referralCode?.shareUrl ?? ""}
                        busyId={busyId}
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
                            referrals={referrals ?? []}
                            handlers={handlers}
                            inviterName={inviterName}
                            shareUrl={referralCode?.shareUrl ?? ""}
                            busyId={busyId}
                            now={now}
                            emptyState={<ReferralsFilteredEmpty onClear={handleClearFilters} />}
                        />
                    </div>
                )}
            </section>

            {/* Rules and statement side by side: one says how the balance
                moves, the other shows it moving. */}
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                <HowToEarnCard />
                <CreditsLedger ledger={ledger} />
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
                isBusy={busyId != null}
                now={now}
                onNudge={handleNudge}
            />
        </div>
    );
}
