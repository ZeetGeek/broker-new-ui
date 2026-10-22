import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";
import { derive } from "@/lib/visibility/derive";
import { FIELD_RULES } from "@/lib/visibility/rules";

import {
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES,
    type PropertyCategory,
} from "@/constants/property";

export type PropertyListCriteria = {
    where: string;
    type: "" | "sale" | "rent";
    min: string;
    max: string;
    minAreaSqft: string;
    maxAreaSqft: string;
    category: PropertyCategory | "";
    propertyType: string;
    bhk: string[];
    bathrooms: string[];
    balconies: string[];
    parking: string[];
    floors: string[];
    facing: string[];
    propertyConditions: string[];
    propertyAges: string[];
    suitableFor: string[];
    furnishing: "" | "furnished" | "semi" | "unfurnished";
    listedWithinDays: string;
    minCommissionPercent: string;
    maxCommissionPercent: string;
    minCommissionAmount: string;
    maxCommissionAmount: string;
};

export const EMPTY_PROPERTY_CRITERIA: PropertyListCriteria = {
    where: "",
    type: "",
    min: "",
    max: "",
    minAreaSqft: "",
    maxAreaSqft: "",
    category: "",
    propertyType: "",
    bhk: [],
    bathrooms: [],
    balconies: [],
    parking: [],
    floors: [],
    facing: [],
    propertyConditions: [],
    propertyAges: [],
    suitableFor: [],
    furnishing: "",
    listedWithinDays: "",
    minCommissionPercent: "",
    maxCommissionPercent: "",
    minCommissionAmount: "",
    maxCommissionAmount: "",
};

const ARRAY_KEYS = [
    "bhk",
    "bathrooms",
    "balconies",
    "parking",
    "floors",
    "facing",
    "propertyConditions",
    "propertyAges",
    "suitableFor",
] as const;

const typeAliases: Record<string, string> = {
    flat: "apartment",
    office: "office_space",
    farmhouse: "farm_house",
    plot: "residential_plot",
    agricultural: "agricultural_land",
    one_rk: "1rk",
};
export function normalizePropertySubtype(value: string) {
    const key = value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
    return typeAliases[key] ?? key;
}

export function normalizePropertyCriteria(
    value?: Partial<PropertyListCriteria> | null,
): PropertyListCriteria {
    const next = { ...EMPTY_PROPERTY_CRITERIA, ...value };
    if (next.type !== "sale" && next.type !== "rent") next.type = "";
    if (!PROPERTY_CATEGORY_OPTIONS.some((option) => option.value === next.category))
        next.category = "";
    for (const key of ["min", "max", "minAreaSqft", "maxAreaSqft"] as const) {
        if (
            typeof next[key] !== "string" ||
            !next[key].trim() ||
            !Number.isFinite(Number(next[key])) ||
            Number(next[key]) < 0
        )
            next[key] = "";
    }
    for (const key of [
        "listedWithinDays",
        "minCommissionPercent",
        "maxCommissionPercent",
        "minCommissionAmount",
        "maxCommissionAmount",
    ] as const) {
        if (
            typeof next[key] !== "string" ||
            !next[key].trim() ||
            !Number.isFinite(Number(next[key])) ||
            Number(next[key]) < 0
        )
            next[key] = "";
    }
    for (const key of ARRAY_KEYS) {
        next[key] = Array.isArray(next[key])
            ? [...new Set(next[key].filter((item): item is string => typeof item === "string"))]
            : [];
    }
    if (!["", "furnished", "semi", "unfurnished"].includes(next.furnishing)) {
        next.furnishing = "";
    }
    for (const [min, max] of [
        ["min", "max"],
        ["minAreaSqft", "maxAreaSqft"],
    ] as const) {
        if (next[min] && next[max] && Number(next[min]) > Number(next[max]))
            [next[min], next[max]] = [next[max], next[min]];
    }
    next.where = typeof next.where === "string" ? next.where.trim() : "";
    next.propertyType =
        typeof next.propertyType === "string" ? normalizePropertySubtype(next.propertyType) : "";
    const allowed: readonly string[] = next.category
        ? PROPERTY_TYPES[next.category]
        : Object.values(PROPERTY_TYPES).flat();
    if (!allowed.includes(next.propertyType)) next.propertyType = "";
    return next;
}

export function propertyCriteriaCount(value?: Partial<PropertyListCriteria> | null) {
    const v = normalizePropertyCriteria(value);
    return [
        v.where,
        v.type,
        v.min || v.max,
        v.minAreaSqft || v.maxAreaSqft,
        v.category,
        v.propertyType,
        v.bhk.length,
        v.bathrooms.length,
        v.balconies.length,
        v.parking.length,
        v.floors.length,
        v.facing.length,
        v.propertyConditions.length,
        v.propertyAges.length,
        v.suitableFor.length,
        v.furnishing,
        v.listedWithinDays,
        v.minCommissionPercent || v.maxCommissionPercent,
        v.minCommissionAmount || v.maxCommissionAmount,
    ].filter(Boolean).length;
}

export function propertyCriteriaShowBhk(value?: Partial<PropertyListCriteria>) {
    const v = normalizePropertyCriteria(value);
    const categories = v.category
        ? [v.category]
        : PROPERTY_CATEGORY_OPTIONS.map((option) => option.value).filter(
              (category) =>
                  !v.propertyType ||
                  (PROPERTY_TYPES[category] as readonly string[]).includes(v.propertyType),
          );
    return categories.some((category) => {
        const draft = {
            ...DEFAULT_PROPERTY_DRAFT,
            basics: { ...DEFAULT_PROPERTY_DRAFT.basics, category, propertyType: v.propertyType },
        };
        return FIELD_RULES["details.bedrooms"].visible(derive(draft));
    });
}

export function parsePropertyCriteria(raw: string | undefined) {
    try {
        return normalizePropertyCriteria(raw ? JSON.parse(raw) : undefined);
    } catch {
        return { ...EMPTY_PROPERTY_CRITERIA };
    }
}

export function serializePropertyCriteria(
    params: URLSearchParams,
    value?: Partial<PropertyListCriteria>,
) {
    if (propertyCriteriaCount(value))
        params.set("propertyFilters", JSON.stringify(normalizePropertyCriteria(value)));
}

/** Facts already supplied by property, representation, lead, or visit payloads. */
export type PropertyFilterRecord = {
    locality?: string | null;
    city?: string | null;
    address?: string | null;
    category?: string | null;
    propertyType?: string | null;
    subtype?: string | null;
    propertyTypeLabel?: string | null;
    areaSqft?: number | null;
    isRent?: boolean;
    transactionType?: string | null;
    amountInr?: number | null;
    saleAmountInr?: number | null;
    rentAmountInr?: number | null;
    salePrice?: string | number | null;
    monthlyRent?: string | number | null;
    bhk?: number | null;
    bathrooms?: number | null;
    balconies?: number | null;
    parkingSpaces?: number | null;
    floorNumber?: number | null;
    facing?: string | null;
    propertyCondition?: string | null;
    propertyAge?: string | null;
    suitableFor?: string[] | null;
    furnishing?: string | null;
    listedAt?: string | null;
    requestedAt?: string | null;
    invitedAt?: string | null;
    commissionPercent?: number | null;
    commissionAmount?: number | null;
};

function matchesCount(values: string[], actual: number | null | undefined, plusAt: number) {
    if (values.length === 0) return true;
    if (actual == null) return false;
    return values.some((value) => {
        const count = Number(value);
        return Number.isFinite(count) && (count === plusAt ? actual >= plusAt : actual === count);
    });
}

function matchesFloor(values: string[], floor: number | null | undefined) {
    if (values.length === 0) return true;
    if (floor == null) return false;
    return values.some((value) => {
        if (value === "ground") return floor === 0;
        if (value === "low") return floor >= 1 && floor <= 5;
        if (value === "mid") return floor >= 6 && floor <= 15;
        if (value === "high") return floor >= 16;
        return false;
    });
}

function normalizeFacet(value: string | null | undefined) {
    return (value ?? "")
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
}

function normalizeFurnishing(value: string | null | undefined) {
    const normalized = normalizeFacet(value);
    if (normalized === "fully_furnished") return "furnished";
    if (normalized === "semi_furnished") return "semi";
    return normalized;
}

export function matchesPropertyCriteria(
    item: PropertyFilterRecord,
    value?: Partial<PropertyListCriteria>,
) {
    const v = normalizePropertyCriteria(value);
    if (!propertyCriteriaCount(v)) return true;
    if (
        v.where &&
        ![item.locality, item.city, item.address]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(v.where.toLowerCase())
    )
        return false;
    const subtype = normalizePropertySubtype(
        item.subtype || item.propertyTypeLabel || item.propertyType || "",
    );
    const rawCategory = item.category || item.propertyType || item.propertyTypeLabel || "";
    const category = PROPERTY_CATEGORY_OPTIONS.some(
        (option) => option.value === rawCategory.toLowerCase(),
    )
        ? rawCategory.toLowerCase()
        : "";
    if (
        v.category &&
        (category
            ? category !== v.category
            : !(PROPERTY_TYPES[v.category] as readonly string[]).includes(subtype))
    )
        return false;
    if (v.propertyType && subtype !== v.propertyType) return false;
    const transaction =
        item.transactionType || (item.isRent === undefined ? "" : item.isRent ? "rent" : "sale");
    if (v.type && transaction !== "both" && transaction !== v.type) return false;
    if (v.minAreaSqft && (item.areaSqft == null || item.areaSqft < Number(v.minAreaSqft)))
        return false;
    if (v.maxAreaSqft && (item.areaSqft == null || item.areaSqft > Number(v.maxAreaSqft)))
        return false;
    if (!matchesCount(v.bhk, item.bhk, 5)) return false;
    if (!matchesCount(v.bathrooms, item.bathrooms, 5)) return false;
    if (!matchesCount(v.balconies, item.balconies, 4)) return false;
    if (!matchesCount(v.parking, item.parkingSpaces, 4)) return false;
    if (!matchesFloor(v.floors, item.floorNumber)) return false;
    if (
        v.facing.length > 0 &&
        (!item.facing || !v.facing.map(normalizeFacet).includes(normalizeFacet(item.facing)))
    )
        return false;
    if (
        v.propertyConditions.length > 0 &&
        (!item.propertyCondition ||
            !v.propertyConditions
                .map(normalizeFacet)
                .includes(normalizeFacet(item.propertyCondition)))
    )
        return false;
    if (
        v.propertyAges.length > 0 &&
        (!item.propertyAge ||
            !v.propertyAges.map(normalizeFacet).includes(normalizeFacet(item.propertyAge)))
    )
        return false;
    if (
        v.suitableFor.length > 0 &&
        (!item.suitableFor ||
            !v.suitableFor
                .map(normalizeFacet)
                .some((value) => item.suitableFor?.map(normalizeFacet).includes(value)))
    )
        return false;
    if (v.furnishing && normalizeFurnishing(item.furnishing) !== v.furnishing) return false;
    if (v.listedWithinDays) {
        const listedAt = item.listedAt || item.requestedAt || item.invitedAt;
        if (!listedAt) return false;
        const listedTime = new Date(listedAt).getTime();
        if (
            !Number.isFinite(listedTime) ||
            Date.now() - listedTime > Number(v.listedWithinDays) * 86_400_000
        )
            return false;
    }
    if (
        v.minCommissionPercent &&
        (item.commissionPercent == null || item.commissionPercent < Number(v.minCommissionPercent))
    )
        return false;
    if (
        v.maxCommissionPercent &&
        (item.commissionPercent == null || item.commissionPercent > Number(v.maxCommissionPercent))
    )
        return false;
    if (
        v.minCommissionAmount &&
        (item.commissionAmount == null || item.commissionAmount < Number(v.minCommissionAmount))
    )
        return false;
    if (
        v.maxCommissionAmount &&
        (item.commissionAmount == null || item.commissionAmount > Number(v.maxCommissionAmount))
    )
        return false;
    if (v.min || v.max) {
        const amounts =
            v.type === "rent"
                ? [item.rentAmountInr ?? item.monthlyRent ?? (item.isRent ? item.amountInr : null)]
                : v.type === "sale"
                  ? [
                        item.saleAmountInr ??
                            item.salePrice ??
                            (item.isRent === false ? item.amountInr : null),
                    ]
                  : [
                        item.saleAmountInr ?? item.salePrice,
                        item.rentAmountInr ?? item.monthlyRent,
                        item.amountInr,
                    ];
        if (
            !amounts.some(
                (amount) =>
                    amount != null &&
                    Number.isFinite(Number(amount)) &&
                    (!v.min || Number(amount) >= Number(v.min)) &&
                    (!v.max || Number(amount) <= Number(v.max)),
            )
        )
            return false;
    }
    return true;
}

/** Filter only after loading every page; never silently search just the first page. */
export async function collectPropertyPages<T>(
    load: (page: number) => Promise<{ items: T[]; totalPages: number }>,
): Promise<T[]> {
    const first = await load(1);
    const items = [...first.items];
    for (let page = 2; page <= first.totalPages; page++) items.push(...(await load(page)).items);
    return items;
}
