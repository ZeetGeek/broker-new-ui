"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { tz, TZDate } from "@date-fns/tz";
import { addDays, format, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { ownerSlotsApi, type VisitShowing, type VisitSlot } from "@/lib/api/owner-slots";
import { propertiesApi } from "@/lib/api/properties";
import { formatDateIn, formatDateIso, formatTime24, formatTimeIn, parseApiInstant, toApiInstantFromLocalParts } from "@/lib/format/date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VisitsTab = "availability" | "scheduled";

const SLOT_TIMES = buildSlotTimes(9 * 60, 19 * 60 + 30, 30);

const QUICK_PRESETS = [
    {
        id: "weekends",
        label: "Weekends 10am–1pm",
        from: "10:00",
        to: "13:00",
        weekdays: new Set([0, 6]),
    },
    {
        id: "evenings",
        label: "Weekday evenings 5–7pm",
        from: "17:00",
        to: "19:00",
        weekdays: new Set([1, 2, 3, 4, 5]),
    },
] as const;

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

function buildSlotTimes(fromMinutes: number, toMinutes: number, step: number): string[] {
    const times: string[] = [];
    for (let minutes = fromMinutes; minutes <= toMinutes; minutes += step) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
    return times;
}

function label12(hhmm: string): string {
    const [hourPart, minute] = hhmm.split(":");
    const hour = Number(hourPart);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${period}`;
}

function addMinutes(hhmm: string, minutes: number): string {
    const [hourPart, minutePart] = hhmm.split(":");
    const total = Number(hourPart) * 60 + Number(minutePart) + minutes;
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isExpiredSlot(dateIso: string, time: string, todayIso: string, nowTime: string): boolean {
    if (dateIso < todayIso) return true;
    if (dateIso > todayIso) return false;
    return time < nowTime;
}

function weekdayOfIso(iso: string): number {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function weekIsoDates(anchor: Date): string[] {
    const zone = tz(getUserTimeZone());
    const start = startOfWeek(anchor, { weekStartsOn: 0, in: zone });
    return Array.from({ length: 7 }, (_, index) => formatDateIso(addDays(start, index, { in: zone })));
}

function dayParts(iso: string): { weekday: string; date: string; month: string } {
    const zone = tz(getUserTimeZone());
    const noon = new TZDate(`${iso}T12:00:00`, getUserTimeZone());
    return {
        weekday: format(noon, "EEE", { in: zone }),
        date: format(noon, "d", { in: zone }),
        month: format(noon, "MMM", { in: zone }),
    };
}

function showingWhen(showing: VisitShowing): string {
    const when = parseApiInstant(showing.scheduledDate);
    return `${formatDateIn(when)} · ${formatTimeIn(when)}`;
}

function slotStartKey(slot: VisitSlot): string | null {
    const start = parseApiInstant(slot.startAt);
    return `${formatDateIso(start)}|${formatTime24(start)}`;
}

export function OwnerVisitsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: VisitsTab = isVisitsTab(tabParam) ? tabParam : "availability";

    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [presetBusy, setPresetBusy] = useState<string | null>(null);

    const [properties, setProperties] = useState<{ id: string; label: string }[]>([]);
    const [propertyId, setPropertyId] = useState("");
    const [propertiesLoading, setPropertiesLoading] = useState(true);

    const [slots, setSlots] = useState<VisitSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [showings, setShowings] = useState<VisitShowing[]>([]);
    const [showingsTotal, setShowingsTotal] = useState(0);
    const [showingsLoading, setShowingsLoading] = useState(false);

    const [weekAnchor, setWeekAnchor] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => formatDateIso(new Date()));

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkDates, setBulkDates] = useState("");
    const [bulkFrom, setBulkFrom] = useState("10:00");
    const [bulkTo, setBulkTo] = useState("13:00");
    const [bulkLength, setBulkLength] = useState<30 | 60>(30);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const weekDates = useMemo(() => weekIsoDates(weekAnchor), [weekAnchor]);
    const todayIso = formatDateIso(new Date());
    const nowTime = formatTime24(new Date());

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
        if (!propertyId) {
            setSlots([]);
            return;
        }
        let cancelled = false;
        setSlotsLoading(true);
        void ownerSlotsApi
            .list({ propertyId, limit: 200 })
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
    }, [propertyId, revision]);

    useEffect(() => {
        let cancelled = false;
        setShowingsLoading(true);
        void ownerSlotsApi
            .showings({ limit: 50 })
            .then((page) => {
                if (!cancelled) {
                    setShowings(page.items);
                    setShowingsTotal(page.total);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    toast.error(apiMessage(err, "Could not load showings"));
                    setShowings([]);
                    setShowingsTotal(0);
                }
            })
            .finally(() => {
                if (!cancelled) setShowingsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [revision]);

    const slotsByStart = useMemo(() => {
        const map = new Map<string, VisitSlot>();
        for (const slot of slots) {
            const key = slotStartKey(slot);
            if (key) map.set(key, slot);
        }
        return map;
    }, [slots]);

    const datesWithSlots = useMemo(() => {
        const dates = new Set<string>();
        for (const slot of slots) {
            if (slot.status === "closed") continue;
            dates.add(formatDateIso(parseApiInstant(slot.startAt)));
        }
        return dates;
    }, [slots]);

    const shiftWeek = useCallback((delta: number) => {
        const zone = tz(getUserTimeZone());
        setWeekAnchor((current) => addDays(current, delta * 7, { in: zone }));
    }, []);

    useEffect(() => {
        if (!weekDates.includes(selectedDate)) {
            setSelectedDate(weekDates[0]);
        }
    }, [selectedDate, weekDates]);

    const toggleSlot = useCallback(
        async (dateIso: string, time: string) => {
            if (!propertyId) return;
            const key = `${dateIso}|${time}`;
            const existing = slotsByStart.get(key);
            if (existing?.status === "booked") {
                toast.error("This time is already booked.");
                return;
            }
            if (!existing && isExpiredSlot(dateIso, time, todayIso, nowTime)) {
                return;
            }

            setTogglingKey(key);
            try {
                if (existing) {
                    await ownerSlotsApi.remove(existing.id);
                    toast.success("Slot removed");
                } else {
                    await ownerSlotsApi.create({
                        propertyId,
                        startAt: toApiInstantFromLocalParts(dateIso, time),
                        endAt: toApiInstantFromLocalParts(dateIso, addMinutes(time, 30)),
                    });
                    toast.success("Slot opened");
                }
                setRevision((value) => value + 1);
            } catch (err) {
                toast.error(apiMessage(err, existing ? "Could not remove slot" : "Could not open slot"));
            } finally {
                setTogglingKey(null);
            }
        },
        [nowTime, propertyId, slotsByStart, todayIso],
    );

    const applyPreset = useCallback(
        async (preset: (typeof QUICK_PRESETS)[number]) => {
            if (!propertyId) return;
            const dates = weekDates.filter(
                (date) => preset.weekdays.has(weekdayOfIso(date)) && date >= todayIso,
            );
            if (dates.length === 0) {
                toast.error("Those days have passed. Move to a later week.");
                return;
            }
            setPresetBusy(preset.id);
            try {
                const result = await ownerSlotsApi.bulkCreate({
                    propertyId,
                    dates,
                    from: preset.from,
                    to: preset.to,
                    slotLength: 30,
                });
                toast.success(`Opened ${result.created} slot${result.created === 1 ? "" : "s"}`);
                setRevision((value) => value + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Could not add those slots"));
            } finally {
                setPresetBusy(null);
            }
        },
        [propertyId, todayIso, weekDates],
    );

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
            toast.success(`Opened ${result.created} slot${result.created === 1 ? "" : "s"}`);
            setBulkOpen(false);
            setRevision((value) => value + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not bulk-create slots"));
        } finally {
            setBulkSubmitting(false);
        }
    }, [bulkDates, bulkFrom, bulkLength, bulkTo, propertyId]);

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
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="body-sm font-semibold text-ink">Property</span>
                        <select
                            className="
                              rounded-control border border-border-warm bg-surface px-3.5
                              block-[42px] text-[15px] text-ink shadow-sm inline-full
                            "
                            value={propertyId}
                            onChange={(event) => setPropertyId(event.target.value)}
                        >
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <section
                        className="
                          flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4
                          shadow-sm
                        "
                    >
                        <h2 className="body-sm font-semibold text-ink">Quick add (recurring)</h2>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    disabled={presetBusy != null}
                                    onClick={() => void applyPreset(preset)}
                                    className="
                                      body-sm inline-flex items-center gap-1 rounded-full border
                                      border-brand/30 bg-brand-soft px-3 py-1.5 font-semibold
                                      text-brand-text
                                      hover:border-brand
                                      disabled:opacity-60
                                    "
                                >
                                    <Plus aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                                    {presetBusy === preset.id ? "Adding…" : preset.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setBulkOpen(true)}
                                className="
                                  body-sm inline-flex items-center gap-1 rounded-full border
                                  border-brand/30 bg-brand-soft px-3 py-1.5 font-semibold
                                  text-brand-text
                                  hover:border-brand
                                "
                            >
                                <Plus aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                                Bulk add…
                            </button>
                        </div>
                    </section>

                    <section
                        className={cn(
                            `
                              flex flex-col gap-4 rounded-card border border-border-warm bg-surface
                              p-4 shadow-sm
                            `,
                            slotsLoading && "opacity-70",
                        )}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="body font-semibold text-ink">Open specific slots</h2>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-label="Previous week"
                                    onClick={() => shiftWeek(-1)}
                                    className="
                                      flex items-center justify-center rounded-control text-ink-muted
                                      block-8 inline-8
                                      hover:bg-surface-muted hover:text-ink
                                    "
                                >
                                    <ChevronLeft aria-hidden className="block-4 inline-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next week"
                                    onClick={() => shiftWeek(1)}
                                    className="
                                      flex items-center justify-center rounded-control text-ink-muted
                                      block-8 inline-8
                                      hover:bg-surface-muted hover:text-ink
                                    "
                                >
                                    <ChevronRight aria-hidden className="block-4 inline-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {weekDates.map((date) => {
                                const parts = dayParts(date);
                                const selected = date === selectedDate;
                                const hasSlots = datesWithSlots.has(date);
                                return (
                                    <button
                                        key={date}
                                        type="button"
                                        onClick={() => setSelectedDate(date)}
                                        aria-pressed={selected}
                                        className={cn(
                                            `
                                              relative flex min-w-[4.5rem] flex-1 flex-col
                                              items-center gap-0.5 rounded-control border px-2 py-3
                                            `,
                                            selected
                                                ? "border-brand bg-brand text-surface"
                                                : "border-border-warm bg-surface text-ink hover:border-ink/20",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "body-xs font-medium",
                                                selected ? "text-surface/80" : "text-ink-muted",
                                            )}
                                        >
                                            {parts.weekday}
                                        </span>
                                        <span className="h5 tabular-nums">{parts.date}</span>
                                        <span
                                            className={cn(
                                                "body-xs font-medium uppercase tracking-wide",
                                                selected ? "text-surface/80" : "text-ink-subtle",
                                            )}
                                        >
                                            {parts.month}
                                        </span>
                                        {hasSlots ? (
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "absolute inset-e-2 inset-bs-2 rounded-full block-1.5 inline-1.5",
                                                    selected ? "bg-surface" : "bg-success",
                                                )}
                                            />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="body-sm text-ink-muted">
                            Tap a time to open it on {selectedDate.split("-").reverse().join("/")}.
                            Tap again to remove.
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                            {SLOT_TIMES.map((time) => {
                                const key = `${selectedDate}|${time}`;
                                const slot = slotsByStart.get(key);
                                const open = slot?.status === "open" || slot?.status === "booked";
                                const booked = slot?.status === "booked";
                                const expired = isExpiredSlot(selectedDate, time, todayIso, nowTime);
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={expired || togglingKey === key}
                                        aria-disabled={expired || undefined}
                                        onClick={() => void toggleSlot(selectedDate, time)}
                                        className={cn(
                                            `
                                              body-sm rounded-control border px-2 py-2.5 text-center
                                              font-medium tabular-nums transition-colors duration-160
                                            `,
                                            expired
                                                ? `
                                                  cursor-not-allowed border-border-warm
                                                  bg-surface-muted text-ink-subtle
                                                `
                                                : open
                                                  ? "border-brand/40 bg-brand-soft text-brand-text"
                                                  : `
                                                    border-border-warm bg-surface text-ink
                                                    hover:border-ink/25
                                                  `,
                                            !expired &&
                                                booked &&
                                                "border-ink/20 bg-surface-muted text-ink-muted",
                                            togglingKey === key && "opacity-60",
                                        )}
                                    >
                                        {label12(time)}
                                    </button>
                                );
                            })}
                        </div>
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
                <Button variant="outline" onClick={() => setTab("availability")}>
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
                            Scheduled ({showingsTotal})
                        </button>
                    </div>
                </div>
            </PortalSectionNav>

            {panel}

            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogPopup className="max-inline-lg">
                    <DialogHeader>
                        <DialogTitle>Bulk add slots</DialogTitle>
                        <DialogDescription>
                            Enter dates as YYYY-MM-DD, separated by commas or new lines.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
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
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBulkOpen(false)}>
                                Cancel
                            </Button>
                            <Button loading={bulkSubmitting} onClick={() => void createBulkSlots()}>
                                Create slots
                            </Button>
                        </div>
                    </div>
                </DialogPopup>
            </Dialog>
        </div>
    );
}
