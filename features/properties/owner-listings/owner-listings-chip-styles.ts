import { cn } from "@/lib/utils";

export function ownerListingsChipClassName(isActive: boolean) {
    return cn(
        `
          inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm
          font-semibold whitespace-nowrap transition-[background-color,border-color,box-shadow,color]
          duration-160
        `,
        isActive
            ? "border-brand bg-brand-soft text-brand-text shadow-none"
            : "border-border-warm bg-surface text-ink shadow-sm hover:border-ink/15 hover:shadow-md",
    );
}

export function ownerListingsChipCountClassName(isActive: boolean) {
    return cn(
        "tabular-nums",
        isActive ? "font-medium text-brand-text/75" : "font-medium text-ink-muted",
    );
}

export function formatChipCount(count: number, isLoading?: boolean) {
    if (isLoading) {
        return "( — )";
    }

    return `( ${count} )`;
}
