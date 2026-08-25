import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";

export type PlaceholderCardProps = {
    title: string;
    /** Tooltip copy for the title info icon. */
    info: string;
    className?: string;
};

export function PlaceholderCard({ title, info, className }: PlaceholderCardProps) {
    return (
        <section className={cn(DASHBOARD_CARD_SHELL, className)}>
            <CardLabel info={info}>{title}</CardLabel>
        </section>
    );
}
