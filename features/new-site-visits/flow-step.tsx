import type { ReactNode } from "react";

import { ArrowLeft } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import styles from "./visits.module.css";

export function FlowStep({
    title,
    description,
    onBack,
    backLabel = "Back to form",
    children,
    aside,
}: {
    title: string;
    description: string;
    onBack: () => void;
    backLabel?: string;
    children: ReactNode;
    aside?: ReactNode;
}) {
    return (
        <>
            <Button variant="ghost" className={styles.back} onClick={onBack}>
                <ArrowLeft aria-hidden />
                {backLabel}
            </Button>
            <header className={styles.heading}>
                <div>
                    <h1 className="h3 text-ink">{title}</h1>
                    <p>{description}</p>
                </div>
            </header>
            <div className={aside ? styles.workGrid : styles.selectionWidth}>
                <section className={styles.panel}>
                    <div className={styles.stepBody}>{children}</div>
                </section>
                {aside && <aside className={styles.aside}>{aside}</aside>}
            </div>
        </>
    );
}
