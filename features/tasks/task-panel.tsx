"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";

import styles from "./task-panel.module.css";

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
                bodyClassName={styles.body}
                className={cn(
                    styles.panel,
                    compact
                        ? undefined
                        : `
                          contacts-form-drawer inset-s-auto! inset-e-0! inset-bs-0! translate-0!
                          rounded-none! block-dvh! inline-dvw! max-block-dvh! max-inline-dvw!
                          sm:inline-[min(var(--drawer-width),100vw)]!
                          sm:max-inline-(--drawer-width)!
                        `,
                )}
                headerClassName={
                    compact
                        ? undefined
                        : `
                          !space-y-0 !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-b
                          border-border-warm
                        `
                }
                footerClassName={styles.footer}
                footer={typeof footer === "function" ? footer(close) : footer}
            >
                {children}
            </AppModal>
            {discardOpen && (
                <AppModal
                    open
                    onOpenChange={setDiscardOpen}
                    title="Discard unsaved changes?"
                    description="What you typed will be lost if you leave now."
                    size="sm"
                    footer={
                        <AppModalFooter
                            className="flex flex-wrap items-center justify-end gap-2 inline-full"
                            secondaryLabel="Keep editing"
                            secondaryVariant="ghost"
                            onSecondary={() => setDiscardOpen(false)}
                            primaryLabel="Discard changes"
                            primaryVariant="destructive"
                            onPrimary={onClose}
                        />
                    }
                >
                    <p className="body text-ink-muted">
                        You can stay on this form and keep editing, or discard and close it.
                    </p>
                </AppModal>
            )}
        </>
    );
}
