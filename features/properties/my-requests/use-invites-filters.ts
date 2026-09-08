"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    DEFAULT_INVITES_FILTERS,
    type InvitesFilters,
    type InviteSort,
    type InviteStageFilter,
} from "@/features/properties/my-requests/invite-types";

const STAGES: InviteStageFilter[] = ["all", "pending", "accepted", "declined", "expired"];
const SORTS: InviteSort[] = ["recent", "oldest", "price_desc", "price_asc"];
const PAGE_SIZES = [10, 20, 50];

function parse(record: Record<string, string>): InvitesFilters {
    const stage = record.stage as InviteStageFilter;
    const sort = record.sort as InviteSort;
    const page = Number.parseInt(record.page ?? "", 10);
    const limit = Number.parseInt(record.limit ?? "", 10);

    return {
        q: record.q ?? "",
        stage: STAGES.includes(stage) ? stage : DEFAULT_INVITES_FILTERS.stage,
        sort: SORTS.includes(sort) ? sort : DEFAULT_INVITES_FILTERS.sort,
        page: Number.isFinite(page) && page > 0 ? page : DEFAULT_INVITES_FILTERS.page,
        limit: PAGE_SIZES.includes(limit) ? limit : DEFAULT_INVITES_FILTERS.limit,
    };
}

/** Only non-default values reach the URL, plus the tab that owns this view. */
function serialize(filters: InvitesFilters): URLSearchParams {
    const params = new URLSearchParams({ tab: "invites" });

    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.stage !== "all") params.set("stage", filters.stage);
    if (filters.sort !== "recent") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.limit !== DEFAULT_INVITES_FILTERS.limit) params.set("limit", String(filters.limit));

    return params;
}

export function useInvitesFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filters = useMemo(() => {
        const record: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            record[key] = value;
        });
        return parse(record);
    }, [searchParams]);

    const setFilters = useCallback(
        (next: InvitesFilters | ((prev: InvitesFilters) => InvitesFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            router.replace(`${pathname}?${serialize(resolved).toString()}`, { scroll: false });
        },
        [filters, pathname, router],
    );

    /** Any filter change resets to page 1 — page 4 of a new result set is empty. */
    const patchFilters = useCallback(
        (patch: Partial<InvitesFilters>) => {
            setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
        },
        [setFilters],
    );

    const clearFilters = useCallback(() => {
        setFilters({ ...DEFAULT_INVITES_FILTERS, limit: filters.limit });
    }, [filters.limit, setFilters]);

    return {
        filters,
        setFilters,
        patchFilters,
        clearFilters,
        hasActiveFilters: filters.q.trim().length > 0 || filters.stage !== "all",
        filterSignature: serialize(filters).toString(),
    };
}
