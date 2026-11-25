"use client";

import { type ComponentProps, useId } from "react";

import { useMobileMenu } from "@/hooks/use-mobile-menu";

import type { AppIcon } from "@/components/shared/icons";
import { ListToolbarSelect } from "@/components/shared/list-toolbar";
import { MobileSelectDrawer } from "@/components/shared/mobile-select-drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function VisitSelect({
    label,
    value,
    options,
    onChange,
    compact = false,
    toolbar = false,
    size = "default",
    startIcon,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    compact?: boolean;
    toolbar?: boolean;
    size?: ComponentProps<typeof SelectTrigger>["size"];
    startIcon?: AppIcon;
}) {
    const id = useId();
    const mobile = useMobileMenu();
    if (toolbar) {
        return (
            <ListToolbarSelect
                label={label}
                value={value}
                options={options}
                onChange={onChange}
                active
            />
        );
    }
    if (mobile) {
        return (
            <div className={compact ? "min-inline-36" : "flex flex-col gap-2"}>
                {!compact ? (
                    <label className="text-sm font-semibold text-ink" htmlFor={id}>
                        {label}
                    </label>
                ) : null}
                <MobileSelectDrawer
                    id={id}
                    label={label}
                    value={value}
                    options={options}
                    onChange={onChange}
                    startIcon={startIcon}
                    placeholder={`Choose ${label.toLowerCase()}`}
                />
            </div>
        );
    }
    return (
        <div className={compact ? "min-inline-36" : "flex flex-col gap-2"}>
            {!compact && (
                <label className="text-sm font-semibold text-ink" htmlFor={id}>
                    {label}
                </label>
            )}
            <Select
                items={options}
                value={value}
                onValueChange={(next) => {
                    if (next !== null) onChange(next);
                }}
            >
                <SelectTrigger
                    id={id}
                    aria-label={label}
                    size={compact ? "sm" : size}
                    startIcon={startIcon}
                    className="inline-full"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value || "any"} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
