"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import {
    type BookableLead,
    type BrokerVisit,
    siteVisitsApi,
    type VisitSort,
    type VisitTab,
} from "@/lib/api/site-visits";
import { closeDirectVisitHref, directVisitWorkflow } from "@/lib/visits/direct-workflow";

import { Button } from "@/components/ui/button";

import { VisitWorkflow } from "@/features/workflows/visit-workflow";

import {
    matchIntent,
    parseScheduleIntent,
    resolveScheduleIntent,
    type VisitActionKind,
    visitDateBounds,
    visitErrorMessage,
} from "./model";
import { ScheduleForm } from "./schedule-form";
import { useVisitList, useVisitMutations, useVisitsLive, VISITS_KEY } from "./use-visits";
import { AttendanceConfirmation, VisitDetail, type VisitIntent } from "./visit-detail";
import {
    EMPTY_FILTERS,
    VisitDateRangeDialog,
    type VisitFilters,
    VisitFiltersDialog,
} from "./visit-filters";
import { VisitList } from "./visit-list";

import styles from "./visits.module.css";

const FINISHED_TABS: VisitTab[] = ["completed", "not_attended", "cancelled"];
const SEARCH_DEBOUNCE_MS = 300;

/** Finished tabs look back 30 days by default; everything else shows all dates. */
function defaultRange(tab: VisitTab) {
    return tab === "completed" || tab === "not_attended" ? "past30" : "all";
}

type View =
    | { kind: "schedule"; intent: BookableLead | null; intentMissed: boolean }
    | { kind: "reschedule"; visit: BrokerVisit }
    | { kind: "detail"; visit: BrokerVisit }
    | { kind: "confirm"; visit: BrokerVisit; intent: VisitIntent; from: "list" | "detail" };

export function NewSiteVisitsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directTarget = directVisitWorkflow(new URLSearchParams(searchParams.toString()));
    const hasDirectTarget = directTarget !== null;
    const queryClient = useQueryClient();
    const mutations = useVisitMutations();

    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => clearInterval(timer);
    }, []);

    const [tab, setTab] = useState<VisitTab>(() => {
        const requested = searchParams.get("tab");
        return requested &&
            ["upcoming", "running", "needs_update", ...FINISHED_TABS].includes(
                requested as VisitTab,
            )
            ? (requested as VisitTab)
            : "upcoming";
    });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const timer = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [searchInput]);
    const [filters, setFilters] = useState<VisitFilters>(() => ({
        ...EMPTY_FILTERS,
        range: searchParams.get("range") === "today" ? "today" : "",
    }));
    const [sort, setSort] = useState<VisitSort | undefined>(undefined);
    const [dialog, setDialog] = useState<"filters" | "dates" | null>(null);
    // The shell's "Schedule visit" action links here with ?view=schedule.
    const [view, setView] = useState<View | null>(() =>
        searchParams.get("view") === "schedule"
            ? { kind: "schedule", intent: null, intentMissed: false }
            : null,
    );
    const [actionError, setActionError] = useState("");

    const range = filters.range || defaultRange(tab);
    const bounds = range === "custom" ? filters : visitDateBounds(range, now);
    const list = useVisitList({
        tab,
        search,
        clientId: filters.client || undefined,
        propertyId: filters.property || undefined,
        from: bounds.from || undefined,
        to: bounds.to || undefined,
        sort,
    });
    const firstPage = list.data?.pages[0];
    useVisitsLive(firstPage?.nextChangeAt ?? null, list.dataUpdatedAt);
    const visits = list.data?.pages.flatMap((page) => page.items) ?? [];
    const filterCount = (filters.client ? 1 : 0) + (filters.property ? 1 : 0);
    const filtered = filterCount > 0 || Boolean(search) || Boolean(filters.range);

    // A Pipeline "Schedule visit" link: reschedule the deal's booked visit, or
    // book a new one with the client and property filled in.
    const intentHandled = useRef(false);
    useEffect(() => {
        if (intentHandled.current || hasDirectTarget) return;
        const intent = parseScheduleIntent(new URLSearchParams(searchParams.toString()));
        if (!intent) return;
        intentHandled.current = true;
        router.replace("/broker/visits", { scroll: false });
        void (async () => {
            try {
                const leads = await queryClient.fetchQuery({
                    queryKey: [...VISITS_KEY, "bookable"],
                    queryFn: () => siteVisitsApi.bookable(),
                });
                const lead = matchIntent(intent, leads);
                const active = lead ? await siteVisitsApi.activeForLead(lead.leadId) : null;
                setView(resolveScheduleIntent(intent, leads, active));
            } catch {
                setView({ kind: "schedule", intent: null, intentMissed: false });
            }
        })();
    }, [searchParams, router, queryClient, hasDirectTarget]);

    const clearFilters = () => {
        setFilters({ ...EMPTY_FILTERS });
        setSearchInput("");
        setSearch("");
    };
    const close = () => {
        setActionError("");
        setView(null);
    };
    const confirm = (visit: BrokerVisit, intent: VisitIntent, from: "list" | "detail") => {
        setActionError("");
        setView({ kind: "confirm", visit, intent, from });
    };
    const handleAction = (visit: BrokerVisit, action: VisitActionKind) => {
        if (action === "reschedule") setView({ kind: "reschedule", visit });
        else if (action === "view") setView({ kind: "detail", visit });
        else confirm(visit, action, "list");
    };
    const runConfirm = async (visit: BrokerVisit, intent: VisitIntent) => {
        setActionError("");
        try {
            if (intent === "cancelled") {
                await mutations.cancel.mutateAsync(visit.id);
                toast.success("Visit cancelled");
            } else {
                await mutations.setOutcome.mutateAsync({
                    id: visit.id,
                    status: intent === "completed" ? "completed" : "no_show",
                });
                toast.success(intent === "completed" ? "Marked completed" : "Marked not attended");
            }
            setView(null);
        } catch (error) {
            setActionError(visitErrorMessage(error));
        }
    };
    const busy = mutations.cancel.isPending || mutations.setOutcome.isPending;
    // Keep an open visit current when live updates refresh the list.
    const fresh = (visit: BrokerVisit) => visits.find((item) => item.id === visit.id) ?? visit;

    return (
        <main className={styles.page}>
            {list.isPending ? (
                <div role="status" className={styles.loading}>
                    Loading your visits…
                </div>
            ) : list.isError && !list.data ? (
                <div role="alert" className={styles.empty}>
                    <h1 className="h3 text-ink">Your visits couldn’t be loaded</h1>
                    <p>Check your connection and try again.</p>
                    <div className={styles.actions}>
                        <Button variant="outline" onClick={() => void list.refetch()}>
                            Try again
                        </Button>
                    </div>
                </div>
            ) : (
                <VisitList
                    visits={visits}
                    counts={firstPage!.counts}
                    firstRun={firstPage!.clientOptions.length === 0}
                    filtered={filtered}
                    filterCount={filterCount}
                    refreshing={list.isPlaceholderData}
                    hasMore={Boolean(list.hasNextPage)}
                    loadingMore={list.isFetchingNextPage}
                    tab={tab}
                    now={now}
                    search={searchInput}
                    range={range}
                    sort={sort ?? (FINISHED_TABS.includes(tab) ? "start_desc" : "start_asc")}
                    onTab={(next) => {
                        setTab(next);
                        setSort(undefined);
                        setFilters((current) => ({ ...current, range: "", from: "", to: "" }));
                    }}
                    onSearch={setSearchInput}
                    onRange={(next) => {
                        if (next === "custom") setDialog("dates");
                        else
                            setFilters((current) => ({
                                ...current,
                                range: next,
                                from: "",
                                to: "",
                            }));
                    }}
                    onSort={setSort}
                    onFilters={() => setDialog("filters")}
                    onClear={clearFilters}
                    onMore={() => void list.fetchNextPage()}
                    onSchedule={() =>
                        setView({ kind: "schedule", intent: null, intentMissed: false })
                    }
                    onOpen={(visit) => setView({ kind: "detail", visit })}
                    onAction={handleAction}
                />
            )}

            {directTarget && (
                <VisitWorkflow
                    key={`${directTarget.mode}:${directTarget.id}:${directTarget.preview}`}
                    target={directTarget}
                    onClose={() => {
                        close();
                        router.replace(
                            closeDirectVisitHref(new URLSearchParams(searchParams.toString())),
                            { scroll: false },
                        );
                    }}
                />
            )}
            {!directTarget && view?.kind === "schedule" && (
                <ScheduleForm
                    intent={view.intent}
                    intentMissed={view.intentMissed}
                    onDone={close}
                    onBack={close}
                />
            )}
            {!directTarget && view?.kind === "reschedule" && (
                <ScheduleForm
                    key={view.visit.id}
                    visit={view.visit}
                    onDone={close}
                    onBack={close}
                />
            )}
            {!directTarget && view?.kind === "detail" && (
                <VisitDetail
                    visit={fresh(view.visit)}
                    now={now}
                    busy={busy}
                    onBack={close}
                    onReschedule={() => setView({ kind: "reschedule", visit: fresh(view.visit) })}
                    onScheduleAnother={() => {
                        const visit = fresh(view.visit);
                        setView({
                            kind: "schedule",
                            intent: {
                                leadId: visit.leadId,
                                clientId: visit.clientId,
                                clientName: visit.clientName,
                                propertyId: visit.propertyId,
                                propertyTitle: visit.propertyTitle,
                            },
                            intentMissed: false,
                        });
                    }}
                    onConfirm={(intent) => confirm(fresh(view.visit), intent, "detail")}
                />
            )}
            {!directTarget && view?.kind === "confirm" && (
                <AttendanceConfirmation
                    key={`${view.visit.id}-${view.intent}`}
                    visit={fresh(view.visit)}
                    intent={view.intent}
                    busy={busy}
                    error={actionError}
                    onClose={() => {
                        if (busy) return;
                        setActionError("");
                        setView(
                            view.from === "detail" ? { kind: "detail", visit: view.visit } : null,
                        );
                    }}
                    onConfirm={() => runConfirm(view.visit, view.intent)}
                />
            )}

            {dialog === "dates" && (
                <VisitDateRangeDialog
                    value={{ ...filters, range: "custom" }}
                    onClose={() => setDialog(null)}
                    onApply={(next) => {
                        setFilters(next);
                        setDialog(null);
                    }}
                />
            )}
            {dialog === "filters" && firstPage && (
                <VisitFiltersDialog
                    value={filters}
                    clientOptions={firstPage.clientOptions}
                    propertyOptions={firstPage.propertyOptions}
                    onClose={() => setDialog(null)}
                    onApply={(next) => {
                        setFilters(next);
                        setDialog(null);
                    }}
                />
            )}

            {visits.length > 0 && (
                <footer className={styles.pageFooter}>
                    <span className={styles.footerLine} aria-hidden />
                    <p>After each visit, mark it as completed or not attended.</p>
                    <span className={styles.footerLine} aria-hidden />
                </footer>
            )}
        </main>
    );
}
