import type { ReactNode } from "react";

export function PropertiesPageShell({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="display-md">{title}</h1>
                <p className="body text-ink-muted">{description}</p>
            </div>

            {children}
        </div>
    );
}
