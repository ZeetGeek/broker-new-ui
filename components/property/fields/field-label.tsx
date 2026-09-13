"use client";

import type { ReactNode } from "react";

import { useFieldRules } from "@/lib/visibility/use-field-rules";

export function FieldLabel({ path, children }: { path: string; children: ReactNode }) {
    const { labelOf, levelOf } = useFieldRules();
    const level = levelOf(path);
    const label = typeof children === "string" ? labelOf(path, children) : children;

    return (
        <>
            {label}
            {level === "required" ? (
                <span
                    aria-label="required"
                    title="Required to publish"
                    className="ms-1 text-danger"
                >
                    *
                </span>
            ) : level === "recommended" ? (
                <span
                    aria-label="recommended"
                    title="Recommended — improves your listing score"
                    className="
                      ms-1.5 inline-block rounded-full bg-urgent align-middle block-1.5 inline-1.5
                    "
                />
            ) : null}
        </>
    );
}
