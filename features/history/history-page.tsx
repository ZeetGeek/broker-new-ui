"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
    formatActivityDayLabel,
    formatDateIn,
    formatDateIso,
    formatTimeIn,
} from "@/lib/format/date";
import { matchesCrmSearch } from "@/lib/search/crm-search";
import { CRM_SEARCH_HELP } from "@/lib/search/search-help";

import { EmptyStateAction } from "@/components/empty-state";
import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { CardLink } from "@/components/shared/card-link";
import { EmptyState } from "@/components/shared/empty-state";
import { Activity, type AppIcon, ArrowRight, RefreshCw, Search } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
import {
    ListStatusSelect,
    ResponsiveListToolbar,
} from "@/components/shared/responsive-list-toolbar";
import { Skeleton } from "@/components/shared/skeleton";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { HistoryResultsSkeleton } from "./history-skeleton";

import styles from "./history.module.css";

export type HistoryEntry = {
    id: string;
    title: string;
    body?: string | null;
    createdAt: string | null;
    href?: string | null;
    category: string;
    Icon: AppIcon;
    iconTone?: "brand" | "urgent" | "danger" | "neutral";
    unread?: boolean;
    action?: ReactNode;
};

export function HistoryPage({
    title,
    summary,
    entries,
    loading,
    error,
    refreshing,
    onRefresh,
    primaryAction,
    footer,
    emptyDescription,
    readStatus = false,
    loadingMore = false,
}: {
    title: string;
    summary: string;
    entries: HistoryEntry[];
    loading: boolean;
    error: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    primaryAction?: ReactNode;
    footer?: ReactNode;
    emptyDescription: string;
    readStatus?: boolean;
    loadingMore?: boolean;
}) {
    const [search, setSearch] = useState("");
    const [settledSearch, setSettledSearch] = useState("");
    useEffect(() => {
        const timer = window.setTimeout(() => setSettledSearch(search), 300);
        return () => window.clearTimeout(timer);
    }, [search]);
    const searching = search !== settledSearch;
    const resultsLoading = loading || refreshing || searching;
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState("newest");
    const [status, setStatus] = useState("all");
    const categories = [...new Set(entries.map((item) => item.category))].sort();
    const supportsRead = readStatus || entries.some((item) => item.unread !== undefined);
    const groups = useMemo(() => {
        const rows = entries
            .filter(
                (item) =>
                    (category === "all" || category === item.category) &&
                    (status === "all" || item.unread) &&
                    matchesCrmSearch(settledSearch, [item.title, item.body, item.category]),
            )
            .sort((a, b) => {
                const left = a.createdAt ? Date.parse(a.createdAt) : 0;
                const right = b.createdAt ? Date.parse(b.createdAt) : 0;
                return (
                    (sort === "newest" ? -1 : 1) *
                    ((Number.isFinite(left) ? left : 0) - (Number.isFinite(right) ? right : 0))
                );
            });
        const days = new Map<string, HistoryEntry[]>();
        for (const item of rows) {
            const key =
                item.createdAt && Number.isFinite(Date.parse(item.createdAt))
                    ? formatDateIso(new Date(item.createdAt))
                    : "undated";
            const group = days.get(key) ?? [];
            group.push(item);
            days.set(key, group);
        }
        return [...days.entries()];
    }, [entries, settledSearch, category, status, sort]);
    const filtered = Boolean(search || category !== "all" || status !== "all");
    const clear = () => {
        setSearch("");
        setSettledSearch("");
        setCategory("all");
        setStatus("all");
        setSort("newest");
    };

    return (
        <div className={styles.page}>
            <PortalSectionNav>
                <header className={styles.header}>
                    <h1 className={`h3 ${styles.title}`}>
                        {title}.{" "}
                        <span className={styles.summary}>
                            {loading ? (
                                <Skeleton className="inline-block block-5 inline-48 max-inline-full" />
                            ) : (
                                summary
                            )}
                        </span>
                    </h1>
                </header>
            </PortalSectionNav>
            <ResponsiveListToolbar
                selection={
                    <div className={styles.filters}>
                        <div className={styles.typeSelect}>
                            <ListStatusSelect
                                label="Type"
                                isLoading={loading}
                                value={category}
                                onChange={setCategory}
                                options={[
                                    {
                                        value: "all",
                                        label: "All types",
                                        dotClassName: "bg-brand",
                                        count: entries.length,
                                    },
                                    ...categories.map((name) => ({
                                        value: name,
                                        label: name,
                                        dotClassName: "bg-brand",
                                        count: entries.filter((item) => item.category === name)
                                            .length,
                                    })),
                                ]}
                            />
                        </div>
                        {supportsRead ? (
                            <ListToolbarSelect
                                label="Read status"
                                value={status}
                                onChange={setStatus}
                                defaultValue="all"
                                options={[
                                    { value: "all", label: "All notifications" },
                                    { value: "unread", label: "Unread only" },
                                ]}
                            />
                        ) : null}
                    </div>
                }
                search={
                    <ListSearchField
                        fullWidth
                        value={search}
                        onChange={setSearch}
                        debounceMs={0}
                        aria-label={`Search ${title.toLowerCase()}`}
                        placeholder="Search here..."
                        searchHelp={CRM_SEARCH_HELP.history}
                    />
                }
                actions={
                    <div className={styles.toolbarActions}>
                        <ListToolbarSelect
                            label="Sort"
                            value={sort}
                            onChange={setSort}
                            options={[
                                { value: "newest", label: "Newest first" },
                                { value: "oldest", label: "Oldest first" },
                            ]}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="block-[38px]! pointer-coarse:min-block-11"
                            loading={refreshing}
                            onClick={onRefresh}
                        >
                            <RefreshCw aria-hidden />
                            Refresh
                        </Button>
                        {primaryAction}
                    </div>
                }
            />
            {error ? (
                <EmptyState
                    icon={Activity}
                    variant="error"
                    heading="Couldn't load history"
                    description="Check your connection and try again."
                >
                    <EmptyStateAction label="Try again" icon={RefreshCw} onClick={onRefresh} />
                </EmptyState>
            ) : null}
            {resultsLoading ? (
                <HistoryResultsSkeleton
                    label={
                        searching
                            ? "Searching history"
                            : refreshing
                              ? "Refreshing history"
                              : "Loading history"
                    }
                    readStatus={supportsRead}
                />
            ) : groups.length ? (
                <div className={styles.groups}>
                    {groups.map(([day, rows]) => (
                        <section key={day} aria-labelledby={`history-${day}`}>
                            <div className={styles.groupHeading}>
                                <h2 id={`history-${day}`}>
                                    {day === "undated"
                                        ? "Earlier"
                                        : formatActivityDayLabel(
                                              new Date(rows[0].createdAt!),
                                              new Date(),
                                              { includeYear: true },
                                          )}
                                </h2>
                                <span>
                                    {rows.length}{" "}
                                    {supportsRead
                                        ? rows.length === 1
                                            ? "Notification"
                                            : "Notifications"
                                        : rows.length === 1
                                          ? "Update"
                                          : "Updates"}
                                </span>
                            </div>
                            <ol className={styles.list}>
                                {rows.map((item) => (
                                    <li
                                        key={item.id}
                                        className={styles.row}
                                        data-linked-card={item.href ? "" : undefined}
                                    >
                                        {item.href ? (
                                            <CardLink
                                                href={item.href}
                                                label={`Open ${item.title}`}
                                            />
                                        ) : null}
                                        <div className={styles.subject}>
                                            <span
                                                className={styles.icon}
                                                data-tone={item.iconTone ?? "brand"}
                                            >
                                                <item.Icon
                                                    aria-hidden
                                                    size={20}
                                                    strokeWidth={1.8}
                                                />
                                            </span>
                                            <div className={styles.copy}>
                                                <p
                                                    data-card-title
                                                    className="body-sm font-semibold text-ink"
                                                >
                                                    {item.title}
                                                </p>
                                                {item.body ? (
                                                    <p className="body-sm text-ink-muted">
                                                        {item.body}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className={styles.when}>
                                            {item.createdAt &&
                                            Number.isFinite(Date.parse(item.createdAt)) ? (
                                                <>
                                                    <span>
                                                        {formatDateIn(new Date(item.createdAt))}
                                                    </span>
                                                    <time dateTime={item.createdAt}>
                                                        {formatTimeIn(new Date(item.createdAt))}
                                                    </time>
                                                </>
                                            ) : (
                                                <span>Date unavailable</span>
                                            )}
                                        </div>
                                        <div className={styles.badge}>
                                            <Badge variant={item.unread ? "brand" : "neutral"}>
                                                {item.unread === undefined
                                                    ? item.category
                                                    : item.unread
                                                      ? "Unread"
                                                      : "Read"}
                                            </Badge>
                                        </div>
                                        <div className={styles.actions}>
                                            {item.action}
                                            {item.href ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    nativeButton={false}
                                                    render={<Link href={item.href} />}
                                                >
                                                    Open
                                                    <ArrowRight aria-hidden />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    ))}
                </div>
            ) : !error ? (
                <EmptyState
                    icon={Activity}
                    size="page"
                    variant={filtered ? "filtered" : "default"}
                    heading={filtered ? "No matching updates" : "You're up to date"}
                    description={
                        filtered
                            ? "Try a different search or type, or clear your filters."
                            : emptyDescription
                    }
                >
                    {filtered ? (
                        <EmptyStateAction
                            label="Clear search & filters"
                            icon={Search}
                            onClick={clear}
                        />
                    ) : null}
                </EmptyState>
            ) : null}
            {!resultsLoading && loadingMore ? (
                <HistoryResultsSkeleton
                    label="Loading more history"
                    rows={3}
                    readStatus={supportsRead}
                />
            ) : null}
            {!resultsLoading && !loadingMore ? footer : null}
        </div>
    );
}
