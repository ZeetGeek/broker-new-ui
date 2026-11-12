"use client";

import { type ReactNode, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import styles from "./visits.module.css";

/** Shared visit working surface, following the Contacts drawer pattern. */
export function VisitOverlay({
    title,
    description,
    onClose,
    busy = false,
    dirty = false,
    compact = false,
    error,
    footer,
    children,
    lightboxOpen = false,
}: {
    title: string;
    description?: string;
    onClose: () => void;
    busy?: boolean;
    dirty?: boolean;
    compact?: boolean;
    error?: string;
    footer: (close: () => void) => ReactNode;
    children: ReactNode;
    lightboxOpen?: boolean;
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
                modal={!lightboxOpen}
                nativeScroll
                onOpenChange={(open) => {
                    if (!open) close();
                }}
                title={title}
                description={description}
                size={compact ? "md" : "lg"}
                padding="md"
                className={compact ? styles.compactDialog : styles.visitDrawer}
                bodyClassName={styles.overlayBody}
                footerClassName={styles.overlayFooter}
                footer={
                    <>
                        {error && (
                            <p role="alert" className={styles.saveError}>
                                {error}
                            </p>
                        )}
                        <div className={styles.footerActions}>{footer(close)}</div>
                    </>
                }
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
                    footer={
                        <div className={styles.footerActions}>
                            <Button variant="outline" onClick={() => setDiscardOpen(false)}>
                                Keep editing
                            </Button>
                            <Button variant="destructive" onClick={onClose}>
                                Discard changes
                            </Button>
                        </div>
                    }
                >
                    <p className={styles.muted}>
                        Stay here to finish your visit, or discard the changes and return to your
                        list.
                    </p>
                </AppModal>
            )}
        </>
    );
}
