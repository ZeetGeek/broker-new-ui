import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

export type PriceProps = {
    amountInr: number;
    isRent?: boolean;
    className?: string;
};

export function Price({ amountInr, isRent = false, className }: PriceProps) {
    const formatted = isRent ? formatRentInr(amountInr) : formatPriceInr(amountInr);

    return <span className={cn("tabular text-brand", className)}>{formatted}</span>;
}
