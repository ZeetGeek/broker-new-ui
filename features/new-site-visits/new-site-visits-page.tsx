"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { formatVisitDate, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { Bell, CheckCircle2, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/store/hooks";

import {
    notificationKind,
    REMINDERS,
    type SiteVisit,
    validateDraft,
    VISIT_TABS,
    visitDateBounds,
    type VisitDraft,
    visitState,
    type VisitTab,
} from "./model";
import {
    PREVIEW_CLIENTS,
    PREVIEW_PROPERTIES,
    sampleVisits,
    visitPreviewStore,
} from "./preview-store";
import { ScheduleForm } from "./schedule-form";
import { AttendanceConfirmation, VisitDetail, type VisitIntent } from "./visit-detail";
import { EMPTY_FILTERS, type VisitFilters, VisitFiltersDialog } from "./visit-filters";
import { VisitList } from "./visit-list";
import { ReminderPicker } from "./visit-pickers";

import styles from "./visits.module.css";

export function NewSiteVisitsPage() {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    return <SiteVisitsWorkspace key={accountId} accountId={accountId} />;
}

function SiteVisitsWorkspace({ accountId }: { accountId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ["penpot-private-visits-preview-v1", accountId], [accountId]);
    const query = useQuery({
        queryKey,
        queryFn: () => visitPreviewStore.list(accountId),
        staleTime: Infinity,
        retry: false,
    });
    const visits = query.data ?? [];
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => clearInterval(timer);
    }, []);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{ id: string; message: string } | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterRange, setFilterRange] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{ id: string; intent: VisitIntent } | null>(
        null,
    );
    const [dismissed, setDismissed] = useState<string[]>([]);
    const rawTab = params.get("tab");
    const tab: VisitTab = VISIT_TABS.some((t) => t.value === rawTab)
        ? (rawTab as VisitTab)
        : "upcoming";
    const view = params.get("view");
    const selectedId = params.get("visit");
    const selected = visits.find((v) => v.id === selectedId);
    const confirmVisit = visits.find((v) => v.id === confirmation?.id);
    const search = params.get("q") ?? "";
    const range =
        params.get("range") ??
        (tab === "upcoming" ? "next7" : tab === "running" ? "today" : "past30");
    const filters: VisitFilters = {
        client: params.get("client") ?? "",
        property: params.get("property") ?? "",
        from: params.get("from") ?? "",
        to: params.get("to") ?? "",
        archive: params.get("archive") ?? "",
        range,
    };
    const navigate = (patch: Record<string, string | undefined>, replace = false) => {
        const next = new URLSearchParams(params.toString());
        for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        const href = `${pathname}${next.size ? `?${next}` : ""}`;
        if (replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
    };
    const back = () => {
        setError("");
        setResult(null);
        setConfirmation(null);
        navigate({
            view: undefined,
            visit: undefined,
            forClient: undefined,
            forProperty: undefined,
        });
    };
    const openVisit = (id: string) => {
        setError("");
        setResult(null);
        navigate({ view: "detail", visit: id });
    };
    const schedule = (from?: SiteVisit) => {
        setError("");
        setResult(null);
        navigate({
            view: "schedule",
            visit: undefined,
            forClient: from?.clientId,
            forProperty: from?.propertyId,
        });
    };
    const clear = () =>
        navigate(
            {
                ...Object.fromEntries(Object.keys(EMPTY_FILTERS).map((k) => [k, undefined])),
                q: undefined,
            },
            true,
        );
    const commit = async (next: SiteVisit[], onSuccess: () => void) => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            queryClient.setQueryData(queryKey, await visitPreviewStore.save(accountId, next));
            onSuccess();
        } catch {
            setError(
                "This browser couldn’t save the preview. Check that tab storage is available, then try again.",
            );
        } finally {
            setBusy(false);
        }
    };
    const saveDraft = async (draft: VisitDraft) => {
        const editing = view === "reschedule" ? selected : undefined;
        if (view === "reschedule" && (!editing || editing.status !== "scheduled")) return;
        const validation = validateDraft(draft, visits, Date.now(), editing?.id);
        if (!validation.valid || !validation.times) {
            setError("Check the visit time. It may now be in the past or overlap another visit.");
            return;
        }
        const at = new Date().toISOString();
        const next: SiteVisit = editing
            ? {
                  ...editing,
                  ...validation.times,
                  reminderMinutes: draft.reminderMinutes,
                  notes: draft.notes.trim(),
                  history: [
                      ...editing.history,
                      {
                          at,
                          label: `Rescheduled from ${formatVisitDate(editing.startsAt)}, ${formatVisitTime(editing.startsAt)} – ${formatVisitTime(editing.endsAt)} IST`,
                      },
                  ],
              }
            : {
                  id: crypto.randomUUID(),
                  clientId: draft.clientId,
                  propertyId: draft.propertyId,
                  ...validation.times,
                  reminderMinutes: draft.reminderMinutes,
                  notes: draft.notes.trim(),
                  status: "scheduled",
                  attendanceNote: "",
                  history: [{ at, label: "Created by you" }],
              };
        await commit(
            editing ? visits.map((v) => (v.id === editing.id ? next : v)) : [...visits, next],
            () => {
                setResult({
                    id: next.id,
                    message: editing ? "Visit rescheduled" : "Visit scheduled",
                });
                navigate({ view: "detail", visit: next.id });
            },
        );
    };
    const confirm = async (note: string) => {
        if (!confirmation || !confirmVisit || confirmVisit.status !== "scheduled") return;
        if (confirmation.intent !== "cancelled" && Date.parse(confirmVisit.endsAt) > Date.now()) {
            setError("Attendance can be recorded after the visit ends.");
            return;
        }
        const message =
            confirmation.intent === "completed"
                ? "Visit completed"
                : confirmation.intent === "not_attended"
                  ? "Visit not attended"
                  : "Visit cancelled";
        const next: SiteVisit = {
            ...confirmVisit,
            status: confirmation.intent,
            attendanceNote: note.trim(),
            history: [...confirmVisit.history, { at: new Date().toISOString(), label: message }],
        };
        await commit(
            visits.map((v) => (v.id === next.id ? next : v)),
            () => {
                setConfirmation(null);
                setResult({ id: next.id, message });
                navigate({ view: "detail", visit: next.id });
            },
        );
    };
    const saveReminder = async (minutes: number) => {
        if (!selected || selected.status !== "scheduled") return;
        const next = {
            ...selected,
            reminderMinutes: minutes,
            history: [
                ...selected.history,
                {
                    at: new Date().toISOString(),
                    label: `Reminder updated · ${REMINDERS.find((r) => r.value === minutes)?.label}`,
                },
            ],
        };
        await commit(
            visits.map((v) => (v.id === selected.id ? next : v)),
            () => {
                setResult({ id: selected.id, message: "Reminder updated" });
                navigate({ view: "detail" });
            },
        );
    };
    const bounds = range === "custom" ? filters : visitDateBounds(range, now);
    const shown = visits
        .filter((v) => {
            const state = visitState(v, now);
            if (
                filters.archive
                    ? filters.archive !== "all" && state !== filters.archive
                    : state !== tab
            )
                return false;
            if (
                (filters.client && v.clientId !== filters.client) ||
                (filters.property && v.propertyId !== filters.property)
            )
                return false;
            const day = istDateKey(v.startsAt);
            if ((bounds.from && day < bounds.from) || (bounds.to && day > bounds.to)) return false;
            const client = PREVIEW_CLIENTS.find((c) => c.id === v.clientId);
            const property = PREVIEW_PROPERTIES.find((p) => p.id === v.propertyId);
            return `${client?.name} ${property?.title} ${property?.locality} ${property?.city} ${v.notes}`
                .toLowerCase()
                .includes(search.toLowerCase().trim());
        })
        .sort(
            (a, b) =>
                (tab === "completed" || tab === "not_attended" ? -1 : 1) *
                (Date.parse(a.startsAt) - Date.parse(b.startsAt)),
        );
    const notificationKey = (v: SiteVisit, kind: string | null) => `${v.id}:${v.startsAt}:${kind}`;
    const notification = visits
        .map((visit) => ({ visit, kind: notificationKind(visit, now) }))
        .find((n) => n.kind && !dismissed.includes(notificationKey(n.visit, n.kind)));
    const visitResult = selected && result?.id === selected.id ? result.message : "";
    return (
        <main className={styles.page}>
            <div className={styles.previewBar}>
                <span>
                    <strong>Design preview</strong> · Sample visits, saved only in this tab.
                    Notifications appear while this page is open.
                </span>
                <div>
                    <button disabled={busy} onClick={() => void commit([], back)}>
                        Start empty
                    </button>
                    <button
                        disabled={busy}
                        onClick={() =>
                            void commit(sampleVisits(), () => {
                                setDismissed([]);
                                back();
                            })
                        }
                    >
                        Reset samples
                    </button>
                </div>
            </div>
            {query.isPending ? (
                <div role="status" className={styles.loading}>
                    Loading your visits…
                </div>
            ) : query.isError ? (
                <div role="alert" className={styles.empty}>
                    <h1 className="h3 text-ink">Visits couldn’t be loaded</h1>
                    <p>{query.error.message}</p>
                    <div className={styles.actions}>
                        <Button variant="outline" onClick={() => void query.refetch()}>
                            Try again
                        </Button>
                        <Button disabled={busy} onClick={() => void commit(sampleVisits(), back)}>
                            Reset sample visits
                        </Button>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                </div>
            ) : confirmation && confirmVisit ? (
                <AttendanceConfirmation
                    key={`${confirmation.id}-${confirmation.intent}`}
                    visit={confirmVisit}
                    intent={confirmation.intent}
                    busy={busy}
                    error={error}
                    onClose={() => {
                        if (!busy) {
                            setConfirmation(null);
                            setError("");
                        }
                    }}
                    onConfirm={confirm}
                />
            ) : view === "reminder" && selected?.status === "scheduled" ? (
                <ReminderPicker
                    key={selected.id}
                    value={selected.reminderMinutes}
                    busy={busy}
                    error={error}
                    onClose={() => navigate({ view: "detail" })}
                    onSave={(minutes) => void saveReminder(minutes)}
                />
            ) : view === "schedule" ||
              (view === "reschedule" && selected?.status === "scheduled") ? (
                <ScheduleForm
                    key={`${view}-${selected?.id ?? "new"}-${selected?.startsAt ?? ""}`}
                    visit={view === "reschedule" ? selected : undefined}
                    prefill={{
                        clientId: params.get("forClient") ?? "",
                        propertyId: params.get("forProperty") ?? "",
                    }}
                    visits={visits}
                    now={now}
                    busy={busy}
                    saveError={error}
                    onSave={saveDraft}
                    onBack={back}
                />
            ) : selected ? (
                <VisitDetail
                    visit={selected}
                    now={now}
                    result={visitResult}
                    busy={busy}
                    onBack={back}
                    onReschedule={() => {
                        setError("");
                        setResult(null);
                        navigate({ view: "reschedule" });
                    }}
                    onEditReminder={() => {
                        setError("");
                        navigate({ view: "reminder" });
                    }}
                    onNewVisit={() => schedule(selected)}
                    onViewStatus={() => {
                        setError("");
                        setResult(null);
                        navigate({
                            view: undefined,
                            visit: undefined,
                            tab:
                                selected.status === "completed"
                                    ? "completed"
                                    : selected.status === "not_attended"
                                      ? "not_attended"
                                      : "upcoming",
                            archive: undefined,
                            range: undefined,
                        });
                    }}
                    onConfirm={(intent) => {
                        setError("");
                        setConfirmation({ id: selected.id, intent });
                    }}
                />
            ) : selectedId ? (
                <div className={styles.empty}>
                    <h1 className="h3 text-ink">Visit not found</h1>
                    <p>This sample visit is no longer in the preview.</p>
                    <Button onClick={back}>Back to visits</Button>
                </div>
            ) : (
                <>
                    {error && (
                        <p role="alert" className={styles.error}>
                            {error}
                        </p>
                    )}
                    <VisitList
                        visits={visits}
                        shown={shown}
                        tab={tab}
                        now={now}
                        filters={filters}
                        range={range}
                        search={search}
                        onSchedule={() => schedule()}
                        onOpen={openVisit}
                        onSearch={(q) => navigate({ q: q || undefined }, true)}
                        onTab={(tab) =>
                            navigate(
                                {
                                    tab,
                                    archive: undefined,
                                    range: undefined,
                                    from: undefined,
                                    to: undefined,
                                },
                                true,
                            )
                        }
                        onRange={(range) => {
                            if (range === "custom") {
                                setFilterRange("custom");
                                setFiltersOpen(true);
                            } else navigate({ range, from: undefined, to: undefined }, true);
                        }}
                        onFilters={() => {
                            setFilterRange(null);
                            setFiltersOpen(true);
                        }}
                        onClear={clear}
                    />
                    {notification && (
                        <div className={styles.notification} role="status">
                            <Bell aria-hidden />
                            <div>
                                <strong>
                                    {notification.kind === "attendance"
                                        ? "A visit needs your update"
                                        : notification.kind === "start"
                                          ? "Your site visit starts now"
                                          : "Your upcoming visit"}
                                </strong>
                                <p>
                                    {
                                        PREVIEW_CLIENTS.find(
                                            (c) => c.id === notification.visit.clientId,
                                        )?.name
                                    }{" "}
                                    ·{" "}
                                    {
                                        PREVIEW_PROPERTIES.find(
                                            (p) => p.id === notification.visit.propertyId,
                                        )?.title
                                    }
                                </p>
                            </div>
                            <Button size="sm" onClick={() => openVisit(notification.visit.id)}>
                                {notification.kind === "attendance"
                                    ? "Confirm attendance"
                                    : "View visit"}
                            </Button>
                            <button
                                className={styles.iconButton}
                                aria-label="Dismiss visit notification"
                                onClick={() =>
                                    setDismissed((d) => [
                                        ...d,
                                        notificationKey(notification.visit, notification.kind),
                                    ])
                                }
                            >
                                <X aria-hidden />
                            </button>
                        </div>
                    )}
                </>
            )}
            {filtersOpen && (
                <VisitFiltersDialog
                    value={{ ...filters, range: filterRange ?? filters.range }}
                    onClose={() => setFiltersOpen(false)}
                    onApply={(next) => {
                        const isTab = VISIT_TABS.some((t) => t.value === next.archive);
                        navigate(
                            {
                                ...next,
                                ...(isTab ? { tab: next.archive, archive: undefined } : {}),
                            },
                            true,
                        );
                        setFiltersOpen(false);
                    }}
                />
            )}
            <footer className={styles.pageFooter}>
                <CheckCircle2 aria-hidden />
                Only you manage these visits. No messages are sent to clients.
            </footer>
        </main>
    );
}
