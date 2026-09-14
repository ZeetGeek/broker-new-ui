"use client";

import { BadgeCheck, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BADGE_USES,
    BADGE_VARIANTS,
} from "@/features/design-system/theme/badge-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function StatusDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Confirmed</Badge>
            <Badge variant="urgent">Starting soon</Badge>
            <Badge variant="danger">Cancelled</Badge>
        </div>
    );
}

function WithIconDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" className="gap-1">
                <BadgeCheck aria-hidden className="size-3" strokeWidth={2.5} />
                Platform
            </Badge>
            <Badge variant="urgent" className="gap-1">
                <Clock aria-hidden className="size-3" strokeWidth={2.5} />
                Due today
            </Badge>
        </div>
    );
}

function ChipsDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Vesu</Badge>
            <Badge variant="outline">3 BHK</Badge>
            <Badge variant="outline">Sale</Badge>
        </div>
    );
}

function RowDemo() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Active</Badge>
            <Badge variant="neutral" className="tabular-nums">
                4 requests
            </Badge>
            <Badge variant="outline">Added by you</Badge>
        </div>
    );
}

export function BadgeThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Badges."
            description="shadcn Badge — top→bottom fill gradient, gradient border, tinted shadow, rounded-lg (not pill). Five variants for status, filters, and counts. See docs/DESIGN.md §4.4."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Variants</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Soft fill gradient + gradient border + tinted shadow. Never white text
                        on a soft fill. Default is <code className="body-xs">neutral</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {BADGE_VARIANTS.map((variant) => (
                            <Swatch key={variant.name} label={variant.label}>
                                <div className="flex min-block-10 items-center justify-center inline-full">
                                    <Badge variant={variant.name}>{variant.sample}</Badge>
                                </div>
                                <p className="body-xs text-ink-subtle">{variant.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Status labels, filter chips, and counts. Colour encodes meaning —
                        <code className="body-xs">urgent</code> and{" "}
                        <code className="body-xs">danger</code> are never decorative.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {BADGE_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <div className="flex min-block-10 items-center justify-center inline-full">
                                    {use.name === "status" ? <StatusDemo /> : null}
                                    {use.name === "with-icon" ? <WithIconDemo /> : null}
                                    {use.name === "chips" ? <ChipsDemo /> : null}
                                    {use.name === "row" ? <RowDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use <code className="body-xs">Badge</code> from{" "}
                            <code className="body-xs">components/ui/badge.tsx</code>. Do not
                            hand-roll soft pills with ad-hoc colours.
                        </li>
                        <li>
                            Soft top→bottom fill (
                            <code className="body-xs">surface</code> → tint) plus a vertical
                            gradient border and a soft colour-tinted shadow. Never white on soft.
                        </li>
                        <li>
                            <code className="body-xs">urgent</code> means a deadline.{" "}
                            <code className="body-xs">danger</code> means rejected or
                            destructive. Neither is decoration.
                        </li>
                        <li>
                            Radius is <code className="body-xs">rounded-lg</code> — soft, not{" "}
                            <code className="body-xs">rounded-full</code>. Full pills are for
                            avatars and status dots only.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/badge.tsx</code> for one-off
                            styling — pass <code className="body-xs">className</code>, or wrap
                            in <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
