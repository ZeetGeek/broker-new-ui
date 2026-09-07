"use client";

import { useState, type ChangeEvent } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
    PROPERTY_AMENITY_OPTIONS,
    PROPERTY_FACING_OPTIONS,
    PROPERTY_PARKING_OPTIONS,
    amenityLabel,
    type PropertyFormValues,
} from "@/lib/validation/property";

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    const [customAmenity, setCustomAmenity] = useState("");

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
            <div className="grid gap-5 lg:grid-cols-2">
                <FormSection
                    title="Interior & building"
                    description="Optional — skip anything you don’t know yet."
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
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 2"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
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
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 1"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
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
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 6"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
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
                                            type="number"
                                            min={0}
                                            placeholder="e.g. 12"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
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
                                        type="number"
                                        inputMode="numeric"
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
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="availableFrom" className="body-sm text-ink">
                                Available from
                            </FieldLabel>
                            <Controller
                                name="availableFrom"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="availableFrom"
                                        type="date"
                                        value={field.value ?? ""}
                                        onChange={(event) =>
                                            field.onChange(
                                                event.target.value ? event.target.value : null,
                                            )
                                        }
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </Field>
                    </FieldGroup>
                </FormSection>

                <FormSection
                    title="Amenities & description"
                    description="Highlight what makes this listing stand out."
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
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Input
                                    value={customAmenity}
                                    onChange={(event) => setCustomAmenity(event.target.value)}
                                    placeholder="e.g. Jogging track"
                                    className="max-w-xs"
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
                                className="rounded-card border-border-warm bg-surface min-block-28"
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
