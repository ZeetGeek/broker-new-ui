"use client";

import { Controller, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
    PROPERTY_PHOTO_OPTIONS,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { AppImage } from "@/components/shared/app-image";
import { Input } from "@/components/ui/input";

const fieldClass = "flex flex-col gap-1.5";
const labelClass = "body-sm font-medium text-ink";
const errorClass = "body-xs text-danger";

const chipClass = (active: boolean) =>
    cn(
        "body-sm rounded-full px-3 py-1.5 transition-colors duration-160",
        active
            ? "bg-ink font-semibold text-surface"
            : "bg-surface font-normal text-ink-muted hover:text-ink",
    );

export function StepPricePhotos() {
    const {
        control,
        register,
        watch,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const transactionType = watch("transactionType");
    const needsSale = transactionType === "sale" || transactionType === "both";
    const needsRent = transactionType === "rent" || transactionType === "both";

    return (
        <div className="flex flex-col gap-5">
            {needsSale ? (
                <div className={fieldClass}>
                    <label htmlFor="saleAmountInr" className={labelClass}>
                        Sale price (₹)
                    </label>
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
                    {errors.saleAmountInr ? (
                        <p className={errorClass}>{errors.saleAmountInr.message}</p>
                    ) : null}
                </div>
            ) : null}

            {needsRent ? (
                <div className={fieldClass}>
                    <label htmlFor="rentAmountInr" className={labelClass}>
                        Monthly rent (₹)
                    </label>
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
                    {errors.rentAmountInr ? (
                        <p className={errorClass}>{errors.rentAmountInr.message}</p>
                    ) : null}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className={fieldClass}>
                    <label htmlFor="areaSqft" className={labelClass}>
                        Area (sq.ft.)
                    </label>
                    <Input
                        id="areaSqft"
                        type="number"
                        min={1}
                        {...register("areaSqft", { valueAsNumber: true })}
                    />
                    {errors.areaSqft ? (
                        <p className={errorClass}>{errors.areaSqft.message}</p>
                    ) : null}
                </div>

                <div className={fieldClass}>
                    <p className={labelClass}>Furnishing</p>
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ["furnished", "Furnished"],
                                ["semi", "Semi"],
                                ["unfurnished", "Unfurnished"],
                            ] as const
                        ).map(([value, label]) => (
                            <Controller
                                key={value}
                                name="furnishing"
                                control={control}
                                render={({ field }) => (
                                    <button
                                        type="button"
                                        className={chipClass(field.value === value)}
                                        onClick={() => field.onChange(value)}
                                    >
                                        {label}
                                    </button>
                                )}
                            />
                        ))}
                    </div>
                    {errors.furnishing ? (
                        <p className={errorClass}>{errors.furnishing.message}</p>
                    ) : null}
                </div>
            </div>

            <div className={fieldClass}>
                <p className={labelClass}>Photos</p>
                <p className="body-xs text-ink-muted">
                    Pick at least one sample photo for this static preview.
                </p>
                <Controller
                    name="imageSrcs"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {PROPERTY_PHOTO_OPTIONS.map((src) => {
                                const selected = field.value.includes(src);
                                return (
                                    <button
                                        key={src}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => {
                                            if (selected) {
                                                field.onChange(
                                                    field.value.filter((item) => item !== src),
                                                );
                                            } else {
                                                field.onChange([...field.value, src]);
                                            }
                                        }}
                                        className={cn(
                                            "relative aspect-square overflow-hidden rounded-inner border-2",
                                            selected ? "border-brand" : "border-transparent",
                                        )}
                                    >
                                        <AppImage
                                            src={src}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                />
                {errors.imageSrcs ? (
                    <p className={errorClass}>{errors.imageSrcs.message as string}</p>
                ) : null}
            </div>
        </div>
    );
}
