import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";

export type PlaceholderCardProps = {
    title: string;
    /** Tooltip copy for the title info icon. */
    info: string;
    className?: string;
};

export function PlaceholderCard({ title, info, className }: PlaceholderCardProps) {
    return (
        <section
            className={cn(
                `
                  flex min-h-[22rem] flex-col overflow-visible rounded-card border
                  border-border-warm bg-surface p-8 shadow-sm
                  md:h-full
                `,
                className,
            )}
        >
            <CardLabel info={info}>{title}</CardLabel>
        </section>
    );
}
