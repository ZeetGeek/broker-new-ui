"use client";

import { type RefObject, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { CircleHelp } from "@/components/shared/icons";

import styles from "./quick-add.module.css";

const SHORTCUTS = [
    {
        label: "Start date",
        examples: ["tomorrow", "today", "25/12", "next Monday"],
        tip: "Sets when the task starts. Only needed when it should leave this day column.",
    },
    {
        label: "Start time",
        examples: ["5pm", "11:30am", "16:00"],
    },
    {
        label: "Due",
        examples: ["due tomorrow", "due tomorrow 6pm", "due at 5pm 25/12/2026"],
        tip: "Optional. Needs a start date and time first. Due must be on or after start.",
    },
    {
        label: "Priority",
        examples: ["p1", "p2", "p3", "p4"],
        tip: "p1 is urgent — the row colour shows it after you save.",
    },
    {
        label: "Property",
        examples: ["# Happy Elegance"],
        tip: "Type # and pick from your properties.",
    },
    {
        label: "Client or owner",
        examples: ["@ Aarav Shah"],
        tip: "Type @ and pick a Client or owner.",
    },
    {
        label: "Reminder",
        examples: ["!30m", "!1h", "!1d"],
        tip: "Needs a due time — add due 5pm (or similar). Up to 5, and only before due.",
    },
    {
        label: "Repeat",
        examples: ["every day", "every Monday", "every week"],
    },
    {
        label: "Keep as plain text",
        examples: ['"tomorrow"', '"due 20m"', "click chip", "Backspace"],
        tip: "Wrap the word in quotes, click the green chip, or press Backspace once at the end of it — then it stays as normal words, not a shortcut.",
    },
    {
        label: "Undo",
        examples: ["Ctrl+Z", "Ctrl+Shift+Z"],
        tip: "Ctrl+Shift+Z (or Ctrl+Y) redoes.",
    },
] as const;

export type QuickAddHelpProps = {
    /** Keeps the field focused when the help control is pressed. */
    fieldRef: RefObject<HTMLTextAreaElement | null>;
    /** True while the shortcuts modal is open — composer must not treat that as “left the field”. */
    onOpenChange?: (open: boolean) => void;
};

/** Compact help control for quick-add syntax. */
export function QuickAddHelp({ fieldRef, onOpenChange }: QuickAddHelpProps) {
    const [open, setOpen] = useState(false);

    const setHelpOpen = (next: boolean) => {
        setOpen(next);
        onOpenChange?.(next);
        if (!next) fieldRef.current?.focus({ preventScroll: true });
    };

    return (
        <>
            <button
                data-quick-add-help
                type="button"
                className={styles.helpButton}
                aria-label="Task entry tips"
                title="Task entry tips"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => setHelpOpen(true)}
            >
                <CircleHelp aria-hidden />
                <span>Tips</span>
            </button>
            <AppModal
                open={open}
                nativeScroll
                size="sm"
                padding="md"
                title="Type it once"
                description="Drop these into the task name. They light up as you type and fill in the details for you."
                onOpenChange={setHelpOpen}
            >
                <ul className={styles.helpList}>
                    {SHORTCUTS.map((item) => (
                        <li key={item.label} className={styles.helpItem}>
                            <span className={styles.helpLabel}>{item.label}</span>
                            <span className={styles.helpExamples}>
                                {item.examples.map((example) => (
                                    <span key={example} className={styles.helpChip}>
                                        {example}
                                    </span>
                                ))}
                            </span>
                            {"tip" in item && item.tip ? (
                                <small className={styles.helpTip}>{item.tip}</small>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </AppModal>
        </>
    );
}
