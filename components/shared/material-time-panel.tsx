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
> & { onChange: (value: string) => void; timeZone: string };

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
}: MaterialTimePanelProps) {
    const [selected, setSelected] = useState(() => clockDate(value));
    const current = selected ?? new Date(2000, 0, 1, 12, 0);
    const [view, setView] = useState<"hours" | "minutes" | "seconds">("hours");
    const [typing, setTyping] = useState(false);
    const [typedHour, setTypedHour] = useState(
        String(current.getHours() % 12 || 12).padStart(2, "0"),
    );
    const [typedMinute, setTypedMinute] = useState(String(current.getMinutes()).padStart(2, "0"));
    const [message, setMessage] = useState("");
    const period = current.getHours() >= 12 ? "PM" : "AM";
    const blocked = disabled || readOnly;
    const seconds = granularity === "second";
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
        if (!next || blocked) return;
        setSelected(next);
        if (!allowed(next)) {
            setMessage("Choose a time within the available hours.");
            return;
        }
        setMessage("");
        onChange(clockValue(next, seconds));
    };
    const setPeriod = (next: "AM" | "PM") => {
        const date = new Date(current);
        date.setHours((date.getHours() % 12) + (next === "PM" ? 12 : 0));
        commit(date);
    };
    const commitTyped = () => {
        if (
            !/^\d{1,2}$/.test(typedHour) ||
            +typedHour < 1 ||
            +typedHour > 12 ||
            !/^\d{1,2}$/.test(typedMinute) ||
            +typedMinute > 59
        ) {
            setMessage("Enter an hour from 1 to 12 and minutes from 00 to 59.");
            return;
        }
        const date = new Date(current);
        date.setHours((+typedHour % 12) + (period === "PM" ? 12 : 0), +typedMinute);
        commit(date);
    };
    return (
        <div className={styles.panel}>
            <p className={styles.title}>Select time</p>
            <div className={styles.toolbar}>
                {typing ? (
                    <input
                        aria-label="Hour"
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
                        className={styles.timeValue}
                        data-active={view === "hours"}
                        aria-label="Choose hour"
                        aria-pressed={view === "hours"}
                        onClick={() => setView("hours")}
                        disabled={blocked}
                    >
                        {String(current.getHours() % 12 || 12).padStart(2, "0")}
                    </button>
                )}
                <span className={styles.colon} aria-hidden>
                    :
                </span>
                {typing ? (
                    <input
                        aria-label="Minute"
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
            </div>
            {seconds && !typing && (
                <button
                    type="button"
                    className={styles.seconds}
                    onClick={() => setView("seconds")}
                    aria-pressed={view === "seconds"}
                >
                    Seconds: {String(current.getSeconds()).padStart(2, "0")}
                </button>
            )}
            {!typing && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimeClock
                        value={selected}
                        referenceDate={current}
                        ampm
                        ampmInClock={false}
                        view={view}
                        views={[...views]}
                        onViewChange={setView}
                        onChange={commit}
                        disabled={disabled}
                        readOnly={readOnly}
                        minutesStep={minuteStep}
                        minTime={
                            min && (!max || min <= max) ? (clockDate(min) ?? undefined) : undefined
                        }
                        maxTime={
                            max && (!min || min <= max) ? (clockDate(max) ?? undefined) : undefined
                        }
                        shouldDisableTime={(date, unit) =>
                            unit === "hours" ? date.getHours() % hourStep !== 0 : !allowed(date)
                        }
                        sx={{
                            width: "100%",
                            height: 280,
                            maxHeight: 280,
                            margin: 0,
                            "& .MuiClock-root": { transform: "scale(1.1)" },
                            "& .MuiClock-wrapper:focus-visible": {
                                outline: "2px solid var(--color-brand)",
                                outlineOffset: 4,
                                borderRadius: "50%",
                            },
                            "@media (prefers-reduced-motion: reduce)": {
                                "& .MuiClockPointer-root": { transition: "none" },
                            },
                            "& .MuiClock-clock": { backgroundColor: "var(--color-surface-muted)" },
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
            )}
            {message && (
                <p role="alert" className={styles.error}>
                    {message}
                </p>
            )}
            <div className={styles.footer}>
                <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={typing ? "Switch to clock" : "Enter time with keyboard"}
                    onClick={() => {
                        setTypedHour(String(current.getHours() % 12 || 12).padStart(2, "0"));
                        setTypedMinute(String(current.getMinutes()).padStart(2, "0"));
                        setTyping(!typing);
                        setMessage("");
                    }}
                    disabled={blocked}
                >
                    {typing ? <Clock aria-hidden /> : <Keyboard aria-hidden />}
                </Button>
                <div>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            if (!blocked) {
                                onChange("");
                                setSelected(null);
                                setMessage("");
                            }
                        }}
                        disabled={blocked}
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-brand-text hover:bg-brand-soft hover:text-brand-text"
                        onClick={() => {
                            const now = clockDate(
                                formatInTimeZone(new Date(), timeZone, "HH:mm:ss"),
                            );
                            if (now) {
                                now.setMinutes(
                                    Math.floor(now.getMinutes() / minuteStep) * minuteStep,
                                    seconds
                                        ? Math.floor(now.getSeconds() / secondStep) * secondStep
                                        : 0,
                                );
                                commit(now);
                            }
                        }}
                        disabled={blocked}
                    >
                        Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
