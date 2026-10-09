"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    CARD_SIZES,
    CARD_SURFACES,
} from "@/features/design-system/theme/card-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function SurfaceDemo() {
    return (
        <Card className="inline-full shadow-sm ring-border-warm/60">
            <CardHeader>
                <CardTitle>3 BHK in Vesu</CardTitle>
                <CardDescription>Listed 4 days ago · 2 requests</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="body-sm text-ink-muted">
                    Semi-furnished · 1,450 sq ft
                </p>
            </CardContent>
        </Card>
    );
}

function DarkDemo() {
    return (
        <Card className="inline-full border-0 bg-brand-deep shadow-none ring-0">
            <CardHeader>
                <p className="eyebrow text-highlight">Needs you</p>
                <CardTitle className="text-white">3 brokers waiting</CardTitle>
                <CardDescription className="text-[#B8CFC4]">
                    Approve who can show your Vesu flat.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="highlight" size="sm">
                    Review requests
                </Button>
            </CardFooter>
        </Card>
    );
}

function SizeDemo({ size }: { size: "default" | "sm" }) {
    return (
        <Card size={size} className="inline-full shadow-sm ring-border-warm/60">
            <CardHeader>
                <CardTitle>Priya Shah</CardTitle>
                <CardDescription>Site visit · Tomorrow</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="body-sm text-ink-muted">Vesu · meet at the gate</p>
            </CardContent>
        </Card>
    );
}

export function CardThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Card."
            description="shadcn Card — rounded-card (20px), white surface on canvas, compound header/content/footer. Dark attention cards use brand-deep. See docs/DESIGN.md §4.1–§4.2."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Surfaces</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Separation comes from white on warm cream — not from heavy borders.
                        Dark attention is reserved for the one thing that needs action.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {CARD_SURFACES.map((surface) => (
                            <Swatch key={surface.name} label={surface.label}>
                                <div className="inline-full">
                                    {surface.name === "surface" ? <SurfaceDemo /> : null}
                                    {surface.name === "dark" ? <DarkDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{surface.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">size</code> sets{" "}
                        <code className="body-xs">--card-spacing</code>. Default is{" "}
                        <code className="body-xs">default</code>. Prefer{" "}
                        <code className="body-xs">sm</code> in side panels and dense lists.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {CARD_SIZES.map((size) => (
                            <Swatch key={size.name} label={size.label}>
                                <div className="inline-full">
                                    <SizeDemo size={size.name} />
                                </div>
                                <p className="body-xs text-ink-subtle">{size.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use <code className="body-xs">Card</code> from{" "}
                            <code className="body-xs">components/ui/card.tsx</code>. Radius is{" "}
                            <code className="body-xs">rounded-card</code> (20px) — never{" "}
                            <code className="body-xs">rounded-md</code>.
                        </li>
                        <li>
                            Resting cards sit on <code className="body-xs">canvas</code> as{" "}
                            <code className="body-xs">surface</code>. Prefer{" "}
                            <code className="body-xs">shadow-sm</code> or none — reach for{" "}
                            <code className="body-xs">shadow-md</code> only when raised.
                        </li>
                        <li>
                            Dark attention cards use{" "}
                            <code className="body-xs">brand-deep</code> or{" "}
                            <code className="body-xs">brand-ink</code>, never a drop shadow.
                            Max two per screen; one above the fold on mobile.
                        </li>
                        <li>
                            Text on dark: headings white, body{" "}
                            <code className="body-xs">#B8CFC4</code>, the metric in{" "}
                            <code className="body-xs">highlight</code>. One highlight per card.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/card.tsx</code> for one-off
                            styling — pass <code className="body-xs">className</code>, or wrap
                            in <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
