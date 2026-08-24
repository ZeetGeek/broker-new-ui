import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: string; description: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 text-center">
            <h1 className="h1 text-ink">{title}</h1>
            <p className="body text-ink-muted">{description}</p>
        </div>
    );
}
