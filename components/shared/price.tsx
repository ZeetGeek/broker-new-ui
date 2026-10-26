import type { Currency } from "@/lib/format/currency";
import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

export type PriceProps = {
    amountInr: number;
    isRent?: boolean;
    /** Defaults to the signed-in user's market currency. */
    currency?: Currency | null;
    className?: string;
};

export function Price({ amountInr, isRent = false, currency, className }: PriceProps) {
    const formatted = isRent
        ? formatRent(amountInr, currency ?? undefined)
        : formatPrice(amountInr, currency ?? undefined);

    return <span className={cn("tabular text-brand", className)}>{formatted}</span>;
}
