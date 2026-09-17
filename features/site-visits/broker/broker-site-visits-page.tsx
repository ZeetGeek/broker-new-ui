"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { slotListFiltersFromParams } from "@/lib/visits/filters";
import { buildVisitSummary } from "@/lib/visits/summary";
import { useSiteVisits } from "@/hooks/use-site-visits";
import { useSlots } from "@/hooks/use-slots";
import { useTimeRequests } from "@/hooks/use-time-requests";
import { useVisitActions } from "@/hooks/use-visit-actions";
import { useVisitSummary } from "@/hooks/use-visit-summary";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";

import type { BrokerVisitsTab, SummaryFilter } from "@/features/site-visits/broker/model";
import { MyVisitsTab } from "@/features/site-visits/broker/my-visits/my-visits-tab";
import { OpenSlotsTab } from "@/features/site-visits/broker/open-slots/open-slots-tab";
import { BookingDrawer } from "@/features/site-visits/broker/panels/booking-drawer";
import { RescheduleModal } from "@/features/site-visits/broker/panels/reschedule-modal";
import { VisitDetailPanel } from "@/features/site-visits/broker/panels/visit-detail-panel";
import { RequestsTab } from "@/features/site-visits/broker/requests/requests-tab";
import { SummaryStrip } from "@/features/site-visits/broker/summary-strip";
import { BrokerVisitsHeader } from "@/features/site-visits/broker/visits-header";
import { VisitsTabs } from "@/features/site-visits/broker/visits-tabs";

const OutcomeModal = dynamic(() => import("@/features/site-visits/broker/panels/outcome-modal"), {
    ssr: false,
});

function isTab(value: string | null): value is BrokerVisitsTab {
    return value === "visits" || value === "slots" || value === "requests";
}

function isSummaryFilter(value: string | null): value is SummaryFilter {
    return ["today", "tomorrow", "awaiting", "feedback", "week", "cancelled"].includes(value ?? "");
}

export function BrokerSiteVisitsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabValue = searchParams.get("tab");
    const focusValue = searchParams.get("focus");
    const tab: BrokerVisitsTab = isTab(tabValue) ? tabValue : "visits";
    const focus: SummaryFilter | undefined = isSummaryFilter(focusValue) ? focusValue : undefined;
    const viewValue = searchParams.get("view");
    const view = viewValue === "week" ? "week" : "list";
    const buyerId = searchParams.get("buyer") ?? undefined;
    const visitsQuery = useSiteVisits();
    const slotFilters = useMemo(
        () => slotListFiltersFromParams(new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const slotsQuery = useSlots(true, slotFilters);
    const requestsQuery = useTimeRequests();
    useVisitSummary();
    const visitActions = useVisitActions();
    const buyersQuery = useQuery({
        queryKey: ["visitBuyers"],
        queryFn: () => brokerVisitsApi.listBuyers(),
        staleTime: 60_000,
    });
    const buyers = buyersQuery.data ?? [];
    const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
    const [actionError, setActionError] = useState<string>();
    const [now, setNow] = useState(() => new Date());
    const updateUrl = useCallback(
        (patch: Record<string, string | undefined>) => {
            const next = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(patch)) {
                if (value) next.set(key, value);
                else next.delete(key);
            }
            const query = next.toString();
            router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );
    const bookValue = searchParams.get("book");
    const selectedBooking = (() => {
        if (!bookValue || bookValue === "ready") return undefined;
        for (const item of slotsQuery.data ?? []) {
            const slot = item.slots.find((candidate) => candidate.id === bookValue);
            if (slot) return { item, slot };
        }
        return undefined;
    })();
    const visitId = searchParams.get("visit") ?? undefined;
    const outcomeId = searchParams.get("outcome") ?? undefined;
    const rescheduleId = searchParams.get("reschedule") ?? undefined;
    const allVisits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
    const selectedVisit = allVisits.find((visit) => visit.id === visitId);
    const outcomeVisit = allVisits.find((visit) => visit.id === outcomeId);
    const rescheduleVisit = allVisits.find((visit) => visit.id === rescheduleId);
    const rescheduleSlots = (slotsQuery.data ?? []).find(
        (item) => item.property.id === rescheduleVisit?.property.id,
    );
    const summary = useMemo(() => {
        return buildVisitSummary(allVisits, slotsQuery.data ?? [], requestsQuery.data ?? [], now);
    }, [allVisits, now, requestsQuery.data, slotsQuery.data]);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const typing =
                ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
                target.isContentEditable;
            if (event.key === "Escape") {
                updateUrl({
                    book: undefined,
                    request: undefined,
                    visit: undefined,
                    outcome: undefined,
                    reschedule: undefined,
                });
                return;
            }
            if (typing) return;
            if (event.key === "/") {
                event.preventDefault();
                updateUrl({ tab: "slots" });
                window.setTimeout(() => document.getElementById("slot-search")?.focus(), 80);
            } else if (event.key.toLowerCase() === "t") {
                updateUrl({ tab: "visits", focus: "today" });
            } else if (event.key === "[" || event.key === "]") {
                window.dispatchEvent(
                    new CustomEvent("site-visits-day-step", { detail: event.key === "]" ? 1 : -1 }),
                );
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [updateUrl]);

    const handleVisitAction = useCallback(
        (action: "outcome" | "reschedule" | "withdraw", id: string) => {
            if (action === "withdraw") {
                setActionError(undefined);
                void visitActions.cancel
                    .mutateAsync(id)
                    .then(() => toast.success("Request withdrawn"))
                    .catch((error) =>
                        setActionError(
                            error instanceof Error
                                ? error.message
                                : "Could not withdraw this visit. Check your connection and try again.",
                        ),
                    );
                return;
            }
            updateUrl({ [action]: id });
        },
        [updateUrl, visitActions.cancel],
    );

    const counts = useMemo(
        () => ({
            visits: summary.weekTotal,
            slots: summary.openSlots,
            requests: summary.requestReplies,
        }),
        [summary],
    );

    return (
        <main className="flex flex-col gap-6 pbe-24 md:pbe-10">
            <PortalSectionNav>
                <BrokerVisitsHeader summary={summary} />
            </PortalSectionNav>

            <section className="flex flex-col gap-3">
                <VisitsTabs
                    value={tab}
                    counts={counts}
                    onChange={(next) => updateUrl({ tab: next, focus: undefined })}
                    onBook={() => updateUrl({ tab: "slots", book: "ready" })}
                    onRequest={() => updateUrl({ tab: "requests" })}
                />
                <SummaryStrip
                    summary={summary}
                    active={focus}
                    onChange={(next) => updateUrl({ tab: "visits", focus: next })}
                />
            </section>
            {actionError ? (
                <p
                    role="alert"
                    className="
              body-sm rounded-inner bg-danger-soft px-4 py-3 font-semibold text-danger
            "
                >
                    {actionError}
                </p>
            ) : null}

            <div
                role="tabpanel"
                aria-label={
                    tab === "visits" ? "My visits" : tab === "slots" ? "Open slots" : "Requests"
                }
            >
                {tab === "visits" ? (
                    <MyVisitsTab
                        visits={visitsQuery.data ?? []}
                        isLoading={visitsQuery.isLoading}
                        focus={focus}
                        initialView={view}
                        onViewChange={(next) => updateUrl({ view: next })}
                        onOpen={(id) => updateUrl({ visit: id })}
                        onAction={handleVisitAction}
                        onBrowseSlots={() => updateUrl({ tab: "slots" })}
                    />
                ) : tab === "slots" ? (
                    <OpenSlotsTab
                        key={searchParams.get("q") ?? ""}
                        items={slotsQuery.data ?? []}
                        buyers={buyers}
                        buyerId={buyerId}
                        isLoading={slotsQuery.isLoading}
                        isError={slotsQuery.isError}
                        updatedAt={slotsQuery.dataUpdatedAt}
                        onBuyerChange={(id) => updateUrl({ buyer: id })}
                        onBook={(slot) => updateUrl({ book: slot.id })}
                        onOpenVisit={(id) => updateUrl({ tab: "visits", visit: id })}
                        onRequest={() => updateUrl({ tab: "slots", book: "ready" })}
                        onRefresh={() => void slotsQuery.refetch()}
                        rowErrors={rowErrors}
                    />
                ) : (
                    <RequestsTab
                        requests={requestsQuery.data ?? []}
                        isLoading={requestsQuery.isLoading}
                        onNew={() => updateUrl({ tab: "slots", book: "ready" })}
                        onRetry={(propertyId, retryBuyerId) =>
                            updateUrl({ tab: "slots", book: "ready", buyer: retryBuyerId })
                        }
                        onViewVisit={(id) => updateUrl({ tab: "visits", visit: id })}
                    />
                )}
            </div>

            <BookingDrawer
                open={Boolean(selectedBooking)}
                item={selectedBooking?.item}
                slot={selectedBooking?.slot}
                buyers={buyers}
                visits={visitsQuery.data ?? []}
                preselectedBuyerId={buyerId}
                onClose={() => updateUrl({ book: undefined })}
                onOpenVisit={(id) => updateUrl({ book: undefined, tab: "visits", visit: id })}
                onChooseAlternative={(slotId) => updateUrl({ book: slotId })}
                onSlotTaken={(propertyId, message) =>
                    setRowErrors((current) => ({ ...current, [propertyId]: message }))
                }
            />

            <VisitDetailPanel
                open={Boolean(selectedVisit)}
                visit={selectedVisit}
                onClose={() => updateUrl({ visit: undefined })}
                onLogOutcome={() =>
                    selectedVisit && updateUrl({ visit: undefined, outcome: selectedVisit.id })
                }
                onReschedule={() =>
                    selectedVisit && updateUrl({ visit: undefined, reschedule: selectedVisit.id })
                }
                onCancel={() =>
                    selectedVisit &&
                    void visitActions.cancel
                        .mutateAsync(selectedVisit.id)
                        .then(() => {
                            setActionError(undefined);
                            toast.success("Visit cancelled");
                            updateUrl({ visit: undefined });
                        })
                        .catch((error) =>
                            setActionError(
                                error instanceof Error
                                    ? error.message
                                    : "Could not cancel this visit. Check your connection and try again.",
                            ),
                        )
                }
                onChecklist={(value) =>
                    selectedVisit && visitActions.checklist(selectedVisit.id, value)
                }
            />

            <OutcomeModal
                open={Boolean(outcomeVisit)}
                visit={outcomeVisit}
                onClose={() => updateUrl({ outcome: undefined })}
                onSave={async (outcome) => {
                    if (!outcomeVisit) return;
                    await visitActions.outcome.mutateAsync({ visit: outcomeVisit, outcome });
                    toast.success("Outcome logged");
                    if (outcome.nextStep === "show_other_property")
                        updateUrl({
                            outcome: undefined,
                            tab: "slots",
                            buyer: outcomeVisit.buyers[0]?.id,
                        });
                    else updateUrl({ outcome: undefined });
                }}
            />

            <RescheduleModal
                key={`${rescheduleVisit?.id ?? "none"}-${rescheduleVisit?.startsAt ?? ""}`}
                open={Boolean(rescheduleVisit)}
                visit={rescheduleVisit}
                propertySlots={rescheduleSlots}
                onClose={() => updateUrl({ reschedule: undefined })}
                onSave={async (startsAt, endsAt) => {
                    if (!rescheduleVisit) return;
                    await visitActions.reschedule.mutateAsync({
                        id: rescheduleVisit.id,
                        startsAt,
                        endsAt,
                    });
                    toast.success("Reschedule sent to owner");
                    updateUrl({ reschedule: undefined });
                }}
            />
        </main>
    );
}
