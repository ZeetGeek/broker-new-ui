import { formatPriceInr, formatRentInr } from "@/lib/format/price";

export function listingPriceLabel(input: {
    transactionType?: string | null;
    salePrice?: string | null;
    monthlyRent?: string | null;
}): string | null {
    const sale = amount(input.salePrice);
    const rent = amount(input.monthlyRent);
    if (input.transactionType === "rent") {
        return rent == null ? null : formatRentInr(rent);
    }
    if (sale != null) return formatPriceInr(sale);
    if (rent != null) return formatRentInr(rent);
    return null;
}

export function amountLabel(value: string | null | undefined): string | null {
    const parsed = amount(value);
    return parsed == null ? null : formatPriceInr(parsed);
}

function amount(value: string | null | undefined): number | null {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}
