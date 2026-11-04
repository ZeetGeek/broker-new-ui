/** Illustrative design data until the API exposes earned brokerage history. */
const RECENT_COMMISSION = [
    { month: "Jun", sale: 45_000, rent: 15_000, deals: 2 },
    { month: "Jul", sale: 60_000, rent: 25_000, deals: 3 },
    { month: "Aug", sale: 75_000, rent: 30_000, deals: 3 },
    { month: "Sep", sale: 80_000, rent: 30_000, deals: 4 },
    { month: "Oct", sale: 110_000, rent: 40_000, deals: 4 },
    { month: "Nov", sale: 125_000, rent: 55_000, deals: 5 },
];

/** Two years of demo history for period selection and previous/next navigation. */
export const MOCK_COMMISSION = [
    ...Array.from({ length: 18 }, (_, index) => ({
        month: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(
            new Date(Date.UTC(2024, 11 + index, 1)),
        ),
        sale: 30_000 + (index % 6) * 8_000 + Math.floor(index / 6) * 10_000,
        rent: 10_000 + (index % 4) * 5_000,
        deals: 2 + (index % 3),
    })),
    ...RECENT_COMMISSION,
].map((month, index) => ({
    ...month,
    monthKey: new Date(Date.UTC(2024, 11 + index, 1)).toISOString().slice(0, 7),
    total: month.sale + month.rent,
    isToDate: index === 23,
}));
