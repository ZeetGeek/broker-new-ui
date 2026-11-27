"use client";

import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AppModal, type AppModalProps } from "@/components/shared/app-modal";

import styles from "./mobile-action-drawer.module.css";

export function MobileActionDrawer({
    open,
    onOpenChange,
    onOpenChangeComplete,
    trigger,
    title,
    description,
    children,
    headerClassName,
    bodyClassName,
    edgeToEdge = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenChangeComplete?: AppModalProps["onOpenChangeComplete"];
    trigger: ReactElement;
    title: string;
    description?: string;
    children: ReactNode;
    headerClassName?: string;
    bodyClassName?: string;
    /** Panels with their own content insets, such as notifications. */
    edgeToEdge?: boolean;
}) {
    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={onOpenChangeComplete}
            trigger={trigger}
            title={title}
            description={description}
            headerClassName={headerClassName}
            descriptionClassName="line-clamp-2 wrap-break-word"
            padding="sm"
            nativeScroll
            scrollFade={!edgeToEdge}
            className={styles.drawer}
            bodyClassName={cn(styles.body, edgeToEdge && styles.edgeToEdge)}
        >
            <div
                className={bodyClassName}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </AppModal>
    );
}

export const mobileActionClass = styles.action;
export const mobileActionGroupClass = styles.group;
