import { cn } from "@/lib/utils";

export function ListingScoreRing({ score, className }: { score: number; className?: string }) {
    const safeScore = Math.max(0, Math.min(100, score));
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    return (
        <div
            className={cn("relative shrink-0 block-16 inline-16", className)}
            aria-label={`Listing score ${safeScore} percent`}
        >
            <svg viewBox="0 0 64 64" className="-rotate-90 block-full inline-full" aria-hidden>
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke="var(--color-border-warm)"
                    strokeWidth="6"
                />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - safeScore / 100)}
                />
            </svg>
            <span
                className="
                  tabular absolute inset-0 flex items-center justify-center text-sm font-bold
                  text-ink
                "
            >
                {safeScore}%
            </span>
        </div>
    );
}
