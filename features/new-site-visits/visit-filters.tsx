"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

import { DATE_RANGES, VISIT_TABS } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";

import styles from "./visits.module.css";

export type VisitFilters = {
    client: string;
    property: string;
    from: string;
    to: string;
    archive: string;
    range: string;
};
export const EMPTY_FILTERS: VisitFilters = {
    client: "",
    property: "",
    from: "",
    to: "",
    archive: "",
    range: "",
};

export function VisitFiltersDialog({
    value,
    onApply,
    onClose,
}: {
    value: VisitFilters;
    onApply: (value: VisitFilters) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState(value);
    const patch = (next: Partial<VisitFilters>) => setDraft((d) => ({ ...d, ...next }));
    const invalid = !!(draft.from && draft.to && draft.from > draft.to);
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogPopup>
                <DialogHeader>
                    <DialogTitle>Filter visits</DialogTitle>
                    <DialogDescription>
                        Narrow your visits by client, property or date.
                    </DialogDescription>
                </DialogHeader>
                <label className={styles.field}>
                    Date range
                    <select
                        value={draft.range || "all"}
                        onChange={(e) => patch({ range: e.target.value, from: "", to: "" })}
                    >
                        {DATE_RANGES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={styles.field}>
                    Client
                    <select
                        value={draft.client}
                        onChange={(e) => patch({ client: e.target.value })}
                    >
                        <option value="">All clients</option>
                        {PREVIEW_CLIENTS.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={styles.field}>
                    Property
                    <select
                        value={draft.property}
                        onChange={(e) => patch({ property: e.target.value })}
                    >
                        <option value="">All properties</option>
                        {PREVIEW_PROPERTIES.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>
                </label>
                {draft.range === "custom" && (
                    <div className={styles.twoColumns}>
                        <label className={styles.field}>
                            From
                            <input
                                type="date"
                                value={draft.from}
                                onChange={(e) => patch({ from: e.target.value })}
                            />
                        </label>
                        <label className={styles.field}>
                            To
                            <input
                                type="date"
                                min={draft.from || undefined}
                                value={draft.to}
                                onChange={(e) => patch({ to: e.target.value })}
                                aria-invalid={invalid}
                            />
                        </label>
                    </div>
                )}
                {invalid && (
                    <p role="alert" className={styles.fieldError}>
                        End date must be on or after start date.
                    </p>
                )}
                <label className={styles.field}>
                    Status
                    <select
                        value={draft.archive}
                        onChange={(e) => patch({ archive: e.target.value })}
                    >
                        <option value="">Selected visit tab</option>
                        <option value="all">All statuses</option>
                        {VISIT_TABS.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                        <option value="cancelled">Cancelled visits</option>
                    </select>
                </label>
                <div className={styles.actions}>
                    <Button variant="ghost" onClick={() => setDraft({ ...EMPTY_FILTERS })}>
                        Reset
                    </Button>
                    <Button disabled={invalid} onClick={() => onApply(draft)}>
                        Apply filters
                    </Button>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
