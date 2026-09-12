"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { ArrowRightLeft } from "lucide-react";

import { areaToSqft, calculateLoadingPercent } from "@/lib/calc/area";
import type { PropertyDraftValues } from "@/lib/schemas/property";

import { AREA_UNIT_OPTIONS } from "@/constants/property";
import {
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepArea() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const category = watch("basics.category");
    const state = watch("location.state");
    const unit = watch("area.unit");
    const carpet = watch("area.carpetArea");
    const superBuiltUp = watch("area.superBuiltUpArea");
    const plotArea = watch("area.plotArea");
    const areaSqft = watch("area.areaSqft");
    const [converterValue, setConverterValue] = useState(1);
    const [converterUnit, setConverterUnit] = useState("bigha");
    const isPlot = category === "land" || category === "agricultural";

    useEffect(() => {
        const source = isPlot ? plotArea : carpet;
        const nextSqft = areaToSqft(source, unit, state);
        if (nextSqft > 0 && nextSqft !== areaSqft) {
            setValue("area.areaSqft", nextSqft, { shouldDirty: true, shouldValidate: true });
        }
        const loading = calculateLoadingPercent(carpet, superBuiltUp);
        setValue("area.loadingPercent", loading, { shouldDirty: false });
    }, [areaSqft, carpet, isPlot, plotArea, setValue, state, superBuiltUp, unit]);

    return (
        <div className="space-y-8">
            <WizardSection
                title="Measure once, compare everywhere"
                description="The chosen unit stays on the listing; a normalised sq ft value powers filters."
            >
                <div className={FORM_GRID_CLASS}>
                    <SelectField name="area.unit" label="Area unit" options={AREA_UNIT_OPTIONS} />
                    {isPlot ? (
                        <NumberField name="area.plotArea" label="Plot area" step={0.01} />
                    ) : (
                        <NumberField
                            name="area.carpetArea"
                            label="Carpet area"
                            step={0.01}
                            hint="The usable space inside the property."
                        />
                    )}
                    {!isPlot ? (
                        <>
                            <NumberField
                                name="area.builtUpArea"
                                label="Built-up area"
                                step={0.01}
                            />
                            <NumberField
                                name="area.superBuiltUpArea"
                                label="Super built-up area"
                                step={0.01}
                            />
                        </>
                    ) : null}
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
                            {areaSqft.toLocaleString("en-IN")} sq ft
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
                description="Check a local land unit without changing the saved property area."
            >
                <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto_1fr]">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="area-converter-value"
                            className="text-sm font-semibold text-ink"
                        >
                            Amount
                        </label>
                        <input
                            id="area-converter-value"
                            type="number"
                            min={0}
                            step="0.01"
                            value={converterValue}
                            onChange={(event) => setConverterValue(Number(event.target.value))}
                            className="
                              rounded-control border-2 border-border-warm bg-surface px-4
                              text-[15px] text-ink outline-none block-control-xl inline-full
                              focus-visible:border-ring focus-visible:ring-3
                              focus-visible:ring-ring/30
                            "
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="area-converter-unit"
                            className="text-sm font-semibold text-ink"
                        >
                            Unit
                        </label>
                        <select
                            id="area-converter-unit"
                            value={converterUnit}
                            onChange={(event) => setConverterUnit(event.target.value)}
                            className="
                              rounded-control border-2 border-border-warm bg-surface px-4
                              text-[15px] text-ink outline-none block-control-xl inline-full
                              focus-visible:border-ring focus-visible:ring-3
                              focus-visible:ring-ring/30
                            "
                        >
                            {AREA_UNIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <ArrowRightLeft
                        className="mbe-3 hidden text-ink-muted block-5 inline-5 md:block"
                        aria-hidden
                    />
                    <div
                        className="rounded-control bg-brand-ink px-4 py-3 text-surface min-block-12"
                    >
                        <p className="text-xs text-surface/70">Sq ft equivalent</p>
                        <p className="tabular text-lg font-bold">
                            {areaToSqft(converterValue, converterUnit, state).toLocaleString(
                                "en-IN",
                            )}{" "}
                            sq ft
                        </p>
                    </div>
                </div>
                {converterUnit === "bigha" ? (
                    <p className="mbs-3 text-xs text-ink-muted">
                        Bigha uses the Gujarat conversion for Surat. This varies by state.
                    </p>
                ) : null}
            </WizardSection>
        </div>
    );
}
