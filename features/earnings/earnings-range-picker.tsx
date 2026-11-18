"use client";

import { startOfDay } from "date-fns";

import { AppDateRangePicker } from "@/components/shared/app-date-range-picker";

import {
    EARNINGS_PRESETS,
    type EarningsSelection,
    resolveEarningsWindow,
} from "@/features/earnings/earnings-math";

function presetLabel(selection: EarningsSelection): string {
    if (selection.preset === "custom") return "Custom range";
    return EARNINGS_PRESETS.find((p) => p.value === selection.preset)?.label ?? "Period";
}

/**
 * Earnings period control — shared range picker with FY / rolling-month presets.
 * Presets fill the draft; Update commits (preset id when still selected, else custom).
 */
export function EarningsRangePicker({
    value,
    onChange,
}: {
    value: EarningsSelection;
    onChange: (next: EarningsSelection) => void;
}) {
    const range = resolveEarningsWindow(value);
    const today = startOfDay(new Date());

    return (
        <AppDateRangePicker
            value={range}
            triggerLabel={presetLabel(value)}
            showSidebar
            showCompare={false}
            activePreset={value.preset === "custom" ? null : value.preset}
            presets={EARNINGS_PRESETS.map((preset) => ({
                value: preset.value,
                label: preset.label,
                resolve: () => {
                    const window = resolveEarningsWindow({ preset: preset.value });
                    // "All time" has no lower bound — seed the calendar with a far past day.
                    return {
                        from: window.from ? startOfDay(window.from) : new Date(2000, 0, 1),
                        to: startOfDay(window.to),
                    };
                },
            }))}
            onUpdate={({ range: next, preset }) => {
                if (preset && preset !== "custom") {
                    onChange({
                        preset: preset as Exclude<EarningsSelection["preset"], "custom">,
                    });
                    return;
                }
                onChange({
                    preset: "custom",
                    customFrom: next.from,
                    customTo: next.to ?? next.from ?? today,
                });
            }}
        />
    );
}
