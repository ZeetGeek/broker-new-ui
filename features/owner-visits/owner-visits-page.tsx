"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import {
    type OwnerShowingFocus,
    type OwnerShowingsSummary,
    ownerSlotsApi,
    SlotRangeCrossesUtcDayError,
    type VisitShowing,
    type VisitSlot,
} from "@/lib/api/owner-slots";
import { propertiesApi, type PropertyListing } from "@/lib/api/properties";
import { formatDateIso, formatTime24, toApiInstantFromLocalParts } from "@/lib/format/date";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppPagination } from "@/components/shared/app-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";

import { AddTimeDialog } from "@/features/owner-visits/add-time-dialog";
import {
    addMinutes,
    isExpiredSlot,
    slotStartKey,
} from "@/features/owner-visits/availability-helpers";
import { OwnerPropertyAvailabilityRow } from "@/features/owner-visits/owner-property-availability-row";
import { OwnerScheduledFilters } from "@/features/owner-visits/scheduled-filters";
import { ShowingRow } from "@/features/owner-visits/showing-row";

/*
 * Bulk / multi-date / preset availability UI is parked for now.
 * See availability-add-form.tsx, availability-presets.tsx, availability-dates-picker.tsx
 * and the commented QUICK_PRESETS block in availability-helpers.ts.
 */

type VisitsTab = "availability" | "scheduled";

const SHOWING_PAGE_SIZES = [10, 20, 30, 50] as const;
const EMPTY_SHOWINGS_SUMMARY: OwnerShowingsSummary = {
    total: 0,
    today: 0,
    tomorrow: 0,
    awaitingOwner: 0,
    confirmed: 0,
    week: 0,
    cancelled: 0,
};

const FOCUS_KEYS: OwnerShowingFocus[] = [
    "today",
    "tomorrow",
    "awaiting",
    "confirmed",
    "week",
    "cancelled",
];

function isShowingFocus(value: string | null): value is OwnerShowingFocus {
    return FOCUS_KEYS.includes(value as OwnerShowingFocus);
}

function parseShowingPage(value: string | null) {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseShowingLimit(value: string | null) {
    const limit = Number(value);
    return SHOWING_PAGE_SIZES.includes(limit as (typeof SHOWING_PAGE_SIZES)[number]) ? limit : 10;
}

function isVisitsTab(value: string | null): value is VisitsTab {
    return value === "availability" || value === "scheduled";
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError || error instanceof SlotRangeCrossesUtcDayError
        ? error.message
        : fallback;
}

export function OwnerVisitsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: VisitsTab = isVisitsTab(tabParam) ? tabParam : "availability";
    const focusParam = searchParams.get("focus");
    const showingFocus = isShowingFocus(focusParam) ? focusParam : undefined;
    const showingPage = parseShowingPage(searchParams.get("page"));
    const showingLimit = parseShowingLimit(searchParams.get("limit"));

    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const [properties, setProperties] = useState<PropertyListing[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(true);

    const [slots, setSlots] = useState<VisitSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [showings, setShowings] = useState<VisitShowing[]>([]);
    const [showingsTotal, setShowingsTotal] = useState(0);
    const [showingsPages, setShowingsPages] = useState(1);
    const [showingsSummary, setShowingsSummary] =
        useState<OwnerShowingsSummary>(EMPTY_SHOWINGS_SUMMARY);
    const [showingsLoading, setShowingsLoading] = useState(false);

    const [addTimePropertyId, setAddTimePropertyId] = useState<string | null>(null);
    const [addTimeDate, setAddTimeDate] = useState(() => formatDateIso(new Date()));

    const todayIso = formatDateIso(new Date());
    const nowTime = formatTime24(new Date());

    const replaceVisitParams = useCallback(
        (patch: Record<string, string | undefined>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(patch)) {
                if (!value) params.delete(key);
                else params.set(key, value);
            }
            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    const setTab = useCallback(
        (next: VisitsTab) => {
            replaceVisitParams({ tab: next === "availability" ? undefined : next });
        },
        [replaceVisitParams],
    );

    const setShowingFocus = useCallback(
        (next?: OwnerShowingFocus) => {
            replaceVisitParams({
                tab: "scheduled",
                focus: next,
                page: undefined,
            });
        },
        [replaceVisitParams],
    );

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            setPropertiesLoading(true);
            void propertiesApi
                .list({ limit: 100 })
                .then((page) => {
                    if (!cancelled) setProperties(page.items);
                })
                .catch((err) => {
                    if (!cancelled) toast.error(apiMessage(err, "Could not load properties"));
                })
                .finally(() => {
                    if (!cancelled) setPropertiesLoading(false);
                });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            setSlotsLoading(true);
            void ownerSlotsApi
                .list({ limit: 200 })
                .then((page) => {
                    if (!cancelled) setSlots(page.items);
                })
                .catch((err) => {
                    if (!cancelled) {
                        toast.error(apiMessage(err, "Could not load slots"));
                        setSlots([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) setSlotsLoading(false);
                });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            cancelled = true;
        };
    }, [revision]);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            setShowingsLoading(true);
            void ownerSlotsApi
                .showings({
                    focus: showingFocus,
                    page: showingPage,
                    limit: showingLimit,
                })
                .then((page) => {
                    if (!cancelled) {
                        setShowings(page.items);
                        setShowingsTotal(page.total);
                        setShowingsPages(page.totalPages);
                        setShowingsSummary(page.summary ?? EMPTY_SHOWINGS_SUMMARY);
                        if (page.totalPages > 0 && showingPage > page.totalPages) {
                            replaceVisitParams({ page: String(page.totalPages) });
                        }
                    }
                })
                .catch((err) => {
                    if (!cancelled) {
                        toast.error(apiMessage(err, "Could not load showings"));
                        setShowings([]);
                        setShowingsTotal(0);
                        setShowingsPages(1);
                        setShowingsSummary(EMPTY_SHOWINGS_SUMMARY);
                    }
                })
                .finally(() => {
                    if (!cancelled) setShowingsLoading(false);
                });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            cancelled = true;
        };
    }, [replaceVisitParams, revision, showingFocus, showingLimit, showingPage]);

    const slotsByPropertyId = useMemo(() => {
        const map = new Map<string, VisitSlot[]>();
        for (const slot of slots) {
            const list = map.get(slot.propertyId) ?? [];
            list.push(slot);
            map.set(slot.propertyId, list);
        }
        return map;
    }, [slots]);

    const addTimeProperty = useMemo(
        () => properties.find((item) => item.id === addTimePropertyId) ?? null,
        [addTimePropertyId, properties],
    );

    const addTimePropertySlots = useMemo(
        () => (addTimePropertyId ? (slotsByPropertyId.get(addTimePropertyId) ?? []) : []),
        [addTimePropertyId, slotsByPropertyId],
    );

    const { openTimes, bookedTimes } = useMemo(() => {
        const open = new Set<string>();
        const booked = new Set<string>();
        for (const slot of addTimePropertySlots) {
            const key = slotStartKey(slot);
            if (!key) continue;
            const [dateIso, time] = key.split("|");
            if (dateIso !== addTimeDate) continue;
            if (slot.status === "booked") booked.add(time);
            else if (slot.status === "open") open.add(time);
        }
        return { openTimes: open, bookedTimes: booked };
    }, [addTimeDate, addTimePropertySlots]);

    const removeSlot = useCallback(async (slot: VisitSlot) => {
        if (slot.status === "booked") {
            toast.error("This time is already booked.");
            return;
        }
        setRemovingId(slot.id);
        try {
            await ownerSlotsApi.remove(slot.id);
            toast.success("Slot closed");
            setRevision((value) => value + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not close slot"));
        } finally {
            setRemovingId(null);
        }
    }, []);

    const toggleDialogTime = useCallback(
        async (time: string) => {
            if (!addTimePropertyId) return;
            const key = `${addTimeDate}|${time}`;
            if (bookedTimes.has(time)) {
                toast.error("This time is already booked.");
                return;
            }
            if (isExpiredSlot(addTimeDate, time, todayIso, nowTime)) return;

            const existing = addTimePropertySlots.find((slot) => slotStartKey(slot) === key);
            setTogglingKey(time);
            try {
                if (existing && existing.status === "open") {
                    await ownerSlotsApi.remove(existing.id);
                    toast.success("Slot closed");
                } else if (!existing) {
                    await ownerSlotsApi.create({
                        propertyId: addTimePropertyId,
                        startAt: toApiInstantFromLocalParts(addTimeDate, time),
                        endAt: toApiInstantFromLocalParts(addTimeDate, addMinutes(time, 30)),
                    });
                    toast.success("Slot opened");
                }
                setRevision((value) => value + 1);
            } catch (err) {
                toast.error(
                    apiMessage(err, existing ? "Could not close slot" : "Could not open slot"),
                );
            } finally {
                setTogglingKey(null);
            }
        },
        [addTimeDate, addTimePropertyId, addTimePropertySlots, bookedTimes, nowTime, todayIso],
    );

    const openAddTime = useCallback((propertyId: string) => {
        setAddTimePropertyId(propertyId);
        setAddTimeDate(formatDateIso(new Date()));
    }, []);

    const runShowingAction = useCallback(
        async (showingId: string, status: "confirmed" | "cancelled") => {
            setBusyId(showingId);
            try {
                await ownerSlotsApi.updateShowingStatus(showingId, status);
                toast.success(status === "confirmed" ? "Visit confirmed" : "Visit cancelled");
                setRevision((value) => value + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Could not update showing"));
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    let panel: ReactNode;

    if (tab === "availability") {
        if (propertiesLoading) {
            panel = (
                <div className="flex justify-center py-16">
                    <LoadingSpinner label="Loading properties" />
                </div>
            );
        } else if (properties.length === 0) {
            panel = (
                <EmptyState
                    icon={CalendarDays}
                    heading="Add a property first"
                    description="Visit slots are tied to your listings."
                />
            );
        } else {
            panel = (
                <div className={cn("flex flex-col gap-3", slotsLoading && "opacity-70")}>
                    <p className="body-sm text-ink-muted">
                        {properties.length} {properties.length === 1 ? "property" : "properties"} —
                        open visiting times brokers can book.
                    </p>
                    {properties.map((property) => (
                        <OwnerPropertyAvailabilityRow
                            key={property.id}
                            property={property}
                            slots={slotsByPropertyId.get(property.id) ?? []}
                            removingId={removingId}
                            onAddTime={() => openAddTime(property.id)}
                            onRemoveSlot={(slot) => void removeSlot(slot)}
                        />
                    ))}
                </div>
            );
        }
    } else {
        const scheduledList =
            showingsLoading && showings.length === 0 ? (
                <div className="flex justify-center py-16">
                    <LoadingSpinner label="Loading showings" />
                </div>
            ) : showings.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    heading={showingFocus ? "No visits in this filter" : "No scheduled showings"}
                    description={
                        showingFocus
                            ? "Try another filter, or clear it to see every scheduled visit."
                            : "When brokers book your slots, they'll appear here."
                    }
                >
                    {showingFocus ? (
                        <Button variant="outline" onClick={() => setShowingFocus(undefined)}>
                            Clear filter
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setTab("availability")}>
                            Manage availability
                        </Button>
                    )}
                </EmptyState>
            ) : (
                <ul className={cn("flex flex-col gap-3", showingsLoading && "opacity-60")}>
                    {showings.map((showing) => (
                        <li key={showing.id}>
                            <ShowingRow
                                showing={showing}
                                busy={busyId === showing.id}
                                onConfirm={() => void runShowingAction(showing.id, "confirmed")}
                                onCancel={() => void runShowingAction(showing.id, "cancelled")}
                            />
                        </li>
                    ))}
                </ul>
            );

        panel = (
            <div className="flex flex-col gap-4">
                <OwnerScheduledFilters
                    summary={showingsSummary}
                    active={showingFocus}
                    isLoading={showingsLoading && showings.length === 0}
                    onChange={setShowingFocus}
                />
                {scheduledList}
                {showingsTotal >= 10 && showingsPages > 1 ? (
                    <AppPagination
                        page={showingPage}
                        totalPages={showingsPages}
                        pageSize={showingLimit}
                        pageSizeOptions={SHOWING_PAGE_SIZES}
                        aria-label="Scheduled visits"
                        onPageChange={(page) =>
                            replaceVisitParams({ page: page <= 1 ? undefined : String(page) })
                        }
                        onPageSizeChange={(limit) =>
                            replaceVisitParams({
                                limit: limit === 10 ? undefined : String(limit),
                                page: undefined,
                            })
                        }
                    />
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pbe-24 md:pbe-10">
            <PortalSectionNav>
                <div className="flex flex-col gap-3 text-start">
                    <h1 className="h3 text-ink">
                        Site visits.{" "}
                        <span className="text-ink-muted">
                            Manage availability and scheduled property visits
                        </span>
                    </h1>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Site visits">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "availability"}
                            onClick={() => setTab("availability")}
                            className={cn(
                                "body-sm rounded-full px-4 py-2 font-semibold",
                                tab === "availability"
                                    ? "bg-brand-ink text-surface"
                                    : "border border-border-warm bg-surface text-ink",
                            )}
                        >
                            Availability
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === "scheduled"}
                            onClick={() => setTab("scheduled")}
                            className={cn(
                                "body-sm rounded-full px-4 py-2 font-semibold",
                                tab === "scheduled"
                                    ? "bg-brand-ink text-surface"
                                    : "border border-border-warm bg-surface text-ink",
                            )}
                        >
                            Scheduled ({showingsSummary.total})
                        </button>
                    </div>
                </div>
            </PortalSectionNav>

            {panel}

            {addTimeProperty ? (
                <AddTimeDialog
                    open={addTimePropertyId != null}
                    onOpenChange={(open) => {
                        if (!open) setAddTimePropertyId(null);
                    }}
                    propertyLabel={
                        addTimeProperty.title?.trim() ||
                        addTimeProperty.city?.trim() ||
                        "this property"
                    }
                    selectedDate={addTimeDate}
                    onDateChange={setAddTimeDate}
                    openTimes={openTimes}
                    bookedTimes={bookedTimes}
                    togglingTime={togglingKey}
                    onToggleTime={(time) => void toggleDialogTime(time)}
                />
            ) : null}
        </div>
    );
}
