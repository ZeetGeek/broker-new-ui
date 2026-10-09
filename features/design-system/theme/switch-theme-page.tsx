"use client";

import { useState } from "react";

import { LayoutGrid, List } from "lucide-react";

import { IconSegmentedToggle } from "@/components/shared/icon-segmented-toggle";
import { TextSegmentedToggle } from "@/components/shared/text-segmented-toggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { ICON_SEGMENTED_TOGGLE_USES } from "@/features/design-system/theme/icon-segmented-toggle-tokens";
import { TEXT_SEGMENTED_TOGGLE_USES } from "@/features/design-system/theme/text-segmented-toggle-tokens";
import { SWITCH_SIZES } from "@/features/design-system/theme/switch-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function PreferenceRow({
    id,
    label,
    hint,
    size,
    defaultChecked,
    disabled,
    invalid,
}: {
    id: string;
    label: string;
    hint?: string;
    size?: "sm" | "default";
    defaultChecked?: boolean;
    disabled?: boolean;
    invalid?: boolean;
}) {
    const [checked, setChecked] = useState(Boolean(defaultChecked));

    return (
        <div
            className="
              flex items-center justify-between gap-4 rounded-control border border-border-warm
              bg-surface px-4 py-3 min-block-14 inline-full
            "
        >
            <div className="min-inline-0">
                <Label htmlFor={id} className="block text-sm font-semibold text-ink">
                    {label}
                </Label>
                {hint ? <p className="mbs-0.5 text-xs/5 text-ink-muted">{hint}</p> : null}
            </div>
            <Switch
                id={id}
                size={size}
                checked={checked}
                disabled={disabled}
                aria-label={label}
                aria-invalid={invalid || undefined}
                onCheckedChange={setChecked}
                className="
                  data-checked:border-brand data-checked:bg-brand
                  data-unchecked:border-border-warm data-unchecked:bg-border-warm
                "
            />
        </div>
    );
}

type LayoutView = "grid" | "list";

type DealType = "sale" | "rent";

function SaleRentDemo() {
    const [deal, setDeal] = useState<DealType>("sale");

    return (
        <div className="flex flex-col items-start gap-3">
            <TextSegmentedToggle
                size="sm"
                value={deal}
                onValueChange={setDeal}
                ariaLabel="Listing deal type"
                options={[
                    { value: "sale", label: "Sale" },
                    { value: "rent", label: "Rent" },
                ]}
            />
            <p className="body-xs text-ink-muted">
                Active: <span className="font-medium text-ink">{deal}</span>
            </p>
        </div>
    );
}

function ViewLayoutDemo() {
    const [view, setView] = useState<LayoutView>("grid");

    return (
        <div className="flex flex-col items-start gap-3">
            <IconSegmentedToggle
                value={view}
                onValueChange={setView}
                ariaLabel="Results layout"
                options={[
                    { value: "grid", label: "Grid view", icon: LayoutGrid },
                    { value: "list", label: "List view", icon: List },
                ]}
            />
            <p className="body-xs text-ink-muted">
                Active: <span className="font-medium text-ink">{view}</span>
            </p>
        </div>
    );
}

function LiveToggleDemo() {
    const [acceptedOnly, setAcceptedOnly] = useState(true);
    const [hideFull, setHideFull] = useState(false);

    return (
        <div className="space-y-3 inline-full">
            <label className="flex items-center justify-between gap-3 min-block-12 inline-full">
                <span className="body-sm font-semibold text-ink">Only my accepted properties</span>
                <Switch
                    checked={acceptedOnly}
                    onCheckedChange={setAcceptedOnly}
                    className="
                      data-checked:border-brand data-checked:bg-brand
                      data-unchecked:border-border-warm data-unchecked:bg-border-warm
                    "
                />
            </label>
            <label className="flex items-center justify-between gap-3 min-block-12 inline-full">
                <span className="body-sm font-semibold text-ink">Hide full slots</span>
                <Switch
                    checked={hideFull}
                    onCheckedChange={setHideFull}
                    className="
                      data-checked:border-brand data-checked:bg-brand
                      data-unchecked:border-border-warm data-unchecked:bg-border-warm
                    "
                />
            </label>
        </div>
    );
}

export function SwitchThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Switch."
            description="One base-ui primitive, wrapped once in components/ui/switch.tsx. Binary preference control — on or off — never a third state. Two sizes, full rounded track, brand fill when checked. Pair with a label on the leading side; the control itself is the tap target plus its expanded hit area."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Two steps only — denser than the five-step control-height scale used by
                        Button, Input, and Select. Default is the preference-row size;{" "}
                        <code className="body-xs">sm</code> sits in filter sheets and compact
                        lists.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {SWITCH_SIZES.map((s) => (
                            <Swatch key={s.name} label={s.label}>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        size={s.name}
                                        defaultChecked
                                        className="
                                          data-checked:border-brand data-checked:bg-brand
                                          data-unchecked:border-border-warm
                                          data-unchecked:bg-border-warm
                                        "
                                    />
                                    <Switch
                                        size={s.name}
                                        className="
                                          data-checked:border-brand data-checked:bg-brand
                                          data-unchecked:border-border-warm
                                          data-unchecked:bg-border-warm
                                        "
                                    />
                                </div>
                                <p className="body-xs text-ink-subtle">{s.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Icon segmented toggle</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Not the binary <code className="body-xs">Switch</code> — exclusive layout
                        choice between two (or more) icon buttons in one pill. Lives in{" "}
                        <code className="body-xs">components/shared/icon-segmented-toggle.tsx</code>
                        . Sliding highlight uses{" "}
                        <code className="body-xs">AnimatedBackground</code> +{" "}
                        <code className="body-xs">spring.snappy</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Grid / list — live">
                            <ViewLayoutDemo />
                        </Swatch>
                        {ICON_SEGMENTED_TOGGLE_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Text segmented toggle</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Sale / rent pill — labels not icons.{" "}
                        <code className="body-xs">components/shared/text-segmented-toggle.tsx</code>
                        . Reference demo uses <code className="body-xs">size="sm"</code> — same as
                        property-card price row.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Sale / rent — live">
                            <SaleRentDemo />
                        </Swatch>
                        {TEXT_SEGMENTED_TOGGLE_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Preference row</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Label and optional hint on the start side, switch on the end. This is the
                        notification-preferences and property-form pattern — never put the label
                        after the control on mobile.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="With hint">
                            <PreferenceRow
                                id="switch-sms"
                                label="SMS alerts"
                                hint="Site-visit reminders and owner replies"
                                defaultChecked
                            />
                        </Swatch>
                        <Swatch label="Label only">
                            <PreferenceRow id="switch-email" label="Email digests" />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Filter toggles — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Flip either switch. Filter sheets use the same row layout without a card
                        chrome — just label + control, 48px tap height on mobile.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Slot filters">
                            <LiveToggleDemo />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Static states</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Disabled · on">
                            <PreferenceRow
                                id="switch-disabled-on"
                                label="Locked preference"
                                defaultChecked
                                disabled
                            />
                        </Swatch>
                        <Swatch label="Disabled · off">
                            <PreferenceRow
                                id="switch-disabled-off"
                                label="Unavailable"
                                disabled
                            />
                        </Swatch>
                        <Swatch label="Invalid">
                            <PreferenceRow
                                id="switch-invalid"
                                label="Must accept to continue"
                                hint="Turn this on to proceed"
                                invalid
                            />
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Switch is binary on/off only. Icon layouts →{" "}
                            <code className="body-xs">IconSegmentedToggle</code>. Short text pair
                            (Sale/Rent) → <code className="body-xs">TextSegmentedToggle</code>.
                            Three+ form options → <code className="body-xs">RadioGroup</code>.
                        </li>
                        <li>
                            Always pair with a visible label via{" "}
                            <code className="body-xs">htmlFor</code> /{" "}
                            <code className="body-xs">id</code>, or wrap both in a{" "}
                            <code className="body-xs">&lt;label&gt;</code>. Never a bare switch.
                        </li>
                        <li>
                            Checked fill is <code className="body-xs">brand</code>, not the
                            generic shadcn <code className="body-xs">primary</code>. Pass the
                            brand utility classes at the call site (or keep them colocated in the
                            form field wrapper) so the toggle matches Checkbox and Radio.
                        </li>
                        <li>
                            Do not animate the thumb with a bouncy spring — toggles use the
                            instant duration token. Bounce is reserved for genuine success states.
                        </li>
                        <li>
                            Disabled means the preference cannot change right now — keep the
                            current checked value visible, do not clear it.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
