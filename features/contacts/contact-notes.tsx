"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { MAX_CHARS } from "@/lib/validation/text-limits";

import { CharacterCount } from "@/components/shared/character-count";
import { Button } from "@/components/ui/button";

import styles from "./contacts-responsive.module.css";

export function ContactNotes({
    value,
    label,
    onSave,
    readOnlyMessage,
}: {
    value: string;
    label: "Client" | "Owner";
    onSave: (notes: string) => Promise<void>;
    readOnlyMessage?: string;
}) {
    const [notes, setNotes] = useState(value);
    const [savedValue, setSavedValue] = useState(value);
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [error, setError] = useState("");
    const saving = useRef(false);
    const id = `${label.toLowerCase()}-notes-count`;
    const save = async () => {
        if (readOnlyMessage || saving.current || notes === savedValue) return;
        saving.current = true;
        setStatus("saving");
        setError("");
        try {
            await onSave(notes);
            setSavedValue(notes);
            setStatus("saved");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not save notes. Try again.");
            setStatus("error");
        } finally {
            saving.current = false;
        }
    };
    return (
        <>
            {readOnlyMessage ? (
                <p className="body-sm mbe-3 text-ink-muted">{readOnlyMessage}</p>
            ) : null}
            {status === "saving" || status === "saved" ? (
                <p className="body-sm mbe-3 text-ink-muted" role="status">
                    {status === "saving" ? "Saving…" : "Saved"}
                </p>
            ) : null}
            <textarea
                aria-label={`${label} notes`}
                aria-describedby={id}
                aria-invalid={status === "error" || undefined}
                value={notes}
                maxLength={MAX_CHARS.contactNote}
                readOnly={Boolean(readOnlyMessage) || status === "saving"}
                onChange={(event) => {
                    setNotes(event.target.value);
                    setStatus("idle");
                }}
                onBlur={() => void save()}
                placeholder={readOnlyMessage ? "" : "Add useful context for the next conversation."}
                className="body resize-none rounded-control border-2 border-border-warm bg-surface p-3.5 leading-relaxed text-ink outline-none inline-full min-block-28 read-only:bg-surface-muted hover:border-ink-subtle focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
            <CharacterCount
                id={id}
                value={notes}
                maxChars={MAX_CHARS.contactNote}
                className={cn(styles.caption, "mbs-2")}
            />
            {status === "error" ? (
                <div className="mbs-3 flex flex-wrap items-center gap-2" role="alert">
                    <p className="body-sm text-danger">Notes weren’t saved. {error}</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => void save()}>
                        Try again
                    </Button>
                </div>
            ) : null}
        </>
    );
}
