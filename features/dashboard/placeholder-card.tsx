import { cn } from "@/lib/utils";

export type PlaceholderCardProps = {
    title: string;
    className?: string;
};

export function PlaceholderCard({ title, className }: PlaceholderCardProps) {
    return (
        <section
            className={cn(
                "flex min-h-48 flex-col rounded-card border border-border-warm bg-surface p-4 md:p-5",
                className,
            )}
        >
            <p className="eyebrow">{title}</p>
        </section>
    );
}
