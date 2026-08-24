import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";

export type PlaceholderCardProps = {
    title: string;
    className?: string;
};

export function PlaceholderCard({ title, className }: PlaceholderCardProps) {
    return (
        <section
            className={cn(
                `
                  flex min-h-[22rem] flex-col rounded-card border border-border-warm bg-surface
                  p-4 shadow-sm
                  md:h-full md:p-5
                `,
                className,
            )}
        >
            <CardLabel>{title}</CardLabel>
        </section>
    );
}
