"use client";

import { useCallback } from "react";

import { PREF_KEYS } from "@/lib/prefs/keys";
import { useUrlSyncedPrefs } from "@/hooks/use-url-synced-prefs";

import {
    DEFAULT_INVITES_FILTERS,
    type InvitesFilters,
    type InviteSort,
    type InviteStageFilter,
} from "@/features/properties/my-requests/invite-types";
import type { DealListingType } from "@/features/properties/my-requests/types";

const STAGES: InviteStageFilter[] = ["all", "pending", "accepted", "declined", "expired"];
const SORTS: InviteSort[] = ["recent", "oldest", "price_desc", "price_asc"];
const TYPES: DealListingType[] = ["", "sale", "rent"];
const PAGE_SIZES = [10, 20, 50];

const INVITES_URL_KEYS = ["q", "stage", "sort", "type", "limit"] as const;

function parseRecord(record: Record<string, string>): InvitesFilters {
    const stage = record.stage as InviteStageFilter;
    const sort = record.sort as InviteSort;
    const type = (record.type ?? "") as DealListingType;
    const page = Number.parseInt(record.page ?? "", 10);
    const limit = Number.parseInt(record.limit ?? "", 10);

    return {
        q: record.q ?? "",
        stage: STAGES.includes(stage) ? stage : DEFAULT_INVITES_FILTERS.stage,
        sort: SORTS.includes(sort) ? sort : DEFAULT_INVITES_FILTERS.sort,
        type: TYPES.includes(type) ? type : DEFAULT_INVITES_FILTERS.type,
        page: Number.isFinite(page) && page > 0 ? page : DEFAULT_INVITES_FILTERS.page,
        limit: PAGE_SIZES.includes(limit) ? limit : DEFAULT_INVITES_FILTERS.limit,
    };
}

function serialize(filters: InvitesFilters): URLSearchParams {
    const params = new URLSearchParams({ tab: "invites" });

    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.stage !== "all") params.set("stage", filters.stage);
    if (filters.sort !== "recent") params.set("sort", filters.sort);
    if (filters.type) params.set("type", filters.type);
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.limit !== DEFAULT_INVITES_FILTERS.limit) params.set("limit", String(filters.limit));

    return params;
}

function parse(params: URLSearchParams): InvitesFilters {
    const record: Record<string, string> = {};
    params.forEach((value, key) => {
        record[key] = value;
    });
    return parseRecord(record);
}

function forStorage(filters: InvitesFilters): InvitesFilters {
    return { ...filters, page: 1 };
}

function isInvitesFilters(value: unknown): value is InvitesFilters {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<InvitesFilters>;
    return typeof v.q === "string" && typeof v.stage === "string" && typeof v.sort === "string";
}

export function useInvitesFilters() {
    const {
        value: filters,
        replace,
        ready,
    } = useUrlSyncedPrefs<InvitesFilters>({
        storageKey: PREF_KEYS.broker.requests.invitesFilters,
        urlKeys: INVITES_URL_KEYS,
        preserveUrlKeys: ["tab"],
        parse,
        serialize: (value) => serialize(forStorage(value)),
        forStorage,
        isValid: isInvitesFilters,
    });

    const setFilters = useCallback(
        (next: InvitesFilters | ((prev: InvitesFilters) => InvitesFilters)) => {
            const resolved = typeof next === "function" ? next(filters) : next;
            replace(resolved);
        },
        [filters, replace],
    );

    const patchFilters = useCallback(
        (patch: Partial<InvitesFilters>) => {
            setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
        },
        [setFilters],
    );

    const clearFilters = useCallback(() => {
        setFilters({ ...DEFAULT_INVITES_FILTERS, limit: filters.limit });
    }, [filters.limit, setFilters]);

    const resolved: InvitesFilters = {
        ...DEFAULT_INVITES_FILTERS,
        ...filters,
        type: filters.type === "sale" || filters.type === "rent" ? filters.type : "",
    };

    return {
        filters: resolved,
        setFilters,
        patchFilters,
        clearFilters,
        hasActiveFilters:
            resolved.q.trim().length > 0 || resolved.stage !== "all" || Boolean(resolved.type),
        filterSignature: serialize(resolved).toString(),
        scopeReady: ready,
    };
}
