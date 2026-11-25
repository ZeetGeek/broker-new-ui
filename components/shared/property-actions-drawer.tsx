"use client";

import {
    type ButtonHTMLAttributes,
    cloneElement,
    type ReactElement,
    type ReactNode,
    useState,
} from "react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { IconButton } from "@/components/shared/icon-button";
import { ArrowLeft, ChevronRight } from "@/components/shared/icons";

import styles from "./property-actions-drawer.module.css";

export type PropertyDrawerAction = {
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    disabled?: boolean;
    hint?: string;
    destructive?: boolean;
    keepOpen?: boolean;
};

export function PropertyActionsDrawer({
    open,
    onOpenChange,
    trigger,
    title,
    groups,
    shareActions,
    shareDisabled,
    shareHint,
    shareIcon,
    destructiveActions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
    title: string;
    groups: PropertyDrawerAction[][];
    shareActions: PropertyDrawerAction[];
    shareDisabled: boolean;
    shareHint: string;
    shareIcon: ReactNode;
    destructiveActions: PropertyDrawerAction[];
}) {
    const [sharing, setSharing] = useState(false);
    const renderAction = (action: PropertyDrawerAction) => (
        <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            title={action.hint}
            className={cn(styles.action, action.destructive && styles.danger)}
            onClick={() => {
                if (!action.keepOpen) onOpenChange(false);
                action.onSelect();
            }}
        >
            {action.icon}
            <span>{action.label}</span>
        </button>
    );

    return (
        <>
            {cloneElement(trigger, {
                onClick: () => {
                    setSharing(false);
                    onOpenChange(true);
                },
                "aria-haspopup": "dialog",
                "aria-expanded": open,
            })}
            <AppModal
                open={open}
                onOpenChange={onOpenChange}
                nativeScroll
                padding="sm"
                className={styles.drawer}
                bodyClassName={styles.body}
                title={
                    sharing ? (
                        <span className="flex items-center gap-2">
                            <IconButton
                                aria-label="Back to property actions"
                                onClick={() => setSharing(false)}
                            >
                                <ArrowLeft aria-hidden />
                            </IconButton>
                            Share property
                        </span>
                    ) : (
                        "Property actions"
                    )
                }
                description={title}
                descriptionClassName="truncate"
            >
                {sharing ? (
                    <div className={styles.group}>{shareActions.map(renderAction)}</div>
                ) : (
                    <>
                        {groups.map((group, index) =>
                            group.length ? (
                                <div key={index} className={styles.group}>
                                    {group.map(renderAction)}
                                </div>
                            ) : null,
                        )}
                        <div className={styles.group}>
                            <button
                                type="button"
                                className={styles.action}
                                disabled={shareDisabled}
                                title={shareDisabled ? shareHint : undefined}
                                onClick={() => setSharing(true)}
                            >
                                {shareIcon}
                                <span>Share property</span>
                                <ChevronRight aria-hidden className="ms-auto block-4 inline-4" />
                            </button>
                        </div>
                        {destructiveActions.length ? (
                            <div className={styles.group}>
                                {destructiveActions.map(renderAction)}
                            </div>
                        ) : null}
                    </>
                )}
            </AppModal>
        </>
    );
}
