"use client";

import { type ChangeEvent, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Building2, IndianRupee, MapPin } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { buildPropertyTitle } from "@/lib/format/property-title";
import { cn } from "@/lib/utils";
import {
    needsBhk,
    PROPERTY_BHK_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPE_LABELS,
    PROPERTY_TYPE_OPTIONS,
    PROPERTY_TYPES_BY_CATEGORY,
    type PropertyFormValues,
    type PropertyType,
} from "@/lib/validation/property";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { FORM_CONTROL_CLASS } from "@/features/properties/property-form/form-controls";
import { FormSection } from "@/features/properties/property-form/form-ui";
import { ListingExtraFields } from "@/features/properties/property-form/listing-extra-fields";
import {
    bhkIcon,
    CATEGORY_ICONS,
    PROPERTY_TYPE_ICONS,
    TRANSACTION_TYPE_ICONS,
} from "@/features/properties/property-form/option-icons";
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
    const state = watch("state");
    const society = watch("society");
    const transactionType = watch("transactionType");
    const showBhk = needsBhk(propertyType);
    const needsSale = transactionType === "sale" || transactionType === "both";
    const needsRent = transactionType === "rent" || transactionType === "both";

    const subtypeOptions = PROPERTY_TYPE_OPTIONS.filter((option) => option.category === category);

    const areaSqft = watch("areaSqft");
    const carpetAreaSqft = watch("carpetAreaSqft");

    const listingSummary = [
        transactionType === "both"
            ? "For sale & rent"
            : transactionType === "rent"
              ? "For rent"
              : "For sale",
        showBhk && bhk > 0 ? `${bhk} BHK` : null,
        PROPERTY_TYPE_LABELS[propertyType],
        areaSqft > 0 ? formatAreaSqft(areaSqft) : null,
        carpetAreaSqft != null && carpetAreaSqft > 0
            ? `Carpet ${formatAreaSqft(carpetAreaSqft)}`
            : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const locationSummary = [society, locality, city, state]
        .filter((part) => part?.trim())
        .join(", ");

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
        setValue("title", buildPropertyTitle({ bhk, propertyType, locality, city }), {
            shouldValidate: false,
        });
    }, [bhk, propertyType, locality, city, titleTouched, setValue]);

    return (
        <div className="flex flex-col gap-5">
            <div className="grid items-start gap-5">
                <FormSection
                    title="What are you listing?"
                    icon={<Building2 />}
                    description="Pick the deal type and property shape — takes a few taps."
                    hasError={
                        errors.transactionType != null ||
                        errors.category != null ||
                        errors.propertyType != null ||
                        errors.bhk != null ||
                        errors.areaSqft != null
                    }
                    summary={listingSummary}
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
                                                icon={TRANSACTION_TYPE_ICONS[value]}
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
                                                icon={CATEGORY_ICONS[option.value]}
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
                                                icon={PROPERTY_TYPE_ICONS[option.value]}
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
                                                    icon={bhkIcon()}
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="areaSqft" className="body-sm text-ink">
                                    Built-up area (sq.ft)
                                </FieldLabel>
                                <Input
                                    id="areaSqft"
                                    aria-invalid={errors.areaSqft != null}
                                    type="number"
                                    min={1}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="e.g. 1050"
                                    {...register("areaSqft", { valueAsNumber: true })}
                                />
                                <FieldError>{errors.areaSqft?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="carpetAreaSqft" className="body-sm text-ink">
                                    Carpet area (sq.ft)
                                </FieldLabel>
                                <Controller
                                    name="carpetAreaSqft"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="carpetAreaSqft"
                                            aria-invalid={errors.carpetAreaSqft != null}
                                            type="number"
                                            min={1}
                                            className={FORM_CONTROL_CLASS}
                                            placeholder="Optional · e.g. 880"
                                            {...optionalNumberRegister(field.onChange, field.value)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                <FieldError>{errors.carpetAreaSqft?.message}</FieldError>
                            </Field>
                        </div>
                    </FieldGroup>
                </FormSection>

                <FormSection
                    title="Where is it?"
                    icon={<MapPin />}
                    description="City and locality help brokers find the right matches."
                    hasError={
                        errors.city != null ||
                        errors.state != null ||
                        errors.locality != null ||
                        errors.society != null ||
                        errors.flatNo != null ||
                        errors.landmark != null ||
                        errors.pinCode != null ||
                        errors.address != null ||
                        errors.title != null
                    }
                    summary={locationSummary}
                >
                    <FieldGroup className="gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="city" className="body-sm text-ink">
                                    City
                                </FieldLabel>
                                <Input
                                    id="city"
                                    aria-invalid={errors.city != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="e.g. Surat"
                                    {...register("city")}
                                />
                                <FieldError>{errors.city?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="state" className="body-sm text-ink">
                                    State
                                </FieldLabel>
                                <Input
                                    id="state"
                                    aria-invalid={errors.state != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="Optional · e.g. Gujarat"
                                    {...register("state")}
                                />
                                <FieldError>{errors.state?.message}</FieldError>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="locality" className="body-sm text-ink">
                                    Locality / Sector
                                </FieldLabel>
                                <Input
                                    id="locality"
                                    aria-invalid={errors.locality != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="e.g. Vesu"
                                    {...register("locality")}
                                />
                                <FieldError>{errors.locality?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="society" className="body-sm text-ink">
                                    Society
                                </FieldLabel>
                                <Input
                                    id="society"
                                    aria-invalid={errors.society != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="Optional · society / complex"
                                    {...register("society")}
                                />
                                <FieldError>{errors.society?.message}</FieldError>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="flatNo" className="body-sm text-ink">
                                    Flat no.
                                </FieldLabel>
                                <Input
                                    id="flatNo"
                                    aria-invalid={errors.flatNo != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="Optional · e.g. A-1204"
                                    {...register("flatNo")}
                                />
                                <FieldError>{errors.flatNo?.message}</FieldError>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="landmark" className="body-sm text-ink">
                                    Landmark
                                </FieldLabel>
                                <Input
                                    id="landmark"
                                    aria-invalid={errors.landmark != null}
                                    className={FORM_CONTROL_CLASS}
                                    placeholder="Optional · nearby landmark"
                                    {...register("landmark")}
                                />
                                <FieldError>{errors.landmark?.message}</FieldError>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="pinCode" className="body-sm text-ink">
                                    PIN code
                                </FieldLabel>
                                <Input
                                    id="pinCode"
                                    aria-invalid={errors.pinCode != null}
                                    inputMode="numeric"
                                    maxLength={6}
                                    className={FORM_CONTROL_CLASS}
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
                                    aria-invalid={errors.address != null}
                                    className={FORM_CONTROL_CLASS}
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
                                aria-invalid={errors.title != null}
                                className={FORM_CONTROL_CLASS}
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
                icon={<IndianRupee />}
                description="Enter the asking price for this listing."
                hasError={
                    errors.saleAmountInr != null ||
                    errors.rentAmountInr != null ||
                    errors.pricePerSqft != null
                }
            >
                <FieldGroup className="gap-5">
                    <div
                        className={cn(
                            "grid gap-4",
                            needsSale && needsRent ? "sm:grid-cols-2" : "sm:grid-cols-1",
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
                                            aria-invalid={errors.saleAmountInr != null}
                                            type="number"
                                            inputMode="numeric"
                                            className={FORM_CONTROL_CLASS}
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
                                            aria-invalid={errors.rentAmountInr != null}
                                            type="number"
                                            inputMode="numeric"
                                            className={FORM_CONTROL_CLASS}
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

                    {needsSale ? (
                        <Field>
                            <FieldLabel htmlFor="pricePerSqft" className="body-sm text-ink">
                                Price per sq.ft (₹)
                            </FieldLabel>
                            <Controller
                                name="pricePerSqft"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="pricePerSqft"
                                        aria-invalid={errors.pricePerSqft != null}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        className={FORM_CONTROL_CLASS}
                                        placeholder="Optional · e.g. 8500"
                                        {...optionalNumberRegister(field.onChange, field.value)}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                            <FieldDescription className="body-xs text-ink-muted">
                                Leave blank to derive from sale price ÷ area when shown.
                            </FieldDescription>
                            <FieldError>{errors.pricePerSqft?.message}</FieldError>
                        </Field>
                    ) : null}
                </FieldGroup>
            </FormSection>

            <ListingExtraFields />
        </div>
    );
}
