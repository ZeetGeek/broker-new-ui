"use client";

import { type ChangeEvent, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Sofa, Sparkles } from "lucide-react";

import {
    amenityLabel,
    PROPERTY_AGE_OPTIONS,
    PROPERTY_AMENITY_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    PROPERTY_FACING_OPTIONS,
    PROPERTY_PARKING_OPTIONS,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { AppDatePicker } from "@/components/shared/app-date-picker";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FORM_CONTROL_CLASS } from "@/features/properties/property-form/form-controls";
import { FormSection } from "@/features/properties/property-form/form-ui";
import { SelectionChip } from "@/features/properties/property-form/selection-chip";

function optionalNumberRegister(
    onChange: (value: number | null) => void,
    value: number | null | undefined,
) {
    return {
        value: value ?? "",
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value;
            onChange(raw === "" ? null : Number(raw));
        },
    };
}

export function ListingExtraFields() {
    const {
        control,
        register,
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const amenities = watch("amenities");
    const furnishing = watch("furnishing");
    const bathrooms = watch("bathrooms");
    const propertyAge = watch("propertyAge");
    const propertyCondition = watch("propertyCondition");
    const [customAmenity, setCustomAmenity] = useState("");

    const interiorSummary =
        [
            furnishing === "semi"
                ? "Semi-furnished"
                : furnishing === "furnished"
                  ? "Furnished"
                  : "Unfurnished",
            bathrooms != null && bathrooms > 0
                ? `${bathrooms} ${bathrooms === 1 ? "bathroom" : "bathrooms"}`
                : null,
            propertyAge.trim() || null,
            propertyCondition
                ? (PROPERTY_CONDITION_OPTIONS.find((o) => o.value === propertyCondition)?.label ??
                  null)
                : null,
        ]
            .filter(Boolean)
            .join(" · ") || undefined;

    const amenitiesSummary =
        amenities.length > 0
            ? `${amenities.length} selected · ${amenities.slice(0, 2).map(amenityLabel).join(", ")}`
            : "No amenities picked yet";

    function addCustomAmenity() {
        const next = customAmenity.trim();
        if (!next) return;
        const key = next.toLowerCase().replace(/\s+/g, "_");
        if (amenities.includes(key) || amenities.includes(next)) {
            setCustomAmenity("");
            return;
        }
        setValue("amenities", [...amenities, key], { shouldDirty: true });
        setCustomAmenity("");
    }

    return (
        <>
            <div className="grid items-start gap-5">
                <FormSection
                    title="Interior & building"
                    icon={<Sofa />}
                    description="Optional — skip anything you don’t know yet."
                    defaultOpen={false}
                    hasError={
                        errors.furnishing != null ||
                        errors.bathrooms != null ||
                        errors.balconies != null ||
                        errors.floorNumber != null ||
                        errors.totalFloors != null ||
                        errors.maintenanceInr != null ||
                        errors.availableFrom != null ||
                        errors.propertyAge != null ||
                        errors.propertyCondition != null
                    }
                    summary={interiorSummary}
                >
                    <FieldGroup className="gap-5">
                        <Field>
                            <FieldLabel className="body-sm text-ink">Furnishing</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {(
                                    [
                                        ["unfurnished", "Unfurnished"],
                                        ["semi", "Semi-furnished"],
                                        ["furnished", "Furnished"],
                                    ] as const
                                ).map(([value, label]) => (
                                    <Controller
                                        key={value}
                                        name="furnishing"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === value}
                                                onClick={() => field.onChange(value)}
                                            >
                                                {label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                            <FieldError>{errors.furnishing?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Property age</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_AGE_OPTIONS.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="propertyAge"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === option.value}
                                                onClick={() =>
                                                    field.onChange(
                                                        field.value === option.value
                                                            ? ""
                                                            : option.value,
                                                    )
                                                }
                                            >
                                                {option.label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                            <FieldError>{errors.propertyAge?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Property condition</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_CONDITION_OPTIONS.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="propertyCondition"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === option.value}
                                                onClick={() =>
                                                    field.onChange(
                                                        field.value === option.value
                                                            ? null
                                                            : option.value,
                                                    )
                                                }
                                            >
                                                {option.label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                            <FieldError>{errors.propertyCondition?.message}</FieldError>
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="bathrooms" className="body-sm text-ink">
                                    Bathrooms
                                </FieldLabel>
                                <Controller
                                    name="bathrooms"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="bathrooms"
                                            aria-invalid={errors.bathrooms != null}
                                            type="number"
                                            min={0}
                                            className={FORM_CONTROL_CLASS}
                                            placeholder="e.g. 2"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.bathrooms?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="balconies" className="body-sm text-ink">
                                    Balconies
                                </FieldLabel>
                                <Controller
                                    name="balconies"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="balconies"
                                            aria-invalid={errors.balconies != null}
                                            type="number"
                                            min={0}
                                            className={FORM_CONTROL_CLASS}
                                            placeholder="e.g. 1"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.balconies?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="floorNumber" className="body-sm text-ink">
                                    Floor
                                </FieldLabel>
                                <Controller
                                    name="floorNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="floorNumber"
                                            aria-invalid={errors.floorNumber != null}
                                            type="number"
                                            min={0}
                                            className={FORM_CONTROL_CLASS}
                                            placeholder="e.g. 6"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.floorNumber?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="totalFloors" className="body-sm text-ink">
                                    Total floors
                                </FieldLabel>
                                <Controller
                                    name="totalFloors"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="totalFloors"
                                            aria-invalid={errors.totalFloors != null}
                                            type="number"
                                            min={0}
                                            className={FORM_CONTROL_CLASS}
                                            placeholder="e.g. 12"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.totalFloors?.message}</FieldError>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Facing</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_FACING_OPTIONS.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="facing"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === option.value}
                                                onClick={() =>
                                                    field.onChange(
                                                        field.value === option.value
                                                            ? null
                                                            : option.value,
                                                    )
                                                }
                                            >
                                                {option.label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                        </Field>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Parking</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_PARKING_OPTIONS.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="parking"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === option.value}
                                                onClick={() => field.onChange(option.value)}
                                            >
                                                {option.label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="maintenanceInr" className="body-sm text-ink">
                                Maintenance / month (₹)
                            </FieldLabel>
                            <Controller
                                name="maintenanceInr"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="maintenanceInr"
                                        aria-invalid={errors.maintenanceInr != null}
                                        type="number"
                                        inputMode="numeric"
                                        className={FORM_CONTROL_CLASS}
                                        placeholder="Optional · e.g. 3500"
                                        value={field.value ?? ""}
                                        onChange={(event) => {
                                            const raw = event.target.value;
                                            field.onChange(raw === "" ? null : Number(raw));
                                        }}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <FieldError>{errors.maintenanceInr?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="availableFrom" className="body-sm text-ink">
                                Available from
                            </FieldLabel>
                            <Controller
                                name="availableFrom"
                                control={control}
                                render={({ field }) => (
                                    <AppDatePicker
                                        id="availableFrom"
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        invalid={errors.availableFrom != null}
                                    />
                                )}
                            />
                            <FieldError>{errors.availableFrom?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                </FormSection>

                <FormSection
                    title="Amenities & description"
                    icon={<Sparkles />}
                    description="Highlight what makes this listing stand out."
                    defaultOpen={false}
                    hasError={errors.description != null || errors.amenities != null}
                    summary={amenitiesSummary}
                >
                    <FieldGroup className="gap-5">
                        <Field>
                            <FieldLabel className="body-sm text-ink">Amenities</FieldLabel>
                            <Controller
                                name="amenities"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex flex-wrap gap-2">
                                        {PROPERTY_AMENITY_OPTIONS.map((option) => {
                                            const checked = field.value.includes(option.value);
                                            return (
                                                <SelectionChip
                                                    key={option.value}
                                                    active={checked}
                                                    onClick={() => {
                                                        if (checked) {
                                                            field.onChange(
                                                                field.value.filter(
                                                                    (item) => item !== option.value,
                                                                ),
                                                            );
                                                        } else {
                                                            field.onChange([
                                                                ...field.value,
                                                                option.value,
                                                            ]);
                                                        }
                                                    }}
                                                >
                                                    {option.label}
                                                </SelectionChip>
                                            );
                                        })}
                                        {field.value
                                            .filter(
                                                (value) =>
                                                    !PROPERTY_AMENITY_OPTIONS.some(
                                                        (option) => option.value === value,
                                                    ),
                                            )
                                            .map((value) => (
                                                <SelectionChip
                                                    key={value}
                                                    active
                                                    onClick={() =>
                                                        field.onChange(
                                                            field.value.filter(
                                                                (item) => item !== value,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {amenityLabel(value)}
                                                </SelectionChip>
                                            ))}
                                    </div>
                                )}
                            />
                            <div className="flex flex-wrap items-center gap-2 pbs-1">
                                <Input
                                    value={customAmenity}
                                    onChange={(event) => setCustomAmenity(event.target.value)}
                                    placeholder="e.g. Jogging track"
                                    className={FORM_CONTROL_CLASS}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addCustomAmenity();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addCustomAmenity}
                                    className="body-sm font-semibold text-brand hover:underline"
                                >
                                    + Add custom
                                </button>
                            </div>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="description" className="body-sm text-ink">
                                Description
                            </FieldLabel>
                            <Textarea
                                id="description"
                                rows={5}
                                placeholder="Optional · a short note for buyers or tenants."
                                className="
                                  rounded-card border-2 border-border-warm bg-surface px-3.5 py-3
                                  text-[15px] text-ink min-block-32
                                  hover:border-ink-subtle
                                  focus-visible:border-ring focus-visible:ring-3
                                  focus-visible:ring-ring/30
                                  aria-invalid:border-danger-mid
                                "
                                {...register("description")}
                            />
                            <FieldError>{errors.description?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                </FormSection>
            </div>
        </>
    );
}
