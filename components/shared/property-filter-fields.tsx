"use client";

import { useId } from "react";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent as SelectPopup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { PROPERTY_CATEGORY_OPTIONS, PROPERTY_TYPES, toLabel } from "@/constants/property";

function Choice({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    const id = useId();
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <label id={id} className="text-sm font-medium text-ink">
                {label}
            </label>
            <Select items={options} value={value} onValueChange={(next) => onChange(next ?? "")}>
                <SelectTrigger size="md" aria-labelledby={id}>
                    <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectPopup>
            </Select>
        </div>
    );
}

export function PropertyFilterFields({
    value,
    onChange,
    fields = ["where", "type", "budget", "area", "category", "propertyType"],
}: {
    value?: Partial<PropertyListCriteria>;
    onChange: (next: PropertyListCriteria) => void;
    fields?: readonly ("where" | "type" | "budget" | "area" | "category" | "propertyType")[];
}) {
    const normalized = normalizePropertyCriteria(value);
    const v = {
        ...EMPTY_PROPERTY_CRITERIA,
        ...value,
        category: normalized.category,
        propertyType: normalized.propertyType,
        type: normalized.type,
    };
    const patch = (next: Partial<PropertyListCriteria>) =>
        onChange(normalizePropertyCriteria({ ...v, ...next }));
    const types: readonly string[] = v.category
        ? PROPERTY_TYPES[v.category]
        : [...new Set(Object.values(PROPERTY_TYPES).flat())];
    const range = (
        label: string,
        min: "min" | "minAreaSqft",
        max: "max" | "maxAreaSqft",
        unit: string,
    ) => (
        <fieldset className="flex flex-col gap-2">
            <legend className="mbe-2 text-sm font-medium text-ink">{label}</legend>
            <div className="grid grid-cols-2 gap-3">
                {([min, max] as const).map((key, index) => (
                    <Input
                        size="md"
                        key={key}
                        aria-label={`${index === 0 ? "Minimum" : "Maximum"} ${label.toLowerCase()}`}
                        inputMode="numeric"
                        type="number"
                        min={0}
                        placeholder={`${index === 0 ? "Min" : "Max"} ${unit}`}
                        value={v[key]}
                        onValueChange={(next) => onChange({ ...v, [key]: next })}
                    />
                ))}
            </div>
        </fieldset>
    );
    return (
        <div className="flex flex-col gap-5">
            {fields.includes("where") ? (
                <label className="flex flex-col gap-2 text-sm font-medium text-ink">
                    Where
                    <Input
                        size="md"
                        value={v.where}
                        onValueChange={(where) => onChange({ ...v, where })}
                        placeholder="City or locality"
                    />
                </label>
            ) : null}
            {fields.includes("type") ? (
                <div role="group" aria-label="Looking for" className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink">Looking for</span>
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ["", "Any"],
                                ["sale", "Sale"],
                                ["rent", "Rent"],
                            ] as const
                        ).map(([type, label]) => (
                            <Button
                                size="md"
                                key={type}
                                type="button"
                                variant={v.type === type ? "secondary" : "outline"}
                                aria-pressed={v.type === type}
                                className={
                                    v.type === type
                                        ? `border-brand bg-brand-soft text-brand-text`
                                        : undefined
                                }
                                onClick={() =>
                                    patch({
                                        type,
                                        ...(type !== v.type ? { min: "", max: "" } : {}),
                                    })
                                }
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : null}
            {fields.includes("budget")
                ? range(v.type === "rent" ? "Monthly rent" : "Budget", "min", "max", "₹")
                : null}
            {fields.includes("area") ? range("Area", "minAreaSqft", "maxAreaSqft", "sq ft") : null}
            {fields.includes("category") ? (
                <Choice
                    label="Category"
                    value={v.category}
                    options={[{ value: "", label: "Any category" }, ...PROPERTY_CATEGORY_OPTIONS]}
                    onChange={(category) =>
                        patch({
                            category: category as PropertyListCriteria["category"],
                            propertyType: "",
                        })
                    }
                />
            ) : null}
            {fields.includes("propertyType") ? (
                <Choice
                    label="Property type"
                    value={v.propertyType}
                    options={[
                        { value: "", label: "Any type" },
                        ...types.map((type) => ({ value: type, label: toLabel(type) })),
                    ]}
                    onChange={(propertyType) => patch({ propertyType })}
                />
            ) : null}
        </div>
    );
}
