"use client";

import { AlertTriangle, Check, XCircle } from "lucide-react";

import type { ConflictResult } from "@/lib/visits/conflicts";

import { Button } from "@/components/ui/button";

export function ConflictPanel({
    result,
    title,
    onOpenVisit,
}: {
    result: ConflictResult;
    /** Overrides the default clash / tight heading (e.g. API validation message title). */
    title?: string;
    onOpenVisit: (id: string) => void;
}) {
    if (result.level === "clear")
        return (
            <div className="body-sm flex items-center gap-2 rounded-inner bg-brand-soft px-3 py-2.5 font-semibold text-brand-text">
                <Check aria-hidden className="block-4 inline-4" /> No clashes. Travel time looks
                workable.
            </div>
        );
    const clash = result.level === "clash";
    return (
        <div
            className={`rounded-inner p-3 ${clash ? "bg-danger-soft text-danger" : "bg-urgent-soft text-pending"}`}
            role="alert"
        >
            <div className="flex items-start gap-2">
                {clash ? (
                    <XCircle aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                ) : (
                    <AlertTriangle aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                )}
                <div>
                    <p className="body-sm font-bold">
                        {title ?? (clash ? "This time cannot be booked" : "Check this timing")}
                    </p>
                    <ul className="body-xs mbs-1 space-y-1">
                        {result.reasons.map((reason, index) => (
                            <li key={`${reason.code}-${index}`}>
                                {reason.message}
                                {reason.visitId ? (
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="xs"
                                        onClick={() => {
                                            if (reason.visitId) onOpenVisit(reason.visitId);
                                        }}
                                        className="ms-1 p-0 block-auto"
                                    >
                                        View visit
                                    </Button>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
