import {
    applyListingUpdate,
    listingFromCreateInput,
    MOCK_MY_LISTINGS_SEED,
} from "@/features/properties/your-listings/mock-my-listings";
import type {
    CreateMyListingInput,
    MyListingItem,
    MyListingsFilters,
    MyListingsResult,
    MyListingStatus,
    UpdateMyListingInput,
} from "@/features/properties/your-listings/types";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

const PAGE_SIZE = 6;

/** In-memory store so create/update/delete survive within a browser session. */
let store: MyListingItem[] = MOCK_MY_LISTINGS_SEED.map((item) => ({ ...item }));
let idCounter = 100;

function delay(ms = 280): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesFilters(item: MyListingItem, filters: MyListingsFilters): boolean {
    const q = filters.q.trim().toLowerCase();
    if (q) {
        const haystack = `${item.title} ${item.locality} ${item.city} ${item.address}`.toLowerCase();
        if (!haystack.includes(q)) return false;
    }

    if (filters.type === "sale") {
        if (item.transactionType !== "sale" && item.transactionType !== "both") return false;
    }
    if (filters.type === "rent") {
        if (item.transactionType !== "rent" && item.transactionType !== "both") return false;
    }

    if (filters.propertyType && item.propertyType !== filters.propertyType) return false;

    if (filters.bhk.length > 0) {
        const wanted = filters.bhk.map((value) => Number(value));
        if (!wanted.includes(item.bhk)) return false;
    }

    if (filters.status && item.status !== filters.status) return false;

    return true;
}

function sortItems(items: MyListingItem[], sort: MyListingsFilters["sort"]): MyListingItem[] {
    const copy = [...items];
    if (sort === "price_asc" || sort === "price_desc") {
        const dir = sort === "price_asc" ? 1 : -1;
        copy.sort((a, b) => {
            const aPrice = a.saleAmountInr ?? a.rentAmountInr ?? 0;
            const bPrice = b.saleAmountInr ?? b.rentAmountInr ?? 0;
            return (aPrice - bPrice) * dir;
        });
        return copy;
    }

    copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return copy;
}

export type MyListingsSummary = {
    total: number;
    published: number;
    draft: number;
    unpublished: number;
    sale: number;
    rent: number;
};

export const myListingsApi = {
    async summary(): Promise<MyListingsSummary> {
        await delay(80);
        return {
            total: store.length,
            published: store.filter((item) => item.status === "published").length,
            draft: store.filter((item) => item.status === "draft").length,
            unpublished: store.filter((item) => item.status === "unpublished").length,
            sale: store.filter(
                (item) => item.transactionType === "sale" || item.transactionType === "both",
            ).length,
            rent: store.filter(
                (item) => item.transactionType === "rent" || item.transactionType === "both",
            ).length,
        };
    },

    async list(filters: Partial<MyListingsFilters> = {}): Promise<MyListingsResult> {
        await delay();
        const merged: MyListingsFilters = { ...DEFAULT_MY_LISTINGS_FILTERS, ...filters };
        const filtered = sortItems(store.filter((item) => matchesFilters(item, merged)), merged.sort);
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const page = Math.min(Math.max(1, merged.page), totalPages);
        const start = (page - 1) * PAGE_SIZE;

        return {
            items: filtered.slice(start, start + PAGE_SIZE),
            total,
            page,
            totalPages,
        };
    },

    async get(propertyId: string): Promise<MyListingItem | null> {
        await delay(180);
        return store.find((item) => item.id === propertyId) ?? null;
    },

    async create(input: CreateMyListingInput): Promise<MyListingItem> {
        await delay(400);
        idCounter += 1;
        const item = listingFromCreateInput(`own_${idCounter}`, input);
        store = [item, ...store];
        return item;
    },

    async update(propertyId: string, input: UpdateMyListingInput): Promise<MyListingItem | null> {
        await delay(400);
        const index = store.findIndex((item) => item.id === propertyId);
        if (index < 0) return null;
        const updated = applyListingUpdate(store[index]!, input);
        store = store.map((item, i) => (i === index ? updated : item));
        return updated;
    },

    async setStatus(propertyId: string, status: MyListingStatus): Promise<MyListingItem | null> {
        return this.update(propertyId, { status });
    },

    async remove(propertyId: string): Promise<boolean> {
        await delay(300);
        const before = store.length;
        store = store.filter((item) => item.id !== propertyId);
        return store.length < before;
    },

    /** Test helper — not used by UI. */
    reset() {
        store = MOCK_MY_LISTINGS_SEED.map((item) => ({ ...item }));
        idCounter = 100;
    },
};
