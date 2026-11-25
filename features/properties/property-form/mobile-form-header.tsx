"use client";

import { useRef, useState } from "react";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import { IconButton } from "@/components/shared/icon-button";
import {
    Check,
    Eye,
    FileText,
    LayoutGrid,
    List,
    MoreHorizontal,
    RotateCcw,
    X,
} from "@/components/shared/icons";
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";

import styles from "./property-form.module.css";

export function MobileFormHeader({
    title,
    isDialog,
    entryMode,
    saved,
    restoring,
    busy,
    showStartFresh,
    onClose,
    onSaveDraft,
    onModeChange,
    onPreview,
    onScore,
    onStartFresh,
}: {
    title: string;
    isDialog: boolean;
    entryMode: "full" | "quick";
    saved: boolean;
    restoring: boolean;
    busy: boolean;
    showStartFresh: boolean;
    onClose: () => void;
    onSaveDraft: () => void;
    onModeChange: (mode: "full" | "quick") => void;
    onPreview: () => void;
    onScore: () => void;
    onStartFresh: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pendingAction = useRef<(() => void) | null>(null);
    function choose(action: () => void) {
        pendingAction.current = action;
        setMenuOpen(false);
    }
    const menu = (
        <MobileActionDrawer
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onOpenChangeComplete={(open) => {
                if (open) return;
                const action = pendingAction.current;
                pendingAction.current = null;
                action?.();
            }}
            title="Property options"
            trigger={
                <IconButton
                    size="md"
                    appearance="ghost"
                    aria-label="More property options"
                    disabled={busy || restoring}
                >
                    <MoreHorizontal aria-hidden />
                </IconButton>
            }
        >
            <div className={mobileActionGroupClass}>
                <button
                    type="button"
                    className={mobileActionClass}
                    onClick={() => choose(onSaveDraft)}
                >
                    <FileText aria-hidden /> Save as draft
                </button>
                <button
                    type="button"
                    className={mobileActionClass}
                    onClick={() => choose(onPreview)}
                >
                    <Eye aria-hidden /> Preview property &amp; deal
                </button>
                <button type="button" className={mobileActionClass} onClick={() => choose(onScore)}>
                    <List aria-hidden /> Listing score
                </button>
            </div>
            <div className={mobileActionGroupClass}>
                <button
                    type="button"
                    className={mobileActionClass}
                    onClick={() =>
                        choose(() => onModeChange(entryMode === "full" ? "quick" : "full"))
                    }
                >
                    <LayoutGrid aria-hidden />{" "}
                    {entryMode === "full" ? "Switch to Quick add" : "Switch to Full details"}
                </button>
            </div>
            {showStartFresh ? (
                <div className={mobileActionGroupClass}>
                    <button
                        type="button"
                        className={mobileActionClass}
                        onClick={() => choose(onStartFresh)}
                    >
                        <RotateCcw aria-hidden /> Start fresh
                    </button>
                </div>
            ) : null}
        </MobileActionDrawer>
    );
    const status = (
        <span role="status" className={styles.saveStatus}>
            {saved ? <Check aria-hidden /> : null}
            {restoring
                ? "Restoring your details…"
                : !showStartFresh
                  ? "Changes not saved yet"
                  : saved
                    ? "Saved on this device"
                    : "Changes stay on this device"}
        </span>
    );
    return isDialog ? (
        <AppModalHeader
            title={title}
            titleExtra={status}
            actions={menu}
            closeDisabled={busy}
            titleClassName={styles.mobileTitle}
            rowClassName={styles.mobileHeadingRow}
            actionsClassName={styles.mobileHeaderActions}
            className={styles.mobileHeader}
        />
    ) : (
        <header className={styles.mobileHeader}>
            <div className={styles.mobileHeadingRow}>
                <div className="flex-1 min-inline-0">
                    <h1 className={styles.mobileTitle}>{title}</h1>
                    {status}
                </div>
                <div className="flex items-center">
                    {menu}
                    <IconButton
                        size="md"
                        appearance="ghost"
                        aria-label="Close property form"
                        disabled={busy}
                        onClick={onClose}
                    >
                        <X aria-hidden />
                    </IconButton>
                </div>
            </div>
        </header>
    );
}
