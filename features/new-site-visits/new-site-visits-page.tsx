"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { formatVisitDate, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/store/hooks";

import {
    getVisitActions,
    type SiteVisit,
    validateDraft,
    VISIT_TABS,
    type VisitActionKind,
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
import { VisitOverlay } from "./visit-overlay";

import styles from "./visits.module.css";

export function NewSiteVisitsPage() {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    return <SiteVisitsWorkspace key={accountId} accountId={accountId} />;
}

function SiteVisitsWorkspace({ accountId }: { accountId: string }) {
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
    const savingRef = useRef(false);
    const [editorParentId, setEditorParentId] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterRange, setFilterRange] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{ id: string; intent: VisitIntent } | null>(
        null,
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const deleting = visits.find((visit) => visit.id === deletingId);
    const [tab, setTab] = useState<VisitTab>("upcoming");
    const [view, setView] = useState<"schedule" | "edit" | "detail" | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = visits.find((visit) => visit.id === selectedId);
    const confirmVisit = visits.find((visit) => visit.id === confirmation?.id);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<VisitFilters>({ ...EMPTY_FILTERS });
    const range =
        filterValues.range ||
        (tab === "upcoming" ? "next7" : tab === "running" ? "today" : "past30");
    const filters: VisitFilters = { ...filterValues, range };
    const back = () => {
        setError("");
        setConfirmation(null);
        setDeletingId(null);
        setView(null);
        setSelectedId(null);
        setEditorParentId(null);
    };
    const openVisit = (id: string) => {
        setError("");
        setSelectedId(id);
        setView("detail");
    };
    const closeEditor = () => {
        if (editorParentId) openVisit(editorParentId);
        else back();
    };
    const schedule = () => {
        setError("");
        setEditorParentId(null);
        setSelectedId(null);
        setView("schedule");
    };
    const clear = () => {
        setFilterValues({ ...EMPTY_FILTERS });
        setSearch("");
    };
    const commit = async (next: SiteVisit[], onSuccess: () => void) => {
        if (savingRef.current) return;
        savingRef.current = true;
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
            savingRef.current = false;
            setBusy(false);
        }
    };
    const saveDraft = async (draft: VisitDraft, submittedAt: number) => {
        const editing = view === "schedule" ? undefined : selected;
        if (view !== "schedule" && (!editing || editing.status === "cancelled")) return;
        const validation = validateDraft(draft, visits, submittedAt, editing?.id);
        if (!validation.valid || !validation.times) {
            setError("Check the visit time. It may now be in the past or overlap another visit.");
            return;
        }
        const at = new Date().toISOString();
        const next: SiteVisit = editing
            ? {
                  ...editing,
                  clientId: draft.clientId,
                  propertyId: draft.propertyId,
                  ...validation.times,
                  reminderMinutes: draft.reminderMinutes,
                  notes: draft.notes.trim(),
                  history: [
                      ...editing.history,
                      {
                          at,
                          label:
                              Date.parse(editing.startsAt) !==
                                  Date.parse(validation.times.startsAt) ||
                              Date.parse(editing.endsAt) !== Date.parse(validation.times.endsAt)
                                  ? `Rescheduled from ${formatVisitDate(editing.startsAt)}, ${formatVisitTime(editing.startsAt)} – ${formatVisitTime(editing.endsAt)} IST`
                                  : "Visit details updated",
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
                back();
                toast.success(editing ? "Visit updated" : "Visit scheduled");
            },
        );
    };
    const confirm = async (note: string, submittedAt: number) => {
        if (!confirmation || !confirmVisit) return;
        if (!getVisitActions(confirmVisit, submittedAt).includes(confirmation.intent)) {
            setError("This action is no longer available for the visit. Close and try again.");
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
            history: [
                ...confirmVisit.history,
                {
                    at: new Date().toISOString(),
                    label:
                        confirmVisit.status === "scheduled"
                            ? message
                            : `Attendance corrected: ${confirmation.intent === "completed" ? "Completed" : "Not attended"}`,
                },
            ],
        };
        await commit(
            visits.map((v) => (v.id === next.id ? next : v)),
            () => {
                back();
                toast.success(message);
            },
        );
    };
    const handleAction = (id: string, action: VisitActionKind) => {
        setError("");
        if (action === "delete") setDeletingId(id);
        else if (action === "completed" || action === "not_attended" || action === "cancelled")
            setConfirmation({ id, intent: action });
    };
    const deleteVisit = async () => {
        if (!deleting || !getVisitActions(deleting, now).includes("delete")) return;
        await commit(
            visits.filter((visit) => visit.id !== deleting.id),
            () => {
                back();
                toast.success("Visit deleted");
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
    const editFromDetail = () => {
        setError("");
        setEditorParentId(selected?.id ?? null);
        setView("edit");
    };
    return (
        <main className={styles.page}>
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
            ) : (
                <>
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
                        onEdit={(id) => {
                            setError("");
                            setEditorParentId(null);
                            setSelectedId(id);
                            setView("edit");
                        }}
                        onAction={handleAction}
                        onSearch={setSearch}
                        onTab={(nextTab) => {
                            setTab(nextTab);
                            setFilterValues((current) => ({
                                ...current,
                                archive: "",
                                range: "",
                                from: "",
                                to: "",
                            }));
                        }}
                        onRange={(nextRange) => {
                            if (nextRange === "custom") {
                                setFilterRange("custom");
                                setFiltersOpen(true);
                            } else
                                setFilterValues((current) => ({
                                    ...current,
                                    range: nextRange,
                                    from: "",
                                    to: "",
                                }));
                        }}
                        onFilters={() => {
                            setFilterRange(null);
                            setFiltersOpen(true);
                        }}
                        onClear={clear}
                    />
                </>
            )}
            {query.isSuccess &&
                (deleting ? (
                    <VisitOverlay
                        compact
                        title="Delete this visit?"
                        description="This permanently removes the visit and its activity history. The client and property records are kept."
                        busy={busy}
                        error={error}
                        onClose={() => {
                            setDeletingId(null);
                            setError("");
                        }}
                        footer={(close) => (
                            <>
                                <Button variant="outline" disabled={busy} onClick={close}>
                                    Keep visit
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={busy}
                                    loading={busy}
                                    onClick={() => void deleteVisit()}
                                >
                                    Delete visit
                                </Button>
                            </>
                        )}
                    >
                        <p className={styles.muted}>
                            {
                                PREVIEW_CLIENTS.find((client) => client.id === deleting.clientId)
                                    ?.name
                            }{" "}
                            /{" "}
                            {
                                PREVIEW_PROPERTIES.find(
                                    (property) => property.id === deleting.propertyId,
                                )?.title
                            }
                        </p>
                        <p className={styles.muted}>
                            {formatVisitDate(deleting.startsAt)} /{" "}
                            {formatVisitTime(deleting.startsAt)} IST
                        </p>
                    </VisitOverlay>
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
                        onConfirm={(note) => confirm(note, Date.now())}
                    />
                ) : view === "schedule" ||
                  (view === "edit" && selected && selected.status !== "cancelled") ? (
                    <ScheduleForm
                        key={`${view}-${selected?.id ?? "new"}-${selected?.startsAt ?? ""}`}
                        visit={view === "schedule" ? undefined : selected}
                        visits={visits}
                        now={now}
                        busy={busy}
                        saveError={error}
                        onSave={(draft) => saveDraft(draft, Date.now())}
                        onBack={closeEditor}
                    />
                ) : selected ? (
                    <VisitDetail
                        visit={selected}
                        now={now}
                        busy={busy}
                        onBack={back}
                        onEdit={editFromDetail}
                        onDelete={() => handleAction(selected.id, "delete")}
                        onConfirm={(intent) => {
                            setError("");
                            setConfirmation({ id: selected.id, intent });
                        }}
                    />
                ) : selectedId ? (
                    <VisitOverlay
                        compact
                        title="Visit not found"
                        onClose={back}
                        footer={(close) => <Button onClick={close}>Back to visits</Button>}
                    >
                        <p className={styles.muted}>
                            This sample visit is no longer in the preview.
                        </p>
                    </VisitOverlay>
                ) : null)}
            {filtersOpen && (
                <VisitFiltersDialog
                    value={{ ...filters, range: filterRange ?? filters.range }}
                    onClose={() => setFiltersOpen(false)}
                    onApply={(next) => {
                        const isTab = VISIT_TABS.some((t) => t.value === next.archive);
                        if (isTab) setTab(next.archive as VisitTab);
                        setFilterValues({ ...next, archive: isTab ? "" : next.archive });
                        setFiltersOpen(false);
                    }}
                />
            )}
            {query.isSuccess && (
                <footer className={styles.pageFooter}>
                    <span className={styles.footerLine} aria-hidden />
                    <p>Only you manage these visits. No messages are sent to clients.</p>
                    <span className={styles.footerLine} aria-hidden />
                </footer>
            )}
        </main>
    );
}
