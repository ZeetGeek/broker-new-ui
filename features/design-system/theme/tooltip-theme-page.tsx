"use client";

import { Bell, Info, LayoutGrid } from "lucide-react";

import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    TOOLTIP_SIDES,
    TOOLTIP_USES,
} from "@/features/design-system/theme/tooltip-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function PlainDemo() {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button size="icon-md" variant="outline" aria-label="Remind owner">
                        <Bell aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </Button>
                }
            />
            <TooltipContent>Send the owner a reminder</TooltipContent>
        </Tooltip>
    );
}

function WithKbdDemo() {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button size="icon-md" variant="outline" aria-label="Pipeline">
                        <LayoutGrid aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </Button>
                }
            />
            <TooltipContent side="bottom">
                Pipeline
                <KbdGroup className="gap-0.5">
                    <Kbd className="px-1.5 text-[10px] min-inline-4">G</Kbd>
                    <Kbd className="px-1.5 text-[10px] min-inline-4">P</Kbd>
                </KbdGroup>
            </TooltipContent>
        </Tooltip>
    );
}

function SideDemo({
    side,
}: {
    side: "top" | "bottom" | "inline-start" | "inline-end";
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button size="md" variant="outline">
                        Hover me
                    </Button>
                }
            />
            <TooltipContent side={side}>Opens on the {side} side</TooltipContent>
        </Tooltip>
    );
}

export function TooltipThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Tooltip."
            description="base-ui Tooltip, wrapped once in components/ui/tooltip.tsx. Short hover/focus hint for icon-only controls and truncated labels. Compound API — TooltipProvider (optional at a tree), Tooltip, TooltipTrigger, TooltipContent. Motion lives in .t-tooltip (transitions-dev). See docs/DESIGN.md §4.14."
        >
            <TooltipProvider>
                <div className="space-y-10">
                    <section>
                        <h2 className="h4 text-ink">Uses</h2>
                        <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                            Hover or focus the trigger. Open delay is 80ms (intent); close is
                            immediate. Prefer a visible label on mobile — tooltips are a desktop
                            assist, not the only way to learn what a control does.
                        </p>
                        <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {TOOLTIP_USES.map((use) => (
                                <Swatch key={use.name} label={use.label}>
                                    {use.name === "plain" ? <PlainDemo /> : <WithKbdDemo />}
                                    <p className="body-xs text-ink-subtle">{use.note}</p>
                                </Swatch>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="h4 text-ink">Sides</h2>
                        <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                            Default is <code className="body-xs">top</code> with an 8px gap.
                            Pick the side that keeps the tip on-screen and clear of chrome.
                        </p>
                        <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {TOOLTIP_SIDES.map((side) => (
                                <Swatch key={side.name} label={side.label}>
                                    <div className="flex min-block-16 items-center justify-center inline-full">
                                        <SideDemo side={side.name} />
                                    </div>
                                    <p className="body-xs text-ink-subtle">{side.note}</p>
                                </Swatch>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="h4 text-ink">ShortcutTooltip</h2>
                        <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                            Shared wrapper in{" "}
                            <code className="body-xs">components/shared/shortcut-tooltip.tsx</code>.
                            Reads the shortcut registry so labels and keys stay in sync with{" "}
                            <code className="body-xs">docs/SHORTCUTS.md</code>.
                        </p>
                        <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Swatch label="Registry-backed">
                                <ShortcutTooltip shortcutId="pipeline" label="Pipeline">
                                    <Button size="icon-md" variant="outline" aria-label="Pipeline">
                                        <LayoutGrid
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                    </Button>
                                </ShortcutTooltip>
                                <p className="body-xs text-ink-subtle">
                                    Only where the shortcut&apos;s route matches the trigger&apos;s
                                    destination.
                                </p>
                            </Swatch>
                            <Swatch label="Info affordance">
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <button
                                                type="button"
                                                className="
                                                  inline-flex items-center justify-center rounded-full
                                                  text-ink-muted
                                                  hover:text-ink
                                                  min-block-8 min-inline-8
                                                "
                                                aria-label="What this means"
                                            >
                                                <Info
                                                    aria-hidden
                                                    className="block-4 inline-4"
                                                    strokeWidth={1.75}
                                                />
                                            </button>
                                        }
                                    />
                                    <TooltipContent className="text-pretty max-inline-64">
                                        Shows what happened — tap again for what to do next
                                    </TooltipContent>
                                </Tooltip>
                                <p className="body-xs text-ink-subtle">
                                    Keep copy under ~80 characters. Prefer plain language over
                                    internal terms.
                                </p>
                            </Swatch>
                        </div>
                    </section>

                    <section className="rounded-card bg-brand-deep p-5 md:p-6">
                        <p className="eyebrow text-highlight">Rules</p>
                        <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                            <li>
                                Use for hover/focus hints on icon-only controls or truncated text —
                                never as the only label for a primary action.
                            </li>
                            <li>
                                Keep the compound API —{" "}
                                <code className="body-xs">Tooltip</code> +{" "}
                                <code className="body-xs">TooltipTrigger</code> +{" "}
                                <code className="body-xs">TooltipContent</code>. Wrap a tree in{" "}
                                <code className="body-xs">TooltipProvider</code> when several tips
                                share delay settings.
                            </li>
                            <li>
                                Copy is short and plain. No full stop on a fragment. No toast-length
                                paragraphs.
                            </li>
                            <li>
                                Shortcut hints go through{" "}
                                <code className="body-xs">ShortcutTooltip</code> (or{" "}
                                <code className="body-xs">Kbd</code> /
                                <code className="body-xs">KbdGroup</code> inside content) so keys
                                match the registry.
                            </li>
                            <li>
                                Do not edit <code className="body-xs">components/ui/tooltip.tsx</code>{" "}
                                for one-off styling — pass{" "}
                                <code className="body-xs">className</code> on content, or wrap in{" "}
                                <code className="body-xs">components/shared/</code>.
                            </li>
                            <li>
                                Motion stays on <code className="body-xs">.t-tooltip</code> — fade +
                                scale, faster on close. Never invent a second open animation.
                            </li>
                        </ul>
                    </section>
                </div>
            </TooltipProvider>
        </DesignSystemShell>
    );
}
