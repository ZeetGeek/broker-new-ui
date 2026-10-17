"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

import { useQuery } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { slotListFiltersFromParams } from "@/lib/visits/filters";
import { buildVisitSummary } from "@/lib/visits/summary";
import { istDateKey } from "@/lib/visits/time";
import { useSiteVisits } from "@/hooks/use-site-visits";
import { useSlots } from "@/hooks/use-slots";
import { useTimeRequests } from "@/hooks/use-time-requests";
import { useVisitActions } from "@/hooks/use-visit-actions";
import { useVisitSummary } from "@/hooks/use-visit-summary";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";

import type { BrokerVisitsTab, SummaryFilter } from "@/features/site-visits/broker/model";
import { MyVisitsTab } from "@/features/site-visits/broker/my-visits/my-visits-tab";
import {
    countOpenSlotFilters,
    OpenSlotsTab,
    readOpenSlotFilters,
} from "@/features/site-visits/broker/open-slots/open-slots-tab";
import { BookingDrawer } from "@/features/site-visits/broker/panels/booking-drawer";
import { RescheduleModal } from "@/features/site-visits/broker/panels/reschedule-modal";
import { VisitDetailPanel } from "@/features/site-visits/broker/panels/visit-detail-panel";
import { RequestsTab } from "@/features/site-visits/broker/requests/requests-tab";
import { VisitsFocusFiltersDialog } from "@/features/site-visits/broker/visits-focus-filters";
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
    const buyerId = searchParams.get("buyer") ?? undefined;
    const visitsQuery = useSiteVisits();
    const slotFilters = useMemo(
        () => slotListFiltersFromParams(new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const slotsQuery = useSlots(true, slotFilters);
    const slotItems = useMemo(
        () => slotsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [slotsQuery.data],
    );
    const propertyOptions = slotsQuery.data?.pages[0]?.propertyOptions ?? [];
    const ownerOptions = slotsQuery.data?.pages[0]?.ownerOptions ?? [];
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
    const [slotFiltersOpen, setSlotFiltersOpen] = useState(false);
    const [visitFiltersOpen, setVisitFiltersOpen] = useState(false);
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
        for (const item of slotItems) {
            const slot = item.slots.find((candidate) => candidate.id === bookValue);
            if (slot) return { item, slot };
        }
        return undefined;
    })();
    const visitId = searchParams.get("visit") ?? undefined;
    const outcomeId = searchParams.get("outcome") ?? undefined;
    const rescheduleId = searchParams.get("reschedule") ?? undefined;
    const allVisits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
    const displaySlotItems = useMemo(() => {
        const visitsById = new Map(allVisits.map((visit) => [visit.id, visit]));
        const visitsBySlot = new Map(
            allVisits
                .filter((visit) => visit.slotId)
                .map((visit) => [visit.slotId as string, visit]),
        );

        const propertyIds = new Set(slotItems.map((item) => item.property.id));

        const mergedItems = slotItems.map((item) => {
            const slots = item.slots.map((slot) => {
                const visit =
                    (slot.bookedVisitId ? visitsById.get(slot.bookedVisitId) : undefined) ??
                    visitsBySlot.get(slot.id) ??
                    allVisits.find(
                        (candidate) =>
                            candidate.propertyId === item.property.id &&
                            candidate.startsAt === slot.startsAt &&
                            candidate.status !== "cancelled_by_broker" &&
                            candidate.status !== "cancelled_by_owner" &&
                            candidate.status !== "expired",
                    );
                if (!visit) return slot;
                const buyerNames =
                    slot.bookedBuyerName ??
                    visit.buyers
                        .map((buyer) => buyer.name.trim())
                        .filter(Boolean)
                        .join(", ");
                return {
                    ...slot,
                    bookedVisitId: slot.bookedVisitId ?? visit.id,
                    bookedBuyerName: buyerNames || "Your buyer",
                    bookedBuyerAvatarUrl: slot.bookedBuyerAvatarUrl ?? visit.buyers[0]?.avatarUrl,
                };
            });

            for (const visit of allVisits) {
                if (
                    visit.propertyId !== item.property.id ||
                    visit.status === "cancelled_by_broker" ||
                    visit.status === "cancelled_by_owner" ||
                    visit.status === "expired"
                ) {
                    continue;
                }
                const alreadyShown = slots.some(
                    (slot) =>
                        slot.bookedVisitId === visit.id ||
                        (visit.slotId != null && slot.id === visit.slotId) ||
                        slot.startsAt === visit.startsAt,
                );
                if (alreadyShown) continue;

                const date = istDateKey(visit.startsAt);
                if (
                    (slotFilters.from && date < slotFilters.from) ||
                    (slotFilters.to && date > slotFilters.to)
                ) {
                    continue;
                }
                const buyerNames =
                    visit.buyers
                        .map((buyer) => buyer.name.trim())
                        .filter(Boolean)
                        .join(", ") || "Your buyer";
                slots.push({
                    id: visit.slotId ?? `booked-${visit.id}`,
                    propertyId: visit.propertyId,
                    ownerId: visit.ownerId,
                    startsAt: visit.startsAt,
                    endsAt: visit.endsAt,
                    capacity: 1,
                    bookedCount: 1,
                    status: "full",
                    visibility: "accepted_brokers",
                    autoConfirm: visit.status === "confirmed",
                    note: visit.ownerNote,
                    bookedVisitId: visit.id,
                    bookedBuyerName: buyerNames,
                    bookedBuyerAvatarUrl: visit.buyers[0]?.avatarUrl,
                });
            }

            return {
                ...item,
                slots: slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
            };
        });

        // Properties with a booked visit but no remaining open slots still need a card.
        for (const visit of allVisits) {
            if (
                propertyIds.has(visit.propertyId) ||
                visit.status === "cancelled_by_broker" ||
                visit.status === "cancelled_by_owner" ||
                visit.status === "expired"
            ) {
                continue;
            }
            const date = istDateKey(visit.startsAt);
            if (
                (slotFilters.from && date < slotFilters.from) ||
                (slotFilters.to && date > slotFilters.to)
            ) {
                continue;
            }
            if (new Date(visit.startsAt).getTime() < now.getTime()) continue;

            const buyerNames =
                visit.buyers
                    .map((buyer) => buyer.name.trim())
                    .filter(Boolean)
                    .join(", ") || "Your buyer";
            propertyIds.add(visit.propertyId);
            mergedItems.push({
                property: visit.property,
                propertySource: visit.propertySource,
                owner: visit.owner,
                access: "accepted",
                slots: [
                    {
                        id: visit.slotId ?? `booked-${visit.id}`,
                        propertyId: visit.propertyId,
                        ownerId: visit.ownerId,
                        startsAt: visit.startsAt,
                        endsAt: visit.endsAt,
                        capacity: 1,
                        bookedCount: 1,
                        status: "full",
                        visibility: "accepted_brokers",
                        autoConfirm: visit.status === "confirmed",
                        note: visit.ownerNote,
                        bookedVisitId: visit.id,
                        bookedBuyerName: buyerNames,
                        bookedBuyerAvatarUrl: visit.buyers[0]?.avatarUrl,
                    },
                ],
            });
        }

        return mergedItems;
    }, [allVisits, now, slotFilters.from, slotFilters.to, slotItems]);
    const selectedVisit = allVisits.find((visit) => visit.id === visitId);
    const outcomeVisit = allVisits.find((visit) => visit.id === outcomeId);
    const rescheduleVisit = allVisits.find((visit) => visit.id === rescheduleId);
    const rescheduleSlots = slotItems.find(
        (item) => item.property.id === rescheduleVisit?.property.id,
    );
    const summary = useMemo(() => {
        return buildVisitSummary(allVisits, slotItems, requestsQuery.data ?? [], now);
    }, [allVisits, now, requestsQuery.data, slotItems]);

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
    const openSlotFilters = useMemo(
        () => readOpenSlotFilters(new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const openSlotFilterCount = useMemo(
        () => countOpenSlotFilters(openSlotFilters, buyerId, slotFilters.propertyId),
        [buyerId, openSlotFilters, slotFilters.propertyId],
    );
    const filtersCount = tab === "slots" ? openSlotFilterCount : focus ? 1 : 0;
    const slotQuery = searchParams.get("q") ?? "";
    const visitDateRange =
        searchParams.get("range") === "today" ||
        searchParams.get("range") === "tomorrow" ||
        searchParams.get("range") === "week" ||
        searchParams.get("range") === "month" ||
        searchParams.get("range") === "custom"
            ? openSlotFilters.range
            : "all";

    return (
        <main className="flex flex-col gap-6 pbe-24 md:pbe-10">
            <PortalSectionNav>
                <BrokerVisitsHeader summary={summary} />
            </PortalSectionNav>

            <VisitsTabs
                value={tab}
                counts={counts}
                filtersCount={filtersCount}
                onChange={(next) => {
                    setSlotFiltersOpen(false);
                    setVisitFiltersOpen(false);
                    updateUrl({ tab: next, focus: undefined });
                }}
                onFilters={() => {
                    if (tab === "slots") setSlotFiltersOpen(true);
                    else setVisitFiltersOpen(true);
                }}
                rangeToolbar={{
                    query: slotQuery,
                    onQueryChange: (next) =>
                        updateUrl({
                            tab,
                            q: next.trim() || undefined,
                        }),
                    range: openSlotFilters.range,
                    customFrom: openSlotFilters.customFrom,
                    customTo: openSlotFilters.customTo,
                    onRangeChange: (next) =>
                        updateUrl({
                            tab,
                            range:
                                tab === "slots"
                                    ? next.range === "week"
                                        ? undefined
                                        : next.range
                                    : next.range,
                            from:
                                next.range === "custom" ? next.customFrom || undefined : undefined,
                            to: next.range === "custom" ? next.customTo || undefined : undefined,
                        }),
                    ...(tab === "visits"
                        ? {
                              searchId: "visit-search",
                              searchPlaceholder: "Search visits",
                              searchAriaLabel: "Search my visits",
                              customDescription:
                                  "Choose a start date and an end date for your visits.",
                          }
                        : tab === "requests"
                          ? {
                                searchId: "request-search",
                                searchPlaceholder: "Search requests",
                                searchAriaLabel: "Search visit requests",
                                customDescription:
                                    "Choose a start date and an end date for your requests.",
                            }
                          : {}),
                }}
            />
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
                        query={slotQuery}
                        range={visitDateRange}
                        customFrom={openSlotFilters.customFrom}
                        customTo={openSlotFilters.customTo}
                        onOpen={(id) => updateUrl({ visit: id })}
                        onAction={handleVisitAction}
                        onBrowseSlots={() => updateUrl({ tab: "slots" })}
                        onClearQuery={() => updateUrl({ tab: "visits", q: undefined })}
                        onClearRange={() =>
                            updateUrl({
                                tab: "visits",
                                range: undefined,
                                from: undefined,
                                to: undefined,
                            })
                        }
                        onClearFocus={() => updateUrl({ tab: "visits", focus: undefined })}
                        onClearFilters={() =>
                            updateUrl({
                                tab: "visits",
                                q: undefined,
                                range: undefined,
                                from: undefined,
                                to: undefined,
                                focus: undefined,
                            })
                        }
                    />
                ) : tab === "slots" ? (
                    <OpenSlotsTab
                        key={searchParams.get("q") ?? ""}
                        items={displaySlotItems}
                        propertyOptions={propertyOptions}
                        ownerOptions={ownerOptions}
                        selectedPropertyId={slotFilters.propertyId}
                        buyers={buyers}
                        buyerId={buyerId}
                        isLoading={slotsQuery.isLoading}
                        isError={slotsQuery.isError}
                        isFetchingMore={slotsQuery.isFetchingNextPage}
                        hasMore={Boolean(slotsQuery.hasNextPage)}
                        updatedAt={slotsQuery.dataUpdatedAt}
                        filtersOpen={slotFiltersOpen}
                        onFiltersOpenChange={setSlotFiltersOpen}
                        onBuyerChange={(id) => updateUrl({ buyer: id })}
                        onPropertyChange={(id) => updateUrl({ propertyId: id, tab: "slots" })}
                        onBook={(slot) => updateUrl({ book: slot.id })}
                        onOpenVisit={(id) => updateUrl({ tab: "visits", visit: id })}
                        onRequest={() => updateUrl({ tab: "slots", book: "ready" })}
                        onRefresh={() => void slotsQuery.refetch()}
                        onLoadMore={() => void slotsQuery.fetchNextPage()}
                        rowErrors={rowErrors}
                    />
                ) : (
                    <RequestsTab
                        requests={requestsQuery.data ?? []}
                        isLoading={requestsQuery.isLoading}
                        query={slotQuery}
                        range={visitDateRange}
                        customFrom={openSlotFilters.customFrom}
                        customTo={openSlotFilters.customTo}
                        onNew={() => updateUrl({ tab: "slots", book: "ready" })}
                        onRetry={(propertyId, retryBuyerId) =>
                            updateUrl({ tab: "slots", book: "ready", buyer: retryBuyerId })
                        }
                        onViewVisit={(id) => updateUrl({ tab: "visits", visit: id })}
                        onClearQuery={() => updateUrl({ tab: "requests", q: undefined })}
                        onClearRange={() =>
                            updateUrl({
                                tab: "requests",
                                range: undefined,
                                from: undefined,
                                to: undefined,
                            })
                        }
                        onClearFilters={() =>
                            updateUrl({
                                tab: "requests",
                                q: undefined,
                                range: undefined,
                                from: undefined,
                                to: undefined,
                            })
                        }
                    />
                )}
            </div>

            <VisitsFocusFiltersDialog
                open={visitFiltersOpen}
                onOpenChange={setVisitFiltersOpen}
                summary={summary}
                active={focus}
                onApply={(next) => updateUrl({ tab: "visits", focus: next })}
            />

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
