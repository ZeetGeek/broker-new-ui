import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";

import styles from "@/features/properties/property-detail/property-detail.module.css";

/** Shared by the route fallback and loaded view to keep the masthead stationary. */
export function PublicPropertyShell({ children }: { children: ReactNode }) {
    return (
        <div className={styles.publicShell}>
            <header className={styles.publicMasthead}>
                <Logo size="sm" />
                <span>Property preview</span>
            </header>
            <main className={styles.publicMain}>{children}</main>
        </div>
    );
}
