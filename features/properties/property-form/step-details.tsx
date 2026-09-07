"use client";

import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { buildPropertyTitle } from "@/lib/format/property-title";
import { cn } from "@/lib/utils";
import {
    PROPERTY_BHK_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES_BY_CATEGORY,
    PROPERTY_TYPE_OPTIONS,
    needsBhk,
    type PropertyFormValues,
    type PropertyType,
} from "@/lib/validation/property";

import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { FormSection } from "@/features/properties/property-form/form-ui";
import { ListingExtraFields } from "@/features/properties/property-form/listing-extra-fields";
import { SelectionChip } from "@/features/properties/property-form/selection-chip";

export function StepDetails({
    titleTouched,
    onTitleTouched,
}: {
    titleTouched: boolean;
    onTitleTouched: () => void;
}) {
    const {
        control,
        register,
        setValue,
        watch,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const category = watch("category");
    const propertyType = watch("propertyType");
    const bhk = watch("bhk");
    const locality = watch("locality");
    const city = watch("city");
    const transactionType = watch("transactionType");
    const showBhk = needsBhk(propertyType);
    const needsSale = transactionType === "sale" || transactionType === "both";
    const needsRent = transactionType === "rent" || transactionType === "both";

    const subtypeOptions = PROPERTY_TYPE_OPTIONS.filter((option) => option.category === category);

    useEffect(() => {
        const allowed = PROPERTY_TYPES_BY_CATEGORY[category];
        if (!allowed.includes(propertyType)) {
            const nextType = allowed[0]!;
            setValue("propertyType", nextType, { shouldDirty: true });
            if (!needsBhk(nextType)) {
                setValue("bhk", 0, { shouldDirty: true });
            } else if (bhk < 1) {
                setValue("bhk", 2, { shouldDirty: true });
            }
        }
    }, [category, propertyType, bhk, setValue]);

    useEffect(() => {
        if (titleTouched) return;
        setValue(
            "title",
            buildPropertyTitle({ bhk, propertyType, locality, city }),
            { shouldValidate: false },
        );
    }, [bhk, propertyType, locality, city, titleTouched, setValue]);

    return (
        <div className="flex flex-col gap-5">
            <div className="grid gap-5 lg:grid-cols-2">
                <FormSection
                    title="What are you listing?"
                    description="Pick the deal type and property shape — takes a few taps."
                >
                    <FieldGroup className="gap-5">
                        <Field>
                            <FieldLabel className="body-sm text-ink">Listing type</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {(
                                    [
                                        ["sale", "For sale"],
                                        ["rent", "For rent"],
                                        ["both", "Both"],
                                    ] as const
                                ).map(([value, label]) => (
                                    <Controller
                                        key={value}
                                        name="transactionType"
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
                            <FieldError>{errors.transactionType?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Category</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {PROPERTY_CATEGORY_OPTIONS.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="category"
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
                            <FieldError>{errors.category?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel className="body-sm text-ink">Subtype</FieldLabel>
                            <div className="flex flex-wrap gap-2">
                                {subtypeOptions.map((option) => (
                                    <Controller
                                        key={option.value}
                                        name="propertyType"
                                        control={control}
                                        render={({ field }) => (
                                            <SelectionChip
                                                active={field.value === option.value}
                                                onClick={() => {
                                                    field.onChange(option.value);
                                                    if (!needsBhk(option.value as PropertyType)) {
                                                        setValue("bhk", 0, { shouldDirty: true });
                                                    } else if (bhk < 1) {
                                                        setValue("bhk", 2, { shouldDirty: true });
                                                    }
                                                }}
                                            >
                                                {option.label}
                                            </SelectionChip>
                                        )}
                                    />
                                ))}
                            </div>
                            <FieldError>{errors.propertyType?.message}</FieldError>
                        </Field>

                        {showBhk ? (
                            <Field>
                                <FieldLabel className="body-sm text-ink">BHK</FieldLabel>
                                <div className="flex flex-wrap gap-2">
                                    {PROPERTY_BHK_OPTIONS.map((option) => (
                                        <Controller
                                            key={option.value}
                                            name="bhk"
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
                                <FieldError>{errors.bhk?.message}</FieldError>
                            </Field>
                        ) : null}

                        <Field>
                            <FieldLabel htmlFor="areaSqft" className="body-sm text-ink">
                                Area (sq.ft)
                            </FieldLabel>
                            <Input
                                id="areaSqft"
                                type="number"
                                min={1}
                                placeholder="e.g. 1050"
                                {...register("areaSqft", { valueAsNumber: true })}
                            />
                            <FieldError>{errors.areaSqft?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                </FormSection>

                <FormSection
                    title="Where is it?"
                    description="City and locality help brokers find the right matches."
                >
                    <FieldGroup className="gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="city" className="body-sm text-ink">
                                    City
                                </FieldLabel>
                                <Input id="city" placeholder="e.g. Surat" {...register("city")} />
                                <FieldError>{errors.city?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="locality" className="body-sm text-ink">
                                    Locality / Sector
                                </FieldLabel>
                                <Input
                                    id="locality"
                                    placeholder="e.g. Vesu"
                                    {...register("locality")}
                                />
                                <FieldError>{errors.locality?.message}</FieldError>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="pinCode" className="body-sm text-ink">
                                    PIN code
                                </FieldLabel>
                                <Input
                                    id="pinCode"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="Optional · 6 digits"
                                    {...register("pinCode")}
                                />
                                <FieldError>{errors.pinCode?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="address" className="body-sm text-ink">
                                    Address
                                </FieldLabel>
                                <Input
                                    id="address"
                                    placeholder="Optional · building, street"
                                    {...register("address")}
                                />
                                <FieldError>{errors.address?.message}</FieldError>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="title" className="body-sm text-ink">
                                Listing title
                            </FieldLabel>
                            <Input
                                id="title"
                                placeholder="e.g. 2 BHK Apartment in Vesu, Surat"
                                {...register("title", {
                                    onChange: () => onTitleTouched(),
                                })}
                            />
                            <FieldDescription className="body-xs text-ink-muted">
                                Auto-filled from BHK, subtype, locality, and city — edit anytime.
                            </FieldDescription>
                            <FieldError>{errors.title?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                </FormSection>
            </div>

            <FormSection
                title="Price"
                description="Enter the asking price for this listing."
            >
                <FieldGroup className="gap-5">
                    <div
                        className={cn(
                            "grid gap-4",
                            needsSale && needsRent ? "sm:grid-cols-2" : "sm:grid-cols-1 sm:max-w-md",
                        )}
                    >
                        {needsSale ? (
                            <Field>
                                <FieldLabel htmlFor="saleAmountInr" className="body-sm text-ink">
                                    Sale price (₹)
                                </FieldLabel>
                                <Controller
                                    name="saleAmountInr"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="saleAmountInr"
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="e.g. 8500000"
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                                const raw = event.target.value;
                                                field.onChange(raw === "" ? null : Number(raw));
                                            }}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.saleAmountInr?.message}</FieldError>
                            </Field>
                        ) : null}

                        {needsRent ? (
                            <Field>
                                <FieldLabel htmlFor="rentAmountInr" className="body-sm text-ink">
                                    Monthly rent (₹)
                                </FieldLabel>
                                <Controller
                                    name="rentAmountInr"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="rentAmountInr"
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="e.g. 25000"
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                                const raw = event.target.value;
                                                field.onChange(raw === "" ? null : Number(raw));
                                            }}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.rentAmountInr?.message}</FieldError>
                            </Field>
                        ) : null}
                    </div>
                </FieldGroup>
            </FormSection>

            <ListingExtraFields />
        </div>
    );
}
