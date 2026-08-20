"use client";

import { cn } from "@/lib/utils";

import { type Portal,PORTAL_OPTIONS } from "./portal";

export function PortalPicker({
    value,
    onChange,
    ariaLabel,
}: {
    value: Portal;
    onChange: (portal: Portal) => void;
    ariaLabel: string;
}) {
    return (
        <div role="radiogroup" aria-label={ariaLabel} className="
          flex items-center justify-center gap-8
        ">
            {PORTAL_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className="flex items-center gap-2 py-3"
                    >
                        <span
                            className={cn(
                                `
                                  flex items-center justify-center rounded-full border-2 block-5
                                  inline-5
                                `,
                                selected ? "border-brand bg-brand" : "border-ink-subtle bg-surface",
                            )}
                        >
                            {selected ? (
                                <span className="rounded-full bg-surface block-2 inline-2" />
                            ) : null}
                        </span>
                        <span className="body font-medium text-ink">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
