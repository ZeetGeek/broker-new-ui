"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CalendarClock, CalendarDays, Plus, Trash2 } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { ownerSlotsApi, type VisitShowing, type VisitSlot } from "@/lib/api/owner-slots";
import { propertiesApi } from "@/lib/api/properties";
import {
    formatDateShort,
    formatTimeIn,
    parseApiInstant,
    toApiInstantFromLocalParts,
} from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type VisitsTab = "availability" | "scheduled";

function isVisitsTab(value: string | null): value is VisitsTab {
    return value === "availability" || value === "scheduled";
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function parseDateList(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of raw.split(/[\n,]+/)) {
        const trimmed = part.trim();
        if (!trimmed || seen.has(trimmed)) continue;
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}

function slotTimeLabel(slot: VisitSlot): string {
    const start = parseApiInstant(slot.startAt);
    const end = parseApiInstant(slot.endAt);
    return `${formatDateShort(start)} · ${formatTimeIn(start)} – ${formatTimeIn(end)}`;
}

function showingWhen(showing: VisitShowing): string {
    const when = parseApiInstant(showing.scheduledDate);
    return `${formatDateShort(when)} · ${formatTimeIn(when)}`;
}

export function OwnerVisitsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: VisitsTab = isVisitsTab(tabParam) ? tabParam : "availability";

    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [properties, setProperties] = useState<{ id: string; label: string }[]>([]);
    const [propertyId, setPropertyId] = useState("");
    const [propertiesLoading, setPropertiesLoading] = useState(true);

    const [slots, setSlots] = useState<VisitSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [showings, setShowings] = useState<VisitShowing[]>([]);
    const [showingsLoading, setShowingsLoading] = useState(false);

    const [singleDate, setSingleDate] = useState("");
    const [singleStart, setSingleStart] = useState("10:00");
    const [singleEnd, setSingleEnd] = useState("10:30");
    const [creatingSlot, setCreatingSlot] = useState(false);

    const [bulkDates, setBulkDates] = useState("");
    const [bulkFrom, setBulkFrom] = useState("10:00");
    const [bulkTo, setBulkTo] = useState("13:00");
    const [bulkLength, setBulkLength] = useState<30 | 60>(30);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const setTab = useCallback(
        (next: VisitsTab) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === "availability") params.delete("tab");
            else params.set("tab", next);
            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    useEffect(() => {
        let cancelled = false;
        setPropertiesLoading(true);
        void propertiesApi
            .list({ limit: 100 })
            .then((page) => {
                if (cancelled) return;
                const options = page.items.map((item) => ({
                    id: item.id,
                    label: item.title?.trim() || item.city || "Untitled listing",
                }));
                setProperties(options);
                if (options[0]?.id) setPropertyId((current) => current || options[0].id);
            })
            .catch((err) => {
                if (!cancelled) toast.error(apiMessage(err, "Could not load properties"));
            })
            .finally(() => {
                if (!cancelled) setPropertiesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (tab !== "availability" || !propertyId) {
            setSlots([]);
            return;
        }
        let cancelled = false;
        setSlotsLoading(true);
        void ownerSlotsApi
            .list({ propertyId, status: "open", limit: 50 })
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
        return () => {
            cancelled = true;
        };
    }, [tab, propertyId, revision]);

    useEffect(() => {
        if (tab !== "scheduled") return;
        let cancelled = false;
        setShowingsLoading(true);
        void ownerSlotsApi
            .showings({ limit: 50 })
            .then((page) => {
                if (!cancelled) setShowings(page.items);
            })
            .catch((err) => {
                if (!cancelled) {
                    toast.error(apiMessage(err, "Could not load showings"));
                    setShowings([]);
                }
            })
            .finally(() => {
                if (!cancelled) setShowingsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [tab, revision]);

    const createSingleSlot = useCallback(async () => {
        if (!propertyId || !singleDate || !singleStart || !singleEnd) {
            toast.error("Fill in date, start, and end time.");
            return;
        }
        setCreatingSlot(true);
        try {
            await ownerSlotsApi.create({
                propertyId,
                startAt: toApiInstantFromLocalParts(singleDate, singleStart),
                endAt: toApiInstantFromLocalParts(singleDate, singleEnd),
            });
            toast.success("Slot added");
            setRevision((v) => v + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not create slot"));
        } finally {
            setCreatingSlot(false);
        }
    }, [propertyId, singleDate, singleStart, singleEnd]);

    const createBulkSlots = useCallback(async () => {
        const dates = parseDateList(bulkDates);
        if (!propertyId || dates.length === 0) {
            toast.error("Add at least one date (YYYY-MM-DD).");
            return;
        }
        setBulkSubmitting(true);
        try {
            const result = await ownerSlotsApi.bulkCreate({
                propertyId,
                dates,
                from: bulkFrom,
                to: bulkTo,
                slotLength: bulkLength,
            });
            toast.success(`Created ${result.created} slot${result.created === 1 ? "" : "s"}`);
            setRevision((v) => v + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not bulk-create slots"));
        } finally {
            setBulkSubmitting(false);
        }
    }, [bulkDates, bulkFrom, bulkLength, bulkTo, propertyId]);

    const runSlotAction = useCallback(
        async (slotId: string, action: () => Promise<unknown>, success: string) => {
            setBusyId(slotId);
            try {
                await action();
                toast.success(success);
                setRevision((v) => v + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Could not update slot"));
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const runShowingAction = useCallback(
        async (showingId: string, status: "confirmed" | "cancelled") => {
            setBusyId(showingId);
            try {
                await ownerSlotsApi.updateShowingStatus(showingId, status);
                toast.success(status === "confirmed" ? "Visit confirmed" : "Visit cancelled");
                setRevision((v) => v + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Could not update showing"));
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const tabIntro = useMemo(
        () =>
            tab === "availability"
                ? "Open visit windows brokers can book."
                : "Confirm or cancel scheduled showings.",
        [tab],
    );

    const propertySelect = (
        <label className="flex flex-col gap-1.5">
            <span className="body-sm font-semibold text-ink">Property</span>
            <select
                className="
                  rounded-control border-2 border-border-warm bg-surface px-3.5 block-control-md
                  text-[15px] text-ink inline-full max-inline-md
                "
                value={propertyId}
                disabled={propertiesLoading}
                onChange={(event) => setPropertyId(event.target.value)}
            >
                {properties.length === 0 ? (
                    <option value="">No properties</option>
                ) : (
                    properties.map((property) => (
                        <option key={property.id} value={property.id}>
                            {property.label}
                        </option>
                    ))
                )}
            </select>
        </label>
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
                <div className="flex flex-col gap-6">
                    {propertySelect}

                    <section
                        className="
                          flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
                          shadow-sm
                        "
                    >
                        <h2 className="h6 text-ink">Add one slot</h2>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">Date</span>
                                <Input
                                    type="date"
                                    value={singleDate}
                                    onChange={(event) => setSingleDate(event.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">Start</span>
                                <Input
                                    type="time"
                                    value={singleStart}
                                    onChange={(event) => setSingleStart(event.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">End</span>
                                <Input
                                    type="time"
                                    value={singleEnd}
                                    onChange={(event) => setSingleEnd(event.target.value)}
                                />
                            </label>
                        </div>
                        <Button
                            size="sm"
                            className="self-start"
                            loading={creatingSlot}
                            onClick={() => void createSingleSlot()}
                        >
                            <Plus aria-hidden />
                            Add slot
                        </Button>
                    </section>

                    <section
                        className="
                          flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
                          shadow-sm
                        "
                    >
                        <h2 className="h6 text-ink">Bulk add</h2>
                        <p className="body-sm text-ink-muted">
                            Enter dates as YYYY-MM-DD, separated by commas or new lines.
                        </p>
                        <Textarea
                            value={bulkDates}
                            onChange={(event) => setBulkDates(event.target.value)}
                            placeholder="2026-09-25, 2026-09-26"
                            rows={3}
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">From</span>
                                <Input
                                    type="time"
                                    value={bulkFrom}
                                    onChange={(event) => setBulkFrom(event.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">To</span>
                                <Input
                                    type="time"
                                    value={bulkTo}
                                    onChange={(event) => setBulkTo(event.target.value)}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="body-sm font-semibold text-ink">Slot length</span>
                                <select
                                    className="
                                      rounded-control border-2 border-border-warm bg-surface px-3.5
                                      block-control-md text-[15px] text-ink inline-full
                                    "
                                    value={bulkLength}
                                    onChange={(event) =>
                                        setBulkLength(Number(event.target.value) as 30 | 60)
                                    }
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </select>
                            </label>
                        </div>
                        <Button
                            size="sm"
                            variant="surface"
                            className="self-start"
                            loading={bulkSubmitting}
                            onClick={() => void createBulkSlots()}
                        >
                            Create slots
                        </Button>
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="h6 text-ink">Open slots</h2>
                        {slotsLoading && slots.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner label="Loading slots" />
                            </div>
                        ) : slots.length === 0 ? (
                            <EmptyState
                                icon={CalendarClock}
                                heading="No open slots"
                                description="Add availability so brokers can book visits."
                            />
                        ) : (
                            <ul
                                className={cn(
                                    "flex flex-col gap-2",
                                    slotsLoading && "opacity-60",
                                )}
                            >
                                {slots.map((slot) => (
                                    <li
                                        key={slot.id}
                                        className="
                                          flex flex-wrap items-center justify-between gap-3
                                          rounded-inner border border-border-warm
                                          bg-surface-muted/40 px-4 py-3
                                        "
                                    >
                                        <div>
                                            <p className="body-sm font-semibold text-ink">
                                                {slotTimeLabel(slot)}
                                            </p>
                                            <Badge variant="outline" className="mt-1 bg-surface">
                                                {slot.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            {slot.status === "open" ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    loading={busyId === slot.id}
                                                    onClick={() =>
                                                        void runSlotAction(
                                                            slot.id,
                                                            () => ownerSlotsApi.close(slot.id),
                                                            "Slot closed",
                                                        )
                                                    }
                                                >
                                                    Close
                                                </Button>
                                            ) : null}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                loading={busyId === slot.id}
                                                onClick={() =>
                                                    void runSlotAction(
                                                        slot.id,
                                                        () => ownerSlotsApi.remove(slot.id),
                                                        "Slot removed",
                                                    )
                                                }
                                            >
                                                <Trash2 aria-hidden />
                                                Delete
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            );
        }
    } else if (showingsLoading && showings.length === 0) {
        panel = (
            <div className="flex justify-center py-16">
                <LoadingSpinner label="Loading showings" />
            </div>
        );
    } else if (showings.length === 0) {
        panel = (
            <EmptyState
                icon={CalendarDays}
                heading="No scheduled showings"
                description="When brokers book your slots, they'll appear here."
            >
                <Button
                    variant="outline"
                    onClick={() => setTab("availability")}
                >
                    Manage availability
                </Button>
            </EmptyState>
        );
    } else {
        panel = (
            <ul className={cn("flex flex-col gap-3", showingsLoading && "opacity-60")}>
                {showings.map((showing) => {
                    const status = showing.status ?? "scheduled";
                    const canRespond = status === "scheduled";
                    return (
                        <li
                            key={showing.id}
                            className="
                              flex flex-col gap-3 rounded-card border border-border-warm bg-surface
                              p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between
                            "
                        >
                            <div className="flex min-inline-0 flex-col gap-1">
                                <p className="body font-semibold text-ink">
                                    {showing.property?.title?.trim() || "Property"}
                                </p>
                                <p className="body-sm text-ink-muted">{showingWhen(showing)}</p>
                                {showing.notes ? (
                                    <p className="body-sm text-ink-muted">{showing.notes}</p>
                                ) : null}
                                <Badge variant="outline" className="mt-1 w-fit bg-surface">
                                    {status}
                                </Badge>
                            </div>
                            {canRespond ? (
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        loading={busyId === showing.id}
                                        onClick={() => void runShowingAction(showing.id, "confirmed")}
                                    >
                                        Confirm
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        loading={busyId === showing.id}
                                        onClick={() => void runShowingAction(showing.id, "cancelled")}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <main className="flex flex-col gap-6 pbe-24 md:pbe-10">
            <PortalSectionNav>
                <div className="flex flex-col gap-3 text-start">
                    <h1 className="h3 text-ink">
                        Site visits. <span className="text-ink-muted">{tabIntro}</span>
                    </h1>
                    <Tabs value={tab} onValueChange={(next) => setTab(next as VisitsTab)}>
                        <TabsList className="inline-flex gap-1 bg-surface-muted p-1">
                            <TabsTrigger
                                value="availability"
                                className="
                                  body-sm rounded-control px-3 text-ink-muted
                                  data-active:bg-surface data-active:text-ink data-active:shadow-sm
                                  after:hidden!
                                "
                            >
                                Availability
                            </TabsTrigger>
                            <TabsTrigger
                                value="scheduled"
                                className="
                                  body-sm rounded-control px-3 text-ink-muted
                                  data-active:bg-surface data-active:text-ink data-active:shadow-sm
                                  after:hidden!
                                "
                            >
                                Scheduled
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </PortalSectionNav>

            {panel}
        </main>
    );
}
