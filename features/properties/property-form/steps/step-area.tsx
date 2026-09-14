"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { ArrowRightLeft } from "lucide-react";

import { areaToSqft, calculateLoadingPercent, convertArea } from "@/lib/calc/area";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { AREA_UNIT_OPTIONS } from "@/constants/property";
import {
    FORM_GRID_CLASS,
    NumberField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepArea() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const unit = watch("area.unit");
    const carpet = watch("area.carpetArea");
    const superBuiltUp = watch("area.superBuiltUpArea");
    const plotArea = watch("area.plotArea");
    const areaSqft = watch("area.areaSqft");
    const [converterValue, setConverterValue] = useState(1);
    const [converterUnit, setConverterUnit] = useState("sqm");
    const previousUnit = useRef(unit);
    const isPlot = derived.isPlot;

    useEffect(() => {
        const fromUnit = previousUnit.current;
        if (fromUnit === unit) return;
        previousUnit.current = unit;
        for (const path of ["carpetArea", "builtUpArea", "superBuiltUpArea", "plotArea"] as const) {
            const current = watch(`area.${path}`);
            if (current == null) continue;
            setValue(`area.${path}`, convertArea(current, fromUnit, unit), {
                shouldDirty: true,
            });
        }
    }, [setValue, unit, watch]);

    useEffect(() => {
        const source = isPlot ? plotArea : carpet;
        const nextSqft = areaToSqft(source, unit);
        if (nextSqft > 0 && nextSqft !== areaSqft) {
            setValue("area.areaSqft", nextSqft, { shouldDirty: true, shouldValidate: true });
        } else if (nextSqft === 0 && areaSqft !== 0) {
            setValue("area.areaSqft", 0, { shouldDirty: true, shouldValidate: true });
        }
        const loading = calculateLoadingPercent(carpet, superBuiltUp);
        setValue("area.loadingPercent", loading, { shouldDirty: false });
    }, [areaSqft, carpet, isPlot, plotArea, setValue, superBuiltUp, unit]);

    return (
        <div className="space-y-8">
            <WizardSection
                title="Measure once, compare everywhere"
                description="Enter areas in sq ft. The same unit powers listing filters."
            >
                <div className={FORM_GRID_CLASS}>
                    <NumberField name="area.plotArea" label="Plot area" step={0.01} />
                    <NumberField
                        name="area.carpetArea"
                        label="Carpet area"
                        step={0.01}
                        hint="The usable space inside the property."
                    />
                    <NumberField name="area.builtUpArea" label="Built-up area" step={0.01} />
                    <NumberField
                        name="area.superBuiltUpArea"
                        label="Super built-up area"
                        step={0.01}
                    />
                </div>

                <div
                    className="
                      mbs-6 grid overflow-hidden rounded-control border border-border-warm
                      bg-surface-muted
                      sm:grid-cols-2
                    "
                >
                    <div className="p-4 sm:border-e sm:border-border-warm">
                        <p className="text-xs text-ink-muted">Normalised area</p>
                        <p className="tabular mbs-1 text-xl font-bold text-ink">
                            {areaSqft > 0
                                ? `${areaSqft.toLocaleString()} sq ft`
                                : "Area not added"}
                        </p>
                    </div>
                    <div className="border-bs border-border-warm p-4 sm:border-bs-0">
                        <p className="text-xs text-ink-muted">Loading</p>
                        <p className="tabular mbs-1 text-xl font-bold text-ink">
                            {calculateLoadingPercent(carpet, superBuiltUp) == null
                                ? "Not enough data"
                                : `${calculateLoadingPercent(carpet, superBuiltUp)}%`}
                        </p>
                    </div>
                </div>
            </WizardSection>

            <WizardSection
                title="Unit converter"
                description="Check another unit without changing the saved property area."
            >
                <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto_1fr]">
                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="area-converter-value"
                            className="text-sm font-semibold text-ink"
                        >
                            Amount
                        </Label>
                        <Input
                            id="area-converter-value"
                            type="number"
                            min={0}
                            step="0.01"
                            value={converterValue}
                            onValueChange={(value) => setConverterValue(Number(value))}
                            size="lg"
                            className="
                              rounded-control border-2 border-border-warm bg-surface px-4
                              text-[15px] text-ink outline-none block-control-xl inline-full
                              focus-visible:border-ring focus-visible:ring-3
                              focus-visible:ring-ring/30
                            "
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label
                            htmlFor="area-converter-unit"
                            className="text-sm font-semibold text-ink"
                        >
                            Unit
                        </Label>
                        <Select
                            value={converterUnit}
                            onValueChange={(value) => setConverterUnit(value ?? "sqm")}
                        >
                            <SelectTrigger id="area-converter-unit" size="lg">
                                <SelectValue>
                                    {(value) =>
                                        AREA_UNIT_OPTIONS.find((option) => option.value === value)
                                            ?.label ?? "Choose a unit"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                {AREA_UNIT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ArrowRightLeft
                        className="mbe-3 hidden text-ink-muted block-5 inline-5 md:block"
                        aria-hidden
                    />
                    <div
                        className="
                      rounded-control bg-brand-ink px-4 py-3 text-surface min-block-12
                    "
                    >
                        <p className="text-xs text-surface/70">Sq ft equivalent</p>
                        <p className="tabular text-lg font-bold">
                            {(
                                convertArea(converterValue, converterUnit, "sqft") ?? 0
                            ).toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                            sq ft
                        </p>
                    </div>
                </div>
            </WizardSection>
        </div>
    );
}
