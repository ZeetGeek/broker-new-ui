"use client";

import { Controller, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
    PROPERTY_TYPE_OPTIONS,
    type PropertyFormValues,
} from "@/lib/validation/property";

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

export function StepBasics() {
    const {
        control,
        register,
        watch,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const transactionType = watch("transactionType");
    const propertyType = watch("propertyType");
    const isResidential = ["apartment", "villa", "penthouse"].includes(propertyType);

    return (
        <div className="flex flex-col gap-5">
            <div className={fieldClass}>
                <p className={labelClass}>Looking to</p>
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            ["sale", "Sell"],
                            ["rent", "Rent"],
                            ["both", "Both"],
                        ] as const
                    ).map(([value, label]) => (
                        <Controller
                            key={value}
                            name="transactionType"
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
                {errors.transactionType ? (
                    <p className={errorClass}>{errors.transactionType.message}</p>
                ) : null}
            </div>

            <div className={fieldClass}>
                <p className={labelClass}>Property type</p>
                <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <Controller
                            key={option.value}
                            name="propertyType"
                            control={control}
                            render={({ field }) => (
                                <button
                                    type="button"
                                    className={chipClass(field.value === option.value)}
                                    onClick={() => field.onChange(option.value)}
                                >
                                    {option.label}
                                </button>
                            )}
                        />
                    ))}
                </div>
                {errors.propertyType ? (
                    <p className={errorClass}>{errors.propertyType.message}</p>
                ) : null}
            </div>

            {isResidential ? (
                <div className={fieldClass}>
                    <label htmlFor="bhk" className={labelClass}>
                        BHK
                    </label>
                    <Input
                        id="bhk"
                        type="number"
                        min={1}
                        max={10}
                        {...register("bhk", { valueAsNumber: true })}
                    />
                    {errors.bhk ? <p className={errorClass}>{errors.bhk.message}</p> : null}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className={fieldClass}>
                    <label htmlFor="locality" className={labelClass}>
                        Locality
                    </label>
                    <Input id="locality" placeholder="e.g. Vesu" {...register("locality")} />
                    {errors.locality ? (
                        <p className={errorClass}>{errors.locality.message}</p>
                    ) : null}
                </div>
                <div className={fieldClass}>
                    <label htmlFor="city" className={labelClass}>
                        City
                    </label>
                    <Input id="city" {...register("city")} />
                    {errors.city ? <p className={errorClass}>{errors.city.message}</p> : null}
                </div>
            </div>

            <div className={fieldClass}>
                <label htmlFor="address" className={labelClass}>
                    Address
                </label>
                <Input
                    id="address"
                    placeholder="Building, street, landmark"
                    {...register("address")}
                />
                {errors.address ? <p className={errorClass}>{errors.address.message}</p> : null}
            </div>

            <div className={fieldClass}>
                <label htmlFor="pinCode" className={labelClass}>
                    PIN code
                </label>
                <Input
                    id="pinCode"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 digits"
                    {...register("pinCode")}
                />
                {errors.pinCode ? <p className={errorClass}>{errors.pinCode.message}</p> : null}
            </div>

            <p className="body-xs text-ink-subtle">
                Currently listing as{" "}
                {transactionType === "both"
                    ? "sale and rent"
                    : transactionType === "rent"
                      ? "rent"
                      : "sale"}
                .
            </p>
        </div>
    );
}
