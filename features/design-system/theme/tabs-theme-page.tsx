"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    TABS_ORIENTATIONS,
    TABS_USES,
    TABS_VARIANTS,
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
    { value: "full", label: "Full details", short: "Full" },
    { value: "quick", label: "Quick add", short: "Quick" },
] as const;

const SECTION_TABS = [
    { value: "visits", label: "My visits", count: 4 },
    { value: "slots", label: "Open slots", count: 2 },
    { value: "requests", label: "Requests", count: 0 },
] as const;

const FILTER_TABS = ["All", "Owners", "Brokers", "System"] as const;

const PANEL_COPY: Record<(typeof ENTRY_TABS)[number]["value"], string> = {
    full: "Every field visible. Use when the listing needs photos, amenities, and RERA.",
    quick: "Name, type, price, area. Enough to get the property into the pool today.",
};

function movePill(pill: HTMLElement, tab: HTMLElement, animate: boolean) {
    const nextTransform = `translateX(${tab.offsetLeft}px)`;
    const nextWidth = `${tab.offsetWidth}px`;
    if (!animate) {
        const previous = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = nextTransform;
        pill.style.width = nextWidth;
        void pill.offsetWidth;
        pill.style.transition = previous;
        return;
    }
    pill.style.transform = nextTransform;
    pill.style.width = nextWidth;
}

function PillTrackDemo() {
    const [value, setValue] = useState("full");

    return (
        <Tabs value={value} onValueChange={setValue} className="gap-0 inline-full">
            <TabsList
                className="
                  rounded-control bg-surface-muted p-1 text-ink-muted shadow-none
                  block-12 inline-fit max-inline-full
                "
            >
                {ENTRY_TABS.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="
                          flex-none rounded-control px-3 font-semibold text-ink-muted
                          data-active:bg-surface data-active:text-ink data-active:shadow-sm
                          sm:px-4
                        "
                    >
                        <span className="sm:hidden">{tab.short}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

function LineDemo() {
    const [value, setValue] = useState("overview");

    return (
        <Tabs value={value} onValueChange={setValue} className="gap-0 inline-full">
            <TabsList
                variant="line"
                className="justify-start gap-0 rounded-none bg-transparent p-0 text-ink-muted inline-full"
            >
                {(["overview", "activity", "notes"] as const).map((tab) => (
                    <TabsTrigger
                        key={tab}
                        value={tab}
                        className="
                          rounded-none px-3 pb-2 font-semibold capitalize text-ink-muted
                          data-active:text-ink
                          after:bg-brand
                        "
                    >
                        {tab}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

function SlidingPillDemo() {
    const [active, setActive] = useState<(typeof FILTER_TABS)[number]>("All");
    const barRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLSpanElement>(null);
    const hasPainted = useRef(false);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) {
            return;
        }
        const selected = bar.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!selected) {
            return;
        }
        movePill(pill, selected, hasPainted.current);
        hasPainted.current = true;
    }, [active]);

    return (
        <div ref={barRef} className="t-tabs" role="tablist" aria-label="Filter by source">
            <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
            {FILTER_TABS.map((tab) => {
                const isActive = tab === active;
                return (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className="t-tab body-sm font-medium"
                        onClick={() => setActive(tab)}
                    >
                        {tab}
                    </button>
                );
            })}
        </div>
    );
}

function PanelsDemo() {
    const [value, setValue] = useState<(typeof ENTRY_TABS)[number]["value"]>("full");

    return (
        <Tabs
            value={value}
            onValueChange={(next) => {
                if (next === "full" || next === "quick") {
                    setValue(next);
                }
            }}
            className="gap-3 inline-full"
        >
            <TabsList
                className="
                  rounded-control bg-surface-muted p-1 text-ink-muted shadow-none
                  block-12 inline-fit max-inline-full
                "
            >
                {ENTRY_TABS.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="
                          flex-none rounded-control px-3 font-semibold text-ink-muted
                          data-active:bg-surface data-active:text-ink data-active:shadow-sm
                          sm:px-4
                        "
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {ENTRY_TABS.map((tab) => (
                <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="
                      body-sm rounded-control border border-border-warm bg-surface p-4
                      text-ink-muted
                    "
                >
                    {PANEL_COPY[tab.value]}
                </TabsContent>
            ))}
        </Tabs>
    );
}

function CountsDemo() {
    const [value, setValue] = useState<(typeof SECTION_TABS)[number]["value"]>("visits");

    return (
        <div
            role="tablist"
            aria-label="Site visit sections"
            className="
              grid grid-cols-3 gap-1 rounded-control border border-border-warm bg-surface p-1
              shadow-sm inline-full
            "
        >
            {SECTION_TABS.map((tab) => {
                const isActive = value === tab.value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setValue(tab.value)}
                        className={cn(
                            `
                              body-sm flex items-center justify-center gap-2 rounded-[9px] px-2
                              font-semibold outline-none transition-colors duration-160
                              min-block-11
                              focus-visible:ring-3 focus-visible:ring-brand/25
                            `,
                            isActive
                                ? "bg-brand-ink text-surface"
                                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                        )}
                    >
                        <span className="truncate">{tab.label}</span>
                        {tab.count > 0 ? (
                            <span
                                className={cn(
                                    "tabular rounded-md px-1.5 py-0.5 text-[11px]",
                                    isActive
                                        ? "bg-surface/15 text-surface"
                                        : "bg-surface-muted text-ink-muted",
                                )}
                            >
                                {tab.count}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}

const VERTICAL_PANELS = {
    profile: "Account details and contact preferences.",
    team: "Members sit under the organisation account.",
    billing: "Deferred for phase one — do not build yet.",
} as const;

function VerticalDemo() {
    const [value, setValue] = useState<keyof typeof VERTICAL_PANELS>("profile");

    return (
        <Tabs
            value={value}
            onValueChange={(next) => {
                if (next in VERTICAL_PANELS) {
                    setValue(next as keyof typeof VERTICAL_PANELS);
                }
            }}
            orientation="vertical"
            className="flex-row gap-4 inline-full"
        >
            <TabsList
                className="
                  h-fit flex-col items-stretch rounded-control bg-surface-muted p-1
                  text-ink-muted shadow-none block-fit inline-40
                "
            >
                {(Object.keys(VERTICAL_PANELS) as Array<keyof typeof VERTICAL_PANELS>).map(
                    (tab) => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="
                              justify-start rounded-control px-3 font-semibold capitalize
                              text-ink-muted
                              data-active:bg-surface data-active:text-ink data-active:shadow-sm
                            "
                        >
                            {tab}
                        </TabsTrigger>
                    ),
                )}
            </TabsList>
            {(Object.keys(VERTICAL_PANELS) as Array<keyof typeof VERTICAL_PANELS>).map((tab) => (
                <TabsContent
                    key={tab}
                    value={tab}
                    className="
                      body-sm flex flex-1 items-center rounded-control border border-border-warm
                      bg-surface px-4 py-6 text-ink-muted min-block-28
                    "
                >
                    {VERTICAL_PANELS[tab]}
                </TabsContent>
            ))}
        </Tabs>
    );
}

export function TabsThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Tabs."
            description="base-ui Tabs, wrapped once in components/ui/tabs.tsx. Section switchers and peer views — not form toggles. Compound API — Tabs, TabsList, TabsTrigger, TabsContent. Sliding filter bars use .t-tabs (transitions-dev). See docs/DESIGN.md §4.15."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Variants</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Pill track is the default for in-page switches. Line for quieter chrome.
                        Sliding pill when the active indicator should travel between equal options.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {TABS_VARIANTS.map((variant) => (
                            <Swatch key={variant.name} label={variant.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    {variant.name === "default" ? <PillTrackDemo /> : null}
                                    {variant.name === "line" ? <LineDemo /> : null}
                                    {variant.name === "sliding" ? <SlidingPillDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{variant.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Prefer two or three tabs. More than that usually wants a select or a
                        scrollable stage row. Sale / Rent on a card is{" "}
                        <code className="body-xs">TextSegmentedToggle</code>, not Tabs.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {TABS_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                {use.name === "sections" ? <PillTrackDemo /> : null}
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
                        Horizontal is the product default. Vertical is desktop-only chrome —
                        settings side-nav, never the pipeline on a phone.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {TABS_ORIENTATIONS.map((orientation) => (
                            <Swatch key={orientation.name} label={orientation.label}>
                                {orientation.name === "horizontal" ? (
                                    <div className="inline-full">
                                        <PillTrackDemo />
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
                            Use Tabs for peer views and section chrome. Use{" "}
                            <code className="body-xs">TextSegmentedToggle</code> /{" "}
                            <code className="body-xs">IconSegmentedToggle</code> for binary choices
                            inside a card or form.
                        </li>
                        <li>
                            Keep the compound API —{" "}
                            <code className="body-xs">Tabs</code> +{" "}
                            <code className="body-xs">TabsList</code> +{" "}
                            <code className="body-xs">TabsTrigger</code> +{" "}
                            <code className="body-xs">TabsContent</code> when panels are needed.
                        </li>
                        <li>
                            Brand the list with{" "}
                            <code className="body-xs">bg-surface-muted</code>,{" "}
                            <code className="body-xs">rounded-control</code>, and a{" "}
                            <code className="body-xs">surface</code> active pill — never invent a
                            second track colour.
                        </li>
                        <li>
                            Sliding filter bars use{" "}
                            <code className="body-xs">.t-tabs</code> /{" "}
                            <code className="body-xs">.t-tabs-pill</code> from{" "}
                            <code className="body-xs">app/transitions-dev.css</code>. Measure once
                            on paint and on resize with transitions suspended.
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
