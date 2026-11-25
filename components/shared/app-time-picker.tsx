"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";

import { timeOnlyToDate } from "@/lib/datetime/time-only";
import { formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import {
    TimePicker,
    TimePickerContent,
    type TimePickerProps,
    TimePickerTrigger,
} from "@/components/reui/time-picker";
import { Clock } from "@/components/shared/icons";
import { MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { Button } from "@/components/ui/button";

const MaterialTimePanel = dynamic(() => import("./material-time-panel"), {
    ssr: false,
    loading: () => (
        <div role="status" className="p-6 text-sm text-ink-muted inline-80 min-block-96">
            Loading clock…
        </div>
    ),
});

function formatTimeLabel(value: string): string {
    const parsed = timeOnlyToDate(value);
    return parsed ? formatTimeIn(parsed) : value;
}

/** Material clock with AM/PM; selections apply immediately. Values stay HH:mm. */
export function AppTimePicker({
    id,
    value,
    onChange,
    error,
    className,
    onBlur,
    ...props
}: Omit<TimePickerProps, "children" | "onValueChange" | "className"> & {
    onChange: (value: string) => void;
    error?: string;
    className?: string;
    onBlur?: () => void;
}) {
    const mobile = useMobileMenu();
    const generatedId = useId();
    const [localOpen, setLocalOpen] = useState(false);
    const open = props.open ?? localOpen;
    const fieldId = id ?? generatedId;
    const describedBy =
        [props["aria-describedby"], error ? `${fieldId}-error` : null].filter(Boolean).join(" ") ||
        undefined;
    const label = props["aria-label"] ?? "Select time";
    const formattedValue = value ? formatTimeLabel(value) : "";
    const changeOpen = (next: boolean) => {
        setLocalOpen(next);
        props.onOpenChange?.(next);
        if (mobile && !next) onBlur?.();
    };

    if (mobile) {
        return (
            <div className={cn("min-inline-0", className)}>
                <TimePicker
                    {...props}
                    open={open}
                    onOpenChange={changeOpen}
                    id={fieldId}
                    timeZone={VISITS_TIME_ZONE}
                    value={value || null}
                    onValueChange={(next) => onChange(next ?? "")}
                    invalid={props.invalid || !!error}
                    aria-describedby={describedBy}
                >
                    <MobileActionDrawer
                        open={open}
                        onOpenChange={changeOpen}
                        title={label}
                        description={formattedValue || "Choose a time"}
                        trigger={
                            <Button
                                id={fieldId}
                                type="button"
                                variant="outline"
                                size="lg"
                                disabled={props.disabled}
                                aria-label={formattedValue ? `${label}: ${formattedValue}` : label}
                                aria-describedby={describedBy}
                                aria-invalid={props.invalid || !!error || undefined}
                                className={cn(
                                    "justify-between border-border-warm bg-surface font-normal text-ink shadow-none inline-full",
                                    !formattedValue && "text-ink-subtle",
                                )}
                            >
                                <span className="truncate tabular-nums">
                                    {formattedValue || props.placeholder || "Select time"}
                                </span>
                                <Clock aria-hidden className="shrink-0 text-ink-muted" />
                            </Button>
                        }
                    >
                        <div className="flex flex-col items-center gap-4">
                            {open ? (
                                <MaterialTimePanel
                                    value={value}
                                    onChange={onChange}
                                    timeZone={props.timeZone ?? VISITS_TIME_ZONE}
                                    disabled={props.disabled}
                                    readOnly={props.readOnly}
                                    min={props.min}
                                    max={props.max}
                                    minuteStep={props.minuteStep}
                                    hourStep={props.hourStep}
                                    secondStep={props.secondStep}
                                    granularity={props.granularity}
                                    isTimeDisabled={props.isTimeDisabled}
                                />
                            ) : null}
                            <Button
                                type="button"
                                variant="accent"
                                size="lg"
                                className="inline-full"
                                onClick={() => changeOpen(false)}
                            >
                                Done
                            </Button>
                        </div>
                    </MobileActionDrawer>
                </TimePicker>
                {error ? (
                    <p id={`${fieldId}-error`} role="alert" className="body-xs mbs-1.5 text-danger">
                        {error}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn("min-inline-0", className)}>
            <TimePicker
                {...props}
                open={open}
                onOpenChange={changeOpen}
                id={fieldId}
                timeZone={VISITS_TIME_ZONE}
                value={value || null}
                onValueChange={(next) => onChange(next ?? "")}
                invalid={props.invalid || !!error}
                aria-describedby={describedBy}
            >
                <TimePickerTrigger
                    size="lg"
                    onBlur={onBlur}
                    className="border-border-warm bg-surface font-normal text-ink shadow-none inline-full data-placeholder:text-ink-subtle"
                />
                <TimePickerContent
                    side="bottom"
                    align="center"
                    sideOffset={8}
                    collisionAvoidance={{ side: "none", align: "shift", fallbackAxisSide: "none" }}
                    className="overflow-y-auto rounded-card border border-border-warm bg-surface shadow-lg max-block-(--available-height)"
                >
                    {open && (
                        <MaterialTimePanel
                            value={value}
                            onChange={onChange}
                            timeZone={props.timeZone ?? VISITS_TIME_ZONE}
                            disabled={props.disabled}
                            readOnly={props.readOnly}
                            min={props.min}
                            max={props.max}
                            minuteStep={props.minuteStep}
                            hourStep={props.hourStep}
                            secondStep={props.secondStep}
                            granularity={props.granularity}
                            isTimeDisabled={props.isTimeDisabled}
                        />
                    )}
                </TimePickerContent>
            </TimePicker>
            {error && (
                <p id={`${fieldId}-error`} role="alert" className="body-xs mbs-1.5 text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
