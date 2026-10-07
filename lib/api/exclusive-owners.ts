import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import {
    normalizeExclusiveOwnerPhone,
    type ExclusiveOwnerFormValues,
} from "@/lib/validation/exclusive-owner";

export type ExclusiveOwnerProperty = {
    id: string;
    title?: string | null;
    city?: string | null;
    address?: string | null;
    society?: string | null;
    photos?: unknown;
    salePrice?: string | number | null;
    monthlyRent?: string | number | null;
    propertyType?: string | null;
    bhkConfig?: string | null;
};

export type ExclusiveOwnerItem = {
    id: string;
    fullName: string;
    name: string;
    phone: string;
    email: string | null;
    ownerType: "individual" | "builder" | "company";
    society: string;
    area: string | null;
    city: string | null;
    pincode: string | null;
    fullAddress: string | null;
    reraNumber: string | null;
    source: string | null;
    notes: string | null;
    propertyCount: number;
    /** Present when the API nests inventory rows on the owner. */
    properties?: ExclusiveOwnerProperty[] | null;
    origin: "custom";
    createdAt: string | null;
    updatedAt: string | null;
};

export type ExclusiveOwnerListPage = {
    items: ExclusiveOwnerItem[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
};

export type ExclusiveOwnerListQuery = {
    search?: string;
    sort?: "recent" | "name";
    page?: number;
    limit?: number;
};

export type NewExclusiveOwnerInput = ExclusiveOwnerFormValues;

const mockExclusiveOwners: ExclusiveOwnerItem[] = [];

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function toPayload(input: NewExclusiveOwnerInput) {
    const phoneDigits = normalizeExclusiveOwnerPhone(input.phone);
    return {
        fullName: input.fullName.trim(),
        phone: `+91${phoneDigits}`,
        email: input.email.trim() || undefined,
        ownerType: input.ownerType,
        society: input.society.trim(),
        area: input.area?.trim() || undefined,
        city: input.city?.trim() || undefined,
        pincode: input.pincode?.trim() || undefined,
        fullAddress: input.fullAddress?.trim() || undefined,
        reraNumber: input.reraNumber?.trim() || undefined,
        source: input.source || undefined,
        notes: input.notes?.trim() || undefined,
    };
}

function matchesSearch(item: ExclusiveOwnerItem, search?: string) {
    const needle = search?.trim().toLowerCase();
    if (!needle) return true;
    return [
        item.fullName,
        item.phone,
        item.email ?? "",
        item.society,
        item.area ?? "",
        item.city ?? "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
}

export const exclusiveOwnersApi = {
    async list(
        query: ExclusiveOwnerListQuery = {},
        signal?: AbortSignal,
    ): Promise<ExclusiveOwnerListPage> {
        if (isMockMode()) {
            const filtered = mockExclusiveOwners.filter((item) =>
                matchesSearch(item, query.search),
            );
            const page = query.page ?? 1;
            const limit = query.limit ?? 20;
            const start = (page - 1) * limit;
            const items = filtered.slice(start, start + limit);
            return {
                items,
                total: filtered.length,
                page,
                totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
                limit,
            };
        }

        const params = new URLSearchParams();
        if (query.search?.trim()) params.set("search", query.search.trim());
        if (query.sort) params.set("sort", query.sort);
        if (query.page != null) params.set("page", String(query.page));
        if (query.limit != null) params.set("limit", String(query.limit));
        const qs = params.toString();
        return apiFetch<ExclusiveOwnerListPage>(`/exclusive-owners${qs ? `?${qs}` : ""}`, {
            signal,
        });
    },

    async create(input: NewExclusiveOwnerInput): Promise<ExclusiveOwnerItem> {
        if (isMockMode()) {
            const phoneDigits = normalizeExclusiveOwnerPhone(input.phone);
            const created: ExclusiveOwnerItem = {
                id: `exclusive_owner_${Date.now()}`,
                fullName: input.fullName.trim(),
                name: input.fullName.trim(),
                phone: `+91${phoneDigits}`,
                email: input.email.trim() || null,
                ownerType: input.ownerType,
                society: input.society.trim(),
                area: input.area?.trim() || null,
                city: input.city?.trim() || null,
                pincode: input.pincode?.trim() || null,
                fullAddress: input.fullAddress?.trim() || null,
                reraNumber: input.reraNumber?.trim() || null,
                source: input.source || null,
                notes: input.notes?.trim() || null,
                propertyCount: 0,
                origin: "custom",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockExclusiveOwners.unshift(created);
            return created;
        }

        return apiFetch<ExclusiveOwnerItem>("/exclusive-owners", {
            method: "POST",
            body: JSON.stringify(toPayload(input)),
        });
    },

    async remove(ownerId: string): Promise<void> {
        if (isMockMode()) {
            const index = mockExclusiveOwners.findIndex((item) => item.id === ownerId);
            if (index >= 0) mockExclusiveOwners.splice(index, 1);
            return;
        }
        await apiFetch<void>(`/exclusive-owners/${ownerId}`, { method: "DELETE" });
    },
};

export function exclusiveOwnerPhoneDigits(phone: string): string {
    const digits = digitsOnly(phone);
    return digits.length > 10 ? digits.slice(-10) : digits;
}
