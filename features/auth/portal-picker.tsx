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
        <div className="flex flex-col gap-4">
            <div
                role="radiogroup"
                aria-label={ariaLabel}
                aria-describedby="portal-picker-helper"
                className="flex flex-col gap-3"
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
                                  flex items-center gap-4 rounded-card border-2 bg-surface px-5
                                  py-4 text-start block-full
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  focus-visible:outline-none
                                `,
                                isSelected ? "border-brand" : "border-border-warm",
                            )}
                        >
                            <Image
                                src={option.avatarSrc}
                                alt=""
                                width={80}
                                height={80}
                                unoptimized
                                draggable={false}
                                className="
                                  pointer-events-none shrink-0 rounded-full border border-border-warm
                                  block-20 inline-20
                                "
                            />
                            <span className="flex flex-1 flex-col gap-1 min-inline-0">
                                <span className="h6 text-ink">{option.label}</span>
                                <span className="body text-ink-muted">{option.description}</span>
                            </span>
                            <span
                                className={cn(
                                    `
                                      flex shrink-0 items-center justify-center rounded-full
                                      border-2 block-5 inline-5
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
                        </button>
                    );
                })}
            </div>
            <p id="portal-picker-helper" aria-live="polite" className="body-sm text-ink-muted">
                {selected.helper}
            </p>
        </div>
    );
}
