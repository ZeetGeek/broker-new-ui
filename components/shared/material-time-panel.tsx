"use client";
import { useState } from "react";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimeClock } from "@mui/x-date-pickers/TimeClock";
import { formatInTimeZone } from "date-fns-tz";

import {
    dateToTimeOnly as clockValue,
    timeOnlyToDate as clockDate,
} from "@/lib/datetime/time-only";

import type { TimePickerProps } from "@/components/reui/time-picker";
import { IconButton } from "@/components/shared/icon-button";
import { Clock, Keyboard } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import styles from "./material-time-panel.module.css";

export type MaterialTimePanelProps = Pick<
    TimePickerProps,
    | "value"
    | "disabled"
    | "readOnly"
    | "min"
    | "max"
    | "minuteStep"
    | "hourStep"
    | "secondStep"
    | "granularity"
    | "isTimeDisabled"
    | "hourCycle"
    | "required"
> & {
    onChange?: (value: string) => void;
    timeZone: string;
    onAccept?: (value: string) => void;
    onCancel?: () => void;
};

function snapNow(
    timeZone: string,
    minuteStep: number,
    secondStep: number,
    withSeconds: boolean,
): Date {
    const now = clockDate(formatInTimeZone(new Date(), timeZone, "HH:mm:ss")) ?? new Date();
    now.setMinutes(
        Math.floor(now.getMinutes() / minuteStep) * minuteStep,
        withSeconds ? Math.floor(now.getSeconds() / secondStep) * secondStep : 0,
    );
    return now;
}

/** MUI supplies the accessible clock dial; the surrounding controls follow our M3 theme. */
export default function MaterialTimePanel({
    value,
    onChange,
    disabled,
    readOnly,
    min,
    max,
    minuteStep = 1,
    hourStep = 1,
    secondStep = 1,
    granularity = "minute",
    isTimeDisabled,
    timeZone,
    hourCycle = 12,
    required = false,
    onAccept,
    onCancel,
}: MaterialTimePanelProps) {
    const seconds = granularity === "second";
    const [selected, setSelected] = useState<Date | null>(
        () => clockDate(value) ?? snapNow(timeZone, minuteStep, secondStep, seconds),
    );
    const current = selected ?? snapNow(timeZone, minuteStep, secondStep, seconds);
    const [view, setView] = useState<"hours" | "minutes" | "seconds">("hours");
    const [typing, setTyping] = useState(false);
    const displayHour = (date: Date) =>
        String(hourCycle === 24 ? date.getHours() : date.getHours() % 12 || 12).padStart(2, "0");
    const [typedHour, setTypedHour] = useState(displayHour(current));
    const [typedMinute, setTypedMinute] = useState(String(current.getMinutes()).padStart(2, "0"));
    const [message, setMessage] = useState("");
    const period = current.getHours() >= 12 ? "PM" : "AM";
    const blocked = disabled || readOnly;
    const views =
        granularity === "hour"
            ? (["hours"] as const)
            : seconds
              ? (["hours", "minutes", "seconds"] as const)
              : (["hours", "minutes"] as const);
    const allowed = (next: Date) => {
        const text = clockValue(next, seconds);
        const total = next.getHours() * 3600 + next.getMinutes() * 60 + next.getSeconds();
        const toSeconds = (limit: string) => {
            const [h, m, s = 0] = limit.split(":").map(Number);
            return h * 3600 + m * 60 + s;
        };
        const from = min ? toSeconds(min) : 0;
        const to = max ? toSeconds(max) : 86399;
        const inRange = from <= to ? total >= from && total <= to : total >= from || total <= to;
        return (
            inRange &&
            next.getHours() % hourStep === 0 &&
            next.getMinutes() % minuteStep === 0 &&
            next.getSeconds() % secondStep === 0 &&
            !isTimeDisabled?.(text, {
                hour: next.getHours(),
                minute: next.getMinutes(),
                second: next.getSeconds(),
            })
        );
    };
    const commit = (next: Date | null) => {
        if (!next || blocked) return false;
        setSelected(next);
        if (!allowed(next)) {
            setMessage("Choose a time within the available hours.");
            return false;
        }
        setMessage("");
        onChange?.(clockValue(next, seconds));
        return true;
    };
    const setPeriod = (next: "AM" | "PM") => {
        const date = new Date(current);
        date.setHours((date.getHours() % 12) + (next === "PM" ? 12 : 0));
        commit(date);
    };
    const commitTyped = () => {
        if (
            !/^\d{1,2}$/.test(typedHour) ||
            +typedHour < (hourCycle === 24 ? 0 : 1) ||
            +typedHour > (hourCycle === 24 ? 23 : 12) ||
            !/^\d{1,2}$/.test(typedMinute) ||
            +typedMinute > 59
        ) {
            setMessage(
                `Enter an hour from ${hourCycle === 24 ? "0 to 23" : "1 to 12"} and minutes from 00 to 59.`,
            );
            return null;
        }
        const date = new Date(current);
        date.setHours(
            hourCycle === 24 ? +typedHour : (+typedHour % 12) + (period === "PM" ? 12 : 0),
            +typedMinute,
        );
        return commit(date) ? date : null;
    };
    const shortcuts = (
        <div className={styles.shortcuts}>
            {!required && (
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        if (blocked) return;
                        onChange?.("");
                        setSelected(null);
                        setMessage("");
                        if (onAccept) {
                            onAccept("");
                        }
                    }}
                    disabled={blocked}
                >
                    Clear
                </Button>
            )}
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                    const next = snapNow(timeZone, minuteStep, secondStep, seconds);
                    if (commit(next)) {
                        setTypedHour(displayHour(next));
                        setTypedMinute(String(next.getMinutes()).padStart(2, "0"));
                    }
                }}
                disabled={blocked}
            >
                Now
            </Button>
        </div>
    );
    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <p className={styles.title}>{typing ? "Enter time" : "Select time"}</p>
                {onAccept ? shortcuts : null}
            </div>
            <div className={styles.toolbar} data-hour-cycle={hourCycle}>
                {typing ? (
                    <input
                        aria-label="Hour"
                        data-time-display
                        autoComplete="off"
                        onFocus={(event) => event.currentTarget.select()}
                        className={styles.timeValue}
                        inputMode="numeric"
                        maxLength={2}
                        value={typedHour}
                        disabled={blocked}
                        onChange={(event) => setTypedHour(event.target.value.replace(/\D/g, ""))}
                        onBlur={commitTyped}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitTyped();
                            }
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        data-time-display
                        className={styles.timeValue}
                        data-active={view === "hours"}
                        aria-label="Choose hour"
                        aria-pressed={view === "hours"}
                        onClick={() => setView("hours")}
                        disabled={blocked}
                    >
                        {displayHour(current)}
                    </button>
                )}
                <span className={styles.colon} aria-hidden>
                    :
                </span>
                {typing ? (
                    <input
                        aria-label="Minute"
                        data-time-display
                        autoComplete="off"
                        onFocus={(event) => event.currentTarget.select()}
                        className={styles.timeValue}
                        inputMode="numeric"
                        maxLength={2}
                        value={typedMinute}
                        disabled={blocked || granularity === "hour"}
                        onChange={(event) => setTypedMinute(event.target.value.replace(/\D/g, ""))}
                        onBlur={commitTyped}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitTyped();
                            }
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        data-time-display
                        className={styles.timeValue}
                        data-active={view === "minutes"}
                        aria-label="Choose minutes"
                        aria-pressed={view === "minutes"}
                        onClick={() => setView("minutes")}
                        disabled={blocked || granularity === "hour"}
                    >
                        {String(current.getMinutes()).padStart(2, "0")}
                    </button>
                )}
                {hourCycle === 12 && (
                    <div className={styles.period} role="group" aria-label="AM or PM">
                        {(["AM", "PM"] as const).map((item) => (
                            <button
                                type="button"
                                key={item}
                                disabled={blocked}
                                aria-pressed={period === item}
                                onClick={() => setPeriod(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {typing && (
                <div className={styles.inputLabels} data-hour-cycle={hourCycle} aria-hidden>
                    <span>Hour</span>
                    <span>Minute</span>
                </div>
            )}
            {seconds && !typing && (
                <button
                    type="button"
                    className={styles.seconds}
                    onClick={() => setView("seconds")}
                    aria-pressed={view === "seconds"}
                    disabled={blocked}
                >
                    Seconds: {String(current.getSeconds()).padStart(2, "0")}
                </button>
            )}
            {!typing && (
                <div className={styles.clock}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <TimeClock
                            value={selected}
                            referenceDate={current}
                            ampm={hourCycle === 12}
                            ampmInClock={false}
                            view={view}
                            views={[...views]}
                            onViewChange={setView}
                            onChange={commit}
                            disabled={disabled}
                            readOnly={readOnly}
                            minutesStep={minuteStep}
                            minTime={
                                min && (!max || min <= max)
                                    ? (clockDate(min) ?? undefined)
                                    : undefined
                            }
                            maxTime={
                                max && (!min || min <= max)
                                    ? (clockDate(max) ?? undefined)
                                    : undefined
                            }
                            shouldDisableTime={(date, unit) =>
                                unit === "hours" ? date.getHours() % hourStep !== 0 : !allowed(date)
                            }
                            sx={{
                                width: "100%",
                                height: "16rem",
                                maxHeight: "16rem",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                "& .MuiClock-root": {
                                    margin: 0,
                                    // MUI's pointer math uses a 220px dial. Scaling it offsets picks.
                                    transform: "none",
                                },
                                "& .MuiClock-wrapper:focus-visible": {
                                    outline: "0.125rem solid var(--color-brand)",
                                    outlineOffset: "0.25rem",
                                    borderRadius: "50%",
                                },
                                "@media (prefers-reduced-motion: reduce)": {
                                    "& .MuiClockPointer-root": { transition: "none" },
                                },
                                "& .MuiClock-clock": {
                                    backgroundColor: "var(--color-surface-muted)",
                                },
                                "& .MuiClock-pin, & .MuiClockPointer-root": {
                                    backgroundColor: "var(--color-brand)",
                                },
                                "& .MuiClockPointer-thumb": {
                                    borderColor: "var(--color-brand)",
                                    backgroundColor: "var(--color-brand)",
                                },
                                "& .MuiClockNumber-root": {
                                    fontFamily: "inherit",
                                    color: "var(--color-ink)",
                                    fontWeight: 500,
                                    fontSize: "1rem",
                                },
                                "& .MuiClockNumber-root.Mui-selected": {
                                    color: "var(--color-surface)",
                                },
                                "& .MuiClockNumber-root.Mui-disabled": {
                                    color: "var(--color-ink-subtle)",
                                },
                            }}
                        />
                    </LocalizationProvider>
                </div>
            )}
            {message && (
                <p role="alert" className={styles.error}>
                    {message}
                </p>
            )}
            <div className={styles.footer}>
                <IconButton
                    type="button"
                    size="sm"
                    appearance="outline"
                    aria-label={typing ? "Switch to clock" : "Enter time with keyboard"}
                    onClick={() => {
                        if (typing && !commitTyped()) return;
                        setTypedHour(displayHour(current));
                        setTypedMinute(String(current.getMinutes()).padStart(2, "0"));
                        setTyping(!typing);
                        setMessage("");
                    }}
                    disabled={blocked}
                >
                    {typing ? <Clock aria-hidden /> : <Keyboard aria-hidden />}
                </IconButton>
                {onAccept ? (
                    <div>
                        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="accent"
                            disabled={blocked}
                            onClick={() => {
                                const next = typing ? commitTyped() : current;
                                if (!next) return;
                                if (!allowed(next)) {
                                    setMessage("Choose a time within the available hours.");
                                    return;
                                }
                                onAccept(clockValue(next, seconds));
                            }}
                        >
                            OK
                        </Button>
                    </div>
                ) : (
                    shortcuts
                )}
            </div>
        </div>
    );
}
