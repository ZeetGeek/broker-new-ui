"use client";

import { type ReactNode, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import styles from "./task-form.module.css";

/** A focused working surface: docked on desktop, full screen on a phone. */
export function TaskPanel({
    title,
    description,
    children,
    footer,
    onClose,
    busy = false,
    dirty = false,
    compact = false,
}: {
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode | ((close: () => void) => ReactNode);
    onClose: () => void;
    busy?: boolean;
    dirty?: boolean;
    compact?: boolean;
}) {
    const [discardOpen, setDiscardOpen] = useState(false);
    const close = () => {
        if (busy) return;
        if (dirty) setDiscardOpen(true);
        else onClose();
    };
    return (
        <>
            <AppModal
                open
                nativeScroll
                onOpenChange={(open) => !open && close()}
                title={title}
                description={description}
                size={compact ? "md" : "lg"}
                padding="md"
                className={compact ? styles.compactPanel : styles.panel}
                bodyClassName={styles.panelBody}
                footerClassName={styles.panelFooter}
                footer={typeof footer === "function" ? footer(close) : footer}
            >
                {children}
            </AppModal>
            {discardOpen && (
                <AppModal
                    open
                    onOpenChange={setDiscardOpen}
                    title="Discard unsaved changes?"
                    description="Your changes will be lost if you close this form."
                    size="sm"
                    className={styles.compactPanel}
                    footer={
                        <div className={styles.discardActions}>
                            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
                                Keep editing
                            </Button>
                            <Button variant="destructive" onClick={onClose}>
                                Discard changes
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.hint}>
                        Stay here to finish your task, or discard the changes and return to your
                        list.
                    </p>
                </AppModal>
            )}
        </>
    );
}
