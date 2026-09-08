import type { ClientItem } from "@/features/clients/types";

const DAY_MS = 86_400_000;

function daysAgo(days: number): string {
    return new Date(Date.now() - days * DAY_MS).toISOString();
}

/** The broker's own book of buyers, for the attach-to-property picker. */
export const MOCK_CLIENTS: ClientItem[] = [
    {
        id: "cl_001",
        name: "Ankit Shah",
        phoneDigits: "9825011223",
        lookingFor: "buy",
        preferredLocalities: ["Vesu", "Piplod"],
        budgetMaxInr: 1_30_00_000,
        bhk: 3,
        lastContactedAt: daysAgo(2),
        attachedPropertyCount: 2,
    },
    {
        id: "cl_002",
        name: "Priya Nair",
        phoneDigits: "9898044556",
        lookingFor: "buy",
        preferredLocalities: ["Vesu", "Athwa"],
        budgetMaxInr: 1_20_00_000,
        bhk: 3,
        lastContactedAt: daysAgo(5),
        attachedPropertyCount: 1,
    },
    {
        id: "cl_003",
        name: "Mohit Agarwal",
        phoneDigits: "9727066778",
        lookingFor: "buy",
        preferredLocalities: ["Adajan", "Pal"],
        budgetMaxInr: 60_00_000,
        bhk: 2,
        lastContactedAt: daysAgo(1),
        attachedPropertyCount: 0,
    },
    {
        id: "cl_004",
        name: "Sneha Bhatt",
        phoneDigits: "9016077889",
        lookingFor: "rent",
        preferredLocalities: ["Piplod", "Vesu"],
        budgetMaxInr: 35_000,
        bhk: 2,
        lastContactedAt: daysAgo(9),
        attachedPropertyCount: 3,
    },
    {
        id: "cl_005",
        name: "Rajesh Kumar",
        phoneDigits: "9825099001",
        lookingFor: "buy",
        preferredLocalities: ["Vesu"],
        budgetMaxInr: 2_00_00_000,
        bhk: 4,
        lastContactedAt: daysAgo(14),
        attachedPropertyCount: 1,
    },
    {
        id: "cl_006",
        name: "Farida Contractor",
        phoneDigits: "9898122334",
        lookingFor: "buy",
        preferredLocalities: ["Athwa", "Ghod Dod Road"],
        budgetMaxInr: 95_00_000,
        bhk: 3,
        lastContactedAt: null,
        attachedPropertyCount: 0,
    },
    {
        id: "cl_007",
        name: "Deepak Solanki",
        phoneDigits: "9727144556",
        lookingFor: "rent",
        preferredLocalities: ["Adajan"],
        budgetMaxInr: 25_000,
        bhk: 2,
        lastContactedAt: daysAgo(4),
        attachedPropertyCount: 2,
    },
    {
        id: "cl_008",
        name: "Nisha Patel",
        phoneDigits: "9016155667",
        lookingFor: "buy",
        preferredLocalities: ["Katargam", "Ring Road"],
        budgetMaxInr: 75_00_000,
        bhk: null,
        lastContactedAt: daysAgo(21),
        attachedPropertyCount: 0,
    },
];

/**
 * Which buyers are already on which property, keyed by property id. Mirrors
 * what the API would return alongside the request.
 */
export const MOCK_PROPERTY_CLIENTS: Record<string, string[]> = {
    pr_099: ["cl_002"],
    pr_088: ["cl_004", "cl_007"],
};
