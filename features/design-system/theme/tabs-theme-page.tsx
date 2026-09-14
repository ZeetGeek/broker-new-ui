"use client";

import { useState } from "react";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    SlidingTabs,
    TabsPanel,
} from "@/features/design-system/theme/sliding-tabs";
import {
    TABS_ORIENTATIONS,
    TABS_USES,
    TABS_VARIANT,
} from "@/features/design-system/theme/tabs-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div
            className="
              flex flex-col items-start gap-3 rounded-card border border-border-warm bg-surface
              p-5
            "
        >
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

const ENTRY_TABS = [
    { value: "full", label: "Full details" },
    { value: "quick", label: "Quick add" },
] as const;

const SECTION_TABS = [
    { value: "visits", label: "My visits", count: 4 },
    { value: "slots", label: "Open slots", count: 2 },
    { value: "requests", label: "Requests", count: 0 },
] as const;

const FILTER_TABS = [
    { value: "all", label: "All" },
    { value: "owners", label: "Owners" },
    { value: "brokers", label: "Brokers" },
    { value: "system", label: "System" },
] as const;

const PANEL_COPY: Record<(typeof ENTRY_TABS)[number]["value"], string> = {
    full: "Every field visible. Use when the listing needs photos, amenities, and RERA.",
    quick: "Name, type, price, area. Enough to get the property into the pool today.",
};

const VERTICAL_PANELS = {
    profile: "Account details and contact preferences.",
    team: "Members sit under the organisation account.",
    billing: "Deferred for phase one — do not build yet.",
} as const;

function TabsDemo({
    options = ENTRY_TABS,
}: {
    options?: ReadonlyArray<{ value: string; label: string }>;
}) {
    const [value, setValue] = useState(options[0]?.value ?? "");

    return (
        <SlidingTabs
            value={value}
            onValueChange={setValue}
            ariaLabel="Demo tabs"
            options={options.map((tab) => ({ value: tab.value, label: tab.label }))}
        />
    );
}

function PanelsDemo() {
    const [value, setValue] = useState<(typeof ENTRY_TABS)[number]["value"]>("full");

    return (
        <div className="flex flex-col gap-3 inline-full">
            <SlidingTabs
                value={value}
                onValueChange={(next) => {
                    if (next === "full" || next === "quick") {
                        setValue(next);
                    }
                }}
                ariaLabel="Entry mode"
                options={ENTRY_TABS.map((tab) => ({ value: tab.value, label: tab.label }))}
            />
            <TabsPanel
                panelKey={value}
                className="
                  body-sm rounded-control border border-border-warm bg-canvas p-4
                  text-ink-muted
                "
            >
                {PANEL_COPY[value]}
            </TabsPanel>
        </div>
    );
}

function CountsDemo() {
    const [value, setValue] = useState<(typeof SECTION_TABS)[number]["value"]>("visits");

    return (
        <SlidingTabs
            value={value}
            onValueChange={(next) => {
                if (next === "visits" || next === "slots" || next === "requests") {
                    setValue(next);
                }
            }}
            ariaLabel="Site visit sections"
            stretch
            className="inline-full"
            options={SECTION_TABS.map((tab) => ({
                value: tab.value,
                label: (
                    <>
                        <span className="truncate">{tab.label}</span>
                        {tab.count > 0 ? (
                            <span className="tabular rounded-md bg-surface/70 px-1.5 py-0.5 text-[11px] text-ink-muted">
                                {tab.count}
                            </span>
                        ) : null}
                    </>
                ),
            }))}
        />
    );
}

function VerticalDemo() {
    const [value, setValue] = useState<keyof typeof VERTICAL_PANELS>("profile");
    const keys = Object.keys(VERTICAL_PANELS) as Array<keyof typeof VERTICAL_PANELS>;

    return (
        <div className="flex flex-row gap-4 inline-full">
            <SlidingTabs
                value={value}
                onValueChange={(next) => {
                    if (next in VERTICAL_PANELS) {
                        setValue(next as keyof typeof VERTICAL_PANELS);
                    }
                }}
                ariaLabel="Settings sections"
                orientation="vertical"
                options={keys.map((tab) => ({
                    value: tab,
                    label: <span className="capitalize">{tab}</span>,
                }))}
            />
            <TabsPanel
                panelKey={value}
                className="
                  body-sm flex flex-1 items-center rounded-control border border-border-warm
                  bg-canvas px-4 py-6 text-ink-muted min-block-28
                "
            >
                {VERTICAL_PANELS[value]}
            </TabsPanel>
        </div>
    );
}

export function TabsThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Tabs."
            description="Sliding surface pill — transitions.dev 16-tabs-sliding (.t-tabs / .t-tabs-surface). Track is surface-muted; the active pill is white with border and shadow, and it tweens width + translate between tabs. Panel copy fades in with a soft rise. See docs/DESIGN.md §4.15."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Variant</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        One style. The pill slides with{" "}
                        <code className="body-xs">--tabs-dur</code> /{" "}
                        <code className="body-xs">--ease-smooth-out</code>. Reduced motion snaps
                        with no tween.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <Swatch label={TABS_VARIANT.label}>
                            <div className="flex min-block-14 items-center justify-center inline-full">
                                <TabsDemo />
                            </div>
                            <p className="body-xs text-ink-subtle">{TABS_VARIANT.note}</p>
                        </Swatch>
                        <Swatch label="Equal options">
                            <div className="flex min-block-14 items-center justify-center inline-full">
                                <TabsDemo options={FILTER_TABS} />
                            </div>
                            <p className="body-xs text-ink-subtle">
                                Same sliding pill across three or four labels. Prefer a select past
                                that.
                            </p>
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Prefer two or three tabs. Sale / Rent on a card is{" "}
                        <code className="body-xs">TextSegmentedToggle</code>, not Tabs.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {TABS_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                {use.name === "sections" ? <TabsDemo /> : null}
                                {use.name === "panels" ? <PanelsDemo /> : null}
                                {use.name === "counts" ? <CountsDemo /> : null}
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Orientation</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Horizontal is the product default. Vertical slides the pill on the Y axis —
                        desktop settings side-nav only.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {TABS_ORIENTATIONS.map((orientation) => (
                            <Swatch key={orientation.name} label={orientation.label}>
                                {orientation.name === "horizontal" ? (
                                    <div className="inline-full">
                                        <TabsDemo />
                                    </div>
                                ) : (
                                    <VerticalDemo />
                                )}
                                <p className="body-xs text-ink-subtle">{orientation.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Motion is{" "}
                            <code className="body-xs">.t-tabs</code> +{" "}
                            <code className="body-xs">.t-tabs-surface</code> from{" "}
                            <code className="body-xs">app/transitions-dev.css</code>. Measure the
                            active tab on paint and resize with transitions suspended; tween on
                            click.
                        </li>
                        <li>
                            Track is <code className="body-xs">surface-muted</code>; active pill is{" "}
                            <code className="body-xs">surface</code> +{" "}
                            <code className="body-xs">border-border-warm</code> +{" "}
                            <code className="body-xs">shadow-sm</code>. No brand fill on the pill.
                        </li>
                        <li>
                            Use Tabs for peer views and section chrome. Use{" "}
                            <code className="body-xs">TextSegmentedToggle</code> /{" "}
                            <code className="body-xs">IconSegmentedToggle</code> for binary choices
                            inside a card or form.
                        </li>
                        <li>
                            Panel swaps use <code className="body-xs">.t-tabs-panel</code> — soft
                            rise + fade with <code className="body-xs">--duration-fast</code>.
                        </li>
                        <li>
                            Minimum tap target 44px on mobile. Stage rows scroll horizontally —
                            they do not compress into a crowded bar.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/tabs.tsx</code> for one-off
                            styling — pass <code className="body-xs">className</code>, or wrap in{" "}
                            <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
