"use client";

import type { ReactNode } from "react";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import styles from "./task-form.module.css";

/** A focused working surface: docked on desktop, full screen on a phone. */
export function TaskPanel({
    title,
    description,
    children,
    footer,
    onClose,
    busy = false,
}: {
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
    busy?: boolean;
}) {
    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
            <DialogPopup
                showCloseButton={false}
                className={styles.panel}
                style={{
                    insetBlock: 0,
                    insetInlineStart: "auto",
                    insetInlineEnd: 0,
                    translate: "none",
                }}
            >
                <AppModalHeader title={title} description={description} closeDisabled={busy} />
                <ScrollArea className={styles.panelScroll}>
                    <div className={styles.panelBody}>{children}</div>
                </ScrollArea>
                {footer ? <div className={styles.panelFooter}>{footer}</div> : null}
            </DialogPopup>
        </Dialog>
    );
}
