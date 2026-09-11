import { cn } from "@/lib/utils";

const CHIP_HOVER_TRANSITION = "transition-[background-color,border-color,color] duration-160";

export function ownerListingsChipClassName(isActive: boolean) {
    return cn(
        `
          inline-flex shrink-0 items-center gap-1.5 rounded-control border px-4 text-sm font-semibold
          whitespace-nowrap block-[38px]
        `,
        CHIP_HOVER_TRANSITION,
        isActive
            ? `
              border-brand bg-brand-soft text-brand-text shadow-none
              hover:border-brand-text hover:bg-brand-soft/80
            `
            : `
              border-border-warm bg-surface text-ink shadow-sm
              hover:border-ink/25 hover:bg-surface-muted/60
            `,
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
