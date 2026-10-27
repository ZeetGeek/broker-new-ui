"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

import { useQuery } from "@tanstack/react-query";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { parsePropertyCriteria, propertyCriteriaCount } from "@/lib/properties/list-criteria";
import { slotListFiltersFromParams } from "@/lib/visits/filters";
import { matchesVisitProperty } from "@/lib/visits/property-filters";
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
import { BrokerVisitsHeader } from "@/features/site-visits/broker/visits-header";
import { VisitsPropertyFiltersDialog } from "@/features/site-visits/broker/visits-property-filters";
import { VisitsTabs, type VisitInventory } from "@/features/site-visits/broker/visits-tabs";

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
    const inventory: VisitInventory =
        !FEATURE_PLATFORM_OWNER || searchParams.get("inventory") === "exclusive"
            ? "exclusive"
            : "platform";
    const rawTab: BrokerVisitsTab = isTab(tabValue) ? tabValue : "visits";
    const tab: BrokerVisitsTab =
        inventory === "exclusive" && rawTab === "requests" ? "slots" : rawTab;
    const focus: SummaryFilter | undefined = isSummaryFilter(focusValue) ? focusValue : undefined;
    const buyerId = searchParams.get("buyer") ?? undefined;
    const visitsQuery = useSiteVisits();
    const slotFilters = useMemo(
        () => slotListFiltersFromParams(new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const slotsQuery = useSlots(FEATURE_PLATFORM_OWNER, slotFilters);
    const exclusiveSlotsQuery = useSlots(inventory === "exclusive", slotFilters, "exclusive");
    const slotItems = useMemo(
        () => slotsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [slotsQuery.data],
    );
    const exclusiveSlotItems = useMemo(
        () => exclusiveSlotsQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [exclusiveSlotsQuery.data],
    );
    const activeSlotQuery = inventory === "exclusive" ? exclusiveSlotsQuery : slotsQuery;
    const activeSlotItems = inventory === "exclusive" ? exclusiveSlotItems : slotItems;
    const propertyOptions = activeSlotQuery.data?.pages[0]?.propertyOptions ?? [];
    const ownerOptions = activeSlotQuery.data?.pages[0]?.ownerOptions ?? [];
    const leadOptions = activeSlotQuery.data?.pages[0]?.leadOptions ?? [];
    const selectedLead = leadOptions.find((option) => option.id === slotFilters.leadId);
    const requestsQuery = useTimeRequests(FEATURE_PLATFORM_OWNER);
    useVisitSummary(FEATURE_PLATFORM_OWNER);
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
    const propertyFiltersParam = searchParams.get("propertyFilters");
    const propertyFilters = useMemo(
        () => parsePropertyCriteria(propertyFiltersParam ?? undefined),
        [propertyFiltersParam],
    );
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
        for (const item of activeSlotItems) {
            const slot = item.slots.find((candidate) => candidate.id === bookValue);
            if (slot) return { item, slot };
        }
        return undefined;
    })();
    const visitId = searchParams.get("visit") ?? undefined;
    const outcomeId = searchParams.get("outcome") ?? undefined;
    const rescheduleId = searchParams.get("reschedule") ?? undefined;
    const allVisits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
    const inventoryVisits = useMemo(
        () =>
            allVisits.filter((visit) =>
                inventory === "exclusive"
                    ? visit.propertySource === "own_listing"
                    : visit.propertySource !== "own_listing",
            ),
        [allVisits, inventory],
    );
    const displaySlotItems = useMemo(() => {
        const visitsById = new Map(inventoryVisits.map((visit) => [visit.id, visit]));
        const visitsBySlot = new Map(
            inventoryVisits
                .filter((visit) => visit.slotId)
                .map((visit) => [visit.slotId as string, visit]),
        );

        const propertyIds = new Set(slotItems.map((item) => item.property.id));

        const mergedItems = slotItems.map((item) => {
            const slots = item.slots.map((slot) => {
                const visit =
                    (slot.bookedVisitId ? visitsById.get(slot.bookedVisitId) : undefined) ??
                    visitsBySlot.get(slot.id) ??
                    inventoryVisits.find(
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

            for (const visit of inventoryVisits) {
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
        for (const visit of inventoryVisits) {
            if (
                propertyIds.has(visit.propertyId) ||
                (slotFilters.propertyId && visit.propertyId !== slotFilters.propertyId) ||
                (slotFilters.leadId && visit.propertyId !== selectedLead?.propertyId) ||
                (slotFilters.ownerId && visit.ownerId !== slotFilters.ownerId) ||
                (slotFilters.buyerId && !visit.buyerIds.includes(slotFilters.buyerId)) ||
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
    }, [inventoryVisits, now, selectedLead?.propertyId, slotFilters, slotItems]);
    const selectedVisit = allVisits.find((visit) => visit.id === visitId);
    const outcomeVisit = allVisits.find((visit) => visit.id === outcomeId);
    const rescheduleVisit = allVisits.find((visit) => visit.id === rescheduleId);
    const rescheduleSlots = slotItems.find(
        (item) => item.property.id === rescheduleVisit?.property.id,
    );
    const summary = useMemo(() => {
        if (inventory === "exclusive") {
            return buildVisitSummary(inventoryVisits, exclusiveSlotItems, [], now);
        }
        return buildVisitSummary(inventoryVisits, slotItems, requestsQuery.data ?? [], now);
    }, [exclusiveSlotItems, inventory, inventoryVisits, now, requestsQuery.data, slotItems]);

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
        () =>
            countOpenSlotFilters(
                openSlotFilters,
                buyerId,
                slotFilters.propertyId,
                slotFilters.leadId,
            ),
        [buyerId, openSlotFilters, slotFilters.leadId, slotFilters.propertyId],
    );
    const filtersCount =
        tab === "slots" ? openSlotFilterCount : propertyCriteriaCount(propertyFilters);
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
                inventory={inventory}
                onInventoryChange={(next) =>
                    updateUrl({
                        inventory: next === "exclusive" ? "exclusive" : undefined,
                        tab: next === "exclusive" && tab === "requests" ? "slots" : tab,
                        book: undefined,
                        focus: undefined,
                        owner: undefined,
                        propertyId: undefined,
                        lead: undefined,
                    })
                }
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
                onClearFilters={() => {
                    if (tab === "slots") {
                        updateUrl({
                            tab: "slots",
                            buyer: undefined,
                            propertyId: undefined,
                            owner: undefined,
                            lead: undefined,
                        });
                    } else {
                        updateUrl({ focus: undefined, propertyFilters: undefined });
                    }
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
                    ...(inventory === "exclusive" && tab === "slots"
                        ? {
                              searchId: "exclusive-slot-search",
                              searchPlaceholder: "Search slots",
                              searchAriaLabel: "Search exclusive visit slots",
                              customDescription:
                                  "Choose a start date and an end date for bookable times.",
                          }
                        : {}),
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
                    tab === "visits"
                        ? "My visits"
                        : tab === "slots"
                          ? inventory === "exclusive"
                              ? "Book slots"
                              : "Open slots"
                          : "Requests"
                }
            >
                {tab === "visits" ? (
                    <MyVisitsTab
                        visits={inventoryVisits}
                        propertyFilters={propertyFilters}
                        isLoading={visitsQuery.isLoading}
                        focus={focus}
                        query={slotQuery}
                        range={visitDateRange}
                        customFrom={openSlotFilters.customFrom}
                        customTo={openSlotFilters.customTo}
                        onOpen={(id) => updateUrl({ visit: id })}
                        onAction={handleVisitAction}
                        onBrowseSlots={() => updateUrl({ tab: "slots" })}
                        browseLabel={inventory === "exclusive" ? "Book a slot" : undefined}
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
                                propertyFilters: undefined,
                            })
                        }
                    />
                ) : tab === "slots" ? (
                    <OpenSlotsTab
                        key={searchParams.get("q") ?? ""}
                        mode={inventory === "exclusive" ? "exclusive" : "platform"}
                        items={inventory === "exclusive" ? exclusiveSlotItems : displaySlotItems}
                        propertyOptions={propertyOptions}
                        ownerOptions={ownerOptions}
                        leadOptions={leadOptions}
                        selectedPropertyId={slotFilters.propertyId}
                        leadId={slotFilters.leadId}
                        buyers={buyers}
                        buyerId={buyerId}
                        isLoading={activeSlotQuery.isLoading}
                        isError={activeSlotQuery.isError}
                        isFetchingMore={activeSlotQuery.isFetchingNextPage}
                        hasMore={Boolean(activeSlotQuery.hasNextPage)}
                        updatedAt={activeSlotQuery.dataUpdatedAt}
                        filtersOpen={slotFiltersOpen}
                        onFiltersOpenChange={setSlotFiltersOpen}
                        onBuyerChange={(id) => updateUrl({ buyer: id })}
                        onPropertyChange={(id) => updateUrl({ propertyId: id, tab: "slots" })}
                        onLeadChange={(id) => updateUrl({ lead: id, tab: "slots" })}
                        onBook={(slot) => updateUrl({ book: slot.id })}
                        onOpenVisit={(id) => updateUrl({ tab: "visits", visit: id })}
                        onRequest={() => updateUrl({ tab: "slots", book: "ready" })}
                        onRefresh={() => void activeSlotQuery.refetch()}
                        onLoadMore={() => void activeSlotQuery.fetchNextPage()}
                        rowErrors={rowErrors}
                    />
                ) : (
                    <RequestsTab
                        requests={(requestsQuery.data ?? []).filter((request) =>
                            matchesVisitProperty(request.property, propertyFilters),
                        )}
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
                                propertyFilters: undefined,
                            })
                        }
                    />
                )}
            </div>

            <VisitsPropertyFiltersDialog
                open={visitFiltersOpen}
                onOpenChange={setVisitFiltersOpen}
                filters={propertyFilters}
                onApply={(next) =>
                    updateUrl({
                        focus: undefined,
                        propertyFilters: propertyCriteriaCount(next)
                            ? JSON.stringify(next)
                            : undefined,
                    })
                }
            />

            <BookingDrawer
                open={Boolean(selectedBooking)}
                item={selectedBooking?.item}
                slot={selectedBooking?.slot}
                buyers={buyers}
                visits={visitsQuery.data ?? []}
                preselectedBuyerId={buyerId ?? selectedLead?.clientId ?? undefined}
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
