"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

import styles from "./visits.module.css";

/** Shared visit working surface, following the Contacts drawer pattern. */
export function VisitOverlay({
    title,
    description,
    onClose,
    busy = false,
    dirty = false,
    compact = false,
    className,
    error,
    headerActions,
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
    className?: string;
    error?: string;
    headerActions?: ReactNode;
    footer?: (close: () => void) => ReactNode;
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
                headerActions={headerActions}
                description={description}
                size={compact ? "md" : "lg"}
                padding="md"
                className={cn(compact ? styles.compactDialog : styles.visitDrawer, className)}
                bodyClassName={styles.overlayBody}
                footerClassName={styles.overlayFooter}
                footer={
                    (footer || error) && (
                        <AppModalFooter className="flex-col items-stretch">
                            {error && (
                                <p role="alert" className={styles.saveError}>
                                    {error}
                                </p>
                            )}
                            {footer?.(close)}
                        </AppModalFooter>
                    )
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
                        <AppModalFooter
                            className={styles.footerActions}
                            secondaryLabel="Keep editing"
                            secondaryVariant="outline"
                            onSecondary={() => setDiscardOpen(false)}
                            primaryLabel="Discard changes"
                            primaryVariant="destructive"
                            onPrimary={onClose}
                        />
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
