"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { type Portal, PORTAL_OPTIONS } from "./portal";

export function PortalPicker({
    value,
    onChange,
    ariaLabel,
}: {
    value: Portal;
    onChange: (portal: Portal) => void;
    ariaLabel: string;
}) {
    const selected = PORTAL_OPTIONS.find((option) => option.value === value) ?? PORTAL_OPTIONS[0];

    return (
        <div className="flex flex-col gap-5">
            <div
                role="radiogroup"
                aria-label={ariaLabel}
                aria-describedby="portal-picker-helper"
                className="flex flex-row gap-5"
            >
                {PORTAL_OPTIONS.map((option) => {
                    const isSelected = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                `
                                  relative flex flex-1 flex-col items-center gap-3 rounded-card
                                  border-2 bg-surface px-4 py-8 text-center
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  focus-visible:outline-none
                                `,
                                isSelected ? "border-brand" : "border-border-warm",
                            )}
                        >
                            <span
                                className={cn(
                                    `
                                      absolute inset-e-3 inset-bs-3 flex shrink-0 items-center
                                      justify-center rounded-full border-2 block-5 inline-5
                                    `,
                                    isSelected
                                        ? "border-brand bg-brand"
                                        : "border-ink-subtle bg-surface",
                                )}
                            >
                                {isSelected ? (
                                    <span className="rounded-full bg-surface block-2 inline-2" />
                                ) : null}
                            </span>
                            <Image
                                src={option.avatarSrc}
                                alt=""
                                width={144}
                                height={144}
                                unoptimized
                                draggable={false}
                                className="
                                  pointer-events-none shrink-0 rounded-full block-32 inline-32
                                "
                            />
                            <span className="flex flex-col gap-1">
                                <span className="h6 text-ink">{option.label}</span>
                                <span className="body-sm text-ink-muted">{option.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <p
                id="portal-picker-helper"
                aria-live="polite"
                className="body-md mx-auto text-center text-ink-muted inline-full max-inline-96"
            >
                {selected.helper}
            </p>
        </div>
    );
}
