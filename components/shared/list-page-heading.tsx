import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./list-page-heading.module.css";

/** Keep CRM headings compact on phones without shrinking their summaries. */
export function ListPageHeading({
    title,
    children,
    className,
}: {
    title: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <h1 className={cn("h3 text-start min-inline-0", styles.heading, className)}>
            <span className="text-ink">{title}</span>{" "}
            <span className={styles.summary}>{children}</span>
        </h1>
    );
}
