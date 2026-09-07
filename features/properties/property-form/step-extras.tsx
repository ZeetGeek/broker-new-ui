"use client";

import { Controller, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
    PROPERTY_AMENITY_OPTIONS,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const fieldClass = "flex flex-col gap-1.5";
const labelClass = "body-sm font-medium text-ink";
const errorClass = "body-xs text-danger";

export function StepExtras() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    return (
        <div className="flex flex-col gap-5">
            <div className={fieldClass}>
                <label htmlFor="availableFrom" className={labelClass}>
                    Available from (optional)
                </label>
                <Controller
                    name="availableFrom"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="availableFrom"
                            type="date"
                            value={field.value ?? ""}
                            onChange={(event) =>
                                field.onChange(event.target.value ? event.target.value : null)
                            }
                            onBlur={field.onBlur}
                        />
                    )}
                />
                {errors.availableFrom ? (
                    <p className={errorClass}>{errors.availableFrom.message}</p>
                ) : null}
            </div>

            <div className={fieldClass}>
                <label htmlFor="description" className={labelClass}>
                    Description
                </label>
                <textarea
                    id="description"
                    rows={5}
                    className="
                      body-sm w-full rounded-card border border-border-warm bg-surface px-4 py-3
                      text-ink outline-none
                      focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30
                    "
                    placeholder="What should a buyer or tenant know?"
                    {...register("description")}
                />
                {errors.description ? (
                    <p className={errorClass}>{errors.description.message}</p>
                ) : null}
            </div>

            <div className={fieldClass}>
                <p className={labelClass}>Amenities</p>
                <Controller
                    name="amenities"
                    control={control}
                    render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                            {PROPERTY_AMENITY_OPTIONS.map((option) => {
                                const checked = field.value.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={cn(
                                            "body-sm rounded-full px-3 py-1.5 transition-colors duration-160",
                                            checked
                                                ? "bg-ink font-semibold text-surface"
                                                : "bg-surface font-normal text-ink-muted hover:text-ink",
                                        )}
                                        onClick={() => {
                                            if (checked) {
                                                field.onChange(
                                                    field.value.filter(
                                                        (item) => item !== option.value,
                                                    ),
                                                );
                                            } else {
                                                field.onChange([...field.value, option.value]);
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                />
            </div>

            <Controller
                name="publish"
                control={control}
                render={({ field }) => (
                    <label className="flex items-center gap-3 rounded-card border border-border-warm bg-surface px-4 py-3">
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            onBlur={field.onBlur}
                        />
                        <span className="body-sm text-ink">
                            Publish now — make this listing visible
                        </span>
                    </label>
                )}
            />
        </div>
    );
}
