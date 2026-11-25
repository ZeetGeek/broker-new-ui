import { ApiError, apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { isTestSampleMode } from "@/lib/testing/test-lab";
import { withTestNetwork } from "@/lib/testing/test-network";
import {
    type ExclusiveOwnerFormValues,
    normalizeExclusiveOwnerPhone,
} from "@/lib/validation/exclusive-owner";

import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";

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
    country?: string | null;
    state?: string | null;
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

/** Live owner updates have no documented API contract in this frontend yet. */
export function canEditExclusiveOwners(): boolean {
    return isMockMode();
}

const mockExclusiveOwners: ExclusiveOwnerItem[] = isTestSampleMode()
    ? MOCK_MY_LISTINGS_SEED.map((listing, index) => ({
          id: listing.exclusiveOwnerId ?? `sample-owner-${listing.id}`,
          fullName:
              listing.ownerName ||
              ["Aarav Shah", "Priya Desai", "Mehul Patel", "Nisha Mehta"][index % 4] +
                  (index > 3 ? ` ${index + 1}` : ""),
          name:
              listing.ownerName ||
              ["Aarav Shah", "Priya Desai", "Mehul Patel", "Nisha Mehta"][index % 4] +
                  (index > 3 ? ` ${index + 1}` : ""),
          phone: `+91980000${String(index).padStart(4, "0")}`,
          email: null,
          ownerType: "individual",
          society: listing.society || "Sample society",
          area: listing.locality,
          country: "India",
          state: null,
          city: listing.city,
          pincode: listing.pinCode,
          fullAddress: listing.address,
          reraNumber: null,
          source: "personal_contact",
          notes: "Sample owner for testing.",
          propertyCount: 1,
          properties: [
              {
                  id: listing.id,
                  title: listing.title,
                  city: listing.city,
                  address: listing.address,
                  photos: listing.imageSrcs,
                  salePrice: listing.saleAmountInr,
                  monthlyRent: listing.rentAmountInr,
                  propertyType: listing.category,
              },
          ],
          origin: "custom",
          createdAt: listing.createdAt,
          updatedAt: listing.updatedAt,
      }))
    : [];

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
        society: input.society?.trim() || undefined,
        area: input.area?.trim() || undefined,
        country: input.country?.trim() || undefined,
        state: input.state?.trim() || undefined,
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

export const exclusiveOwnersApi = withTestNetwork({
    async list(
        query: ExclusiveOwnerListQuery = {},
        signal?: AbortSignal,
    ): Promise<ExclusiveOwnerListPage> {
        if (isMockMode()) {
            const { getMockMyListings } = await import("@/lib/api/my-listings");
            const inventory = getMockMyListings();
            const owners = mockExclusiveOwners.map((owner) => {
                const properties = inventory.filter(
                    (listing) => listing.exclusiveOwnerId === owner.id && !listing.deletedAt,
                );
                return {
                    ...owner,
                    propertyCount: properties.length,
                    properties: properties.map((listing) => ({
                        id: listing.id,
                        title: listing.title,
                        city: listing.city,
                        address: listing.address,
                        photos: listing.imageSrcs,
                        salePrice: listing.saleAmountInr,
                        monthlyRent: listing.rentAmountInr,
                        propertyType: listing.category,
                        bhkConfig: listing.configLabel,
                    })),
                };
            });
            const filtered = owners.filter((item) => matchesSearch(item, query.search));
            filtered.sort((a, b) =>
                query.sort === "name"
                    ? a.fullName.localeCompare(b.fullName)
                    : Date.parse(b.updatedAt || b.createdAt || "") -
                          Date.parse(a.updatedAt || a.createdAt || "") || 0,
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
                society: input.society?.trim() || "",
                area: input.area?.trim() || null,
                country: input.country?.trim() || null,
                state: input.state?.trim() || null,
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

    async update(ownerId: string, input: NewExclusiveOwnerInput): Promise<ExclusiveOwnerItem> {
        if (!isMockMode())
            throw new Error(
                "Owner editing is not available yet. Your existing details have not changed.",
            );
        const index = mockExclusiveOwners.findIndex((owner) => owner.id === ownerId);
        if (index < 0) throw new ApiError("Owner not found", 404);
        const payload = toPayload(input);
        const current = mockExclusiveOwners[index];
        const updated: ExclusiveOwnerItem = {
            ...current,
            ...payload,
            name: payload.fullName,
            email: payload.email ?? null,
            society: payload.society ?? "",
            area: payload.area ?? null,
            country: payload.country ?? null,
            state: payload.state ?? null,
            city: payload.city ?? null,
            pincode: payload.pincode ?? null,
            fullAddress: payload.fullAddress ?? null,
            reraNumber: payload.reraNumber ?? null,
            source: payload.source ?? null,
            notes: payload.notes ?? null,
            updatedAt: new Date().toISOString(),
        };
        mockExclusiveOwners[index] = updated;
        const { getMockMyListings } = await import("@/lib/api/my-listings");
        for (const listing of getMockMyListings()) {
            if (listing.exclusiveOwnerId === ownerId) {
                listing.ownerName = updated.fullName;
                listing.ownerPhoneDigits = exclusiveOwnerPhoneDigits(updated.phone);
            }
        }
        return updated;
    },

    async remove(ownerId: string): Promise<void> {
        if (isMockMode()) {
            const index = mockExclusiveOwners.findIndex((item) => item.id === ownerId);
            if (index >= 0) mockExclusiveOwners.splice(index, 1);
            return;
        }
        await apiFetch<void>(`/exclusive-owners/${ownerId}`, { method: "DELETE" });
    },
});

export function exclusiveOwnerPhoneDigits(phone: string): string {
    const digits = digitsOnly(phone);
    return digits.length > 10 ? digits.slice(-10) : digits;
}
