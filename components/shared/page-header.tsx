import type { ReactNode } from "react";

import type { PageSummaryLine } from "@/lib/format/page-summary";
import { cn } from "@/lib/utils";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";

import styles from "./page-header.module.css";

/** One page-heading layout for titles, live summaries and optional page actions. */
export function PageHeader({
    title,
    summary,
    summaryLines,
    summaryLoading = false,
    summaryError,
    summaryPlaceholder = "Loading your summary",
    description,
    actions,
    actionsOnDesktopOnly = false,
    children,
    id,
    className,
}: {
    title: ReactNode;
    summary?: ReactNode;
    summaryLines?: readonly PageSummaryLine[];
    summaryLoading?: boolean;
    summaryError?: string;
    summaryPlaceholder?: string;
    description?: ReactNode;
    actions?: ReactNode;
    actionsOnDesktopOnly?: boolean;
    children?: ReactNode;
    /** Identifies the h1 for a containing section's aria-labelledby. */
    id?: string;
    className?: string;
}) {
    const summaryContent = summaryLines ? (
        <RotatingHeaderSummary
            key={summaryLines.map((line) => `${line.text}:${line.mobile}`).join("|")}
            lines={summaryLines.map((line) => line.text)}
            mobileLines={summaryLines.map((line) => line.mobile)}
            isLoading={summaryLoading}
            errorMessage={summaryError}
            loadingPlaceholder={summaryPlaceholder}
            singleLineOnMobile
        />
    ) : (
        summary
    );
    return (
        <header className={cn(styles.header, className)}>
            <div className={styles.row}>
                <div className={styles.copy}>
                    <div className={cn("h3", styles.headline)}>
                        <h1
                            id={id}
                            className={styles.heading}
                            data-has-summary={summaryContent != null}
                        >
                            <span className={styles.title}>{title}</span>
                        </h1>
                        {summaryContent != null && (
                            <>
                                {" "}
                                <div className={styles.summary}>{summaryContent}</div>
                            </>
                        )}
                    </div>
                    {description && (
                        <div className={cn("body-sm", styles.description)}>{description}</div>
                    )}
                </div>
                {actions && (
                    <div className={styles.actions} data-desktop-only={actionsOnDesktopOnly}>
                        {actions}
                    </div>
                )}
            </div>
            {children}
        </header>
    );
}
