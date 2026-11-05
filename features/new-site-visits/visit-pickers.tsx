"use client";

import { useState } from "react";

import { istDateKey } from "@/lib/visits/time";

import { Building2, Check, Search } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { FlowStep } from "./flow-step";
import { REMINDERS, type VisitDraft } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";

import styles from "./visits.module.css";

export function VisitPicker({
    kind,
    selected,
    onSelect,
    onClose,
}: {
    kind: "client" | "property";
    selected: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const needle = query.toLowerCase().trim();
    const clients = PREVIEW_CLIENTS.filter((c) =>
        `${c.name} ${c.phoneDigits}`.toLowerCase().includes(needle),
    );
    const properties = PREVIEW_PROPERTIES.filter((p) =>
        `${p.title} ${p.locality} ${p.city}`.toLowerCase().includes(needle),
    );
    return (
        <FlowStep
            title={`Choose a ${kind}`}
            description={
                kind === "client"
                    ? "Select an existing client. Their record stays linked to this visit."
                    : "Use a property already in your CRM. No property details to re-enter."
            }
            onBack={onClose}
        >
            <Input
                startIcon={Search}
                aria-label={`Search ${kind === "client" ? "clients" : "properties"}`}
                placeholder={`Search ${kind === "client" ? "clients by name or phone" : "properties by name or location"}`}
                value={query}
                onValueChange={setQuery}
                clearable
            />
            <div className={styles.pickerList}>
                {kind === "client"
                    ? clients.map((c) => (
                          <button
                              type="button"
                              key={c.id}
                              className={styles.option}
                              aria-pressed={c.id === selected}
                              onClick={() => onSelect(c.id)}
                          >
                              <UserAvatar name={c.name} size="sm" />
                              <span>
                                  <strong>{c.name}</strong>
                                  <small>
                                      {c.type} · {c.requirement}
                                  </small>
                              </span>
                              {c.id === selected && <Check aria-hidden />}
                          </button>
                      ))
                    : properties.map((p) => (
                          <button
                              type="button"
                              key={p.id}
                              className={styles.option}
                              aria-pressed={p.id === selected}
                              onClick={() => onSelect(p.id)}
                          >
                              <span className={styles.propertyIcon}>
                                  <Building2 aria-hidden />
                              </span>
                              <span>
                                  <strong>{p.title}</strong>
                                  <small>
                                      {p.configLabel} · {p.locality}, {p.city}
                                  </small>
                              </span>
                              {p.id === selected && <Check aria-hidden />}
                          </button>
                      ))}
                {(kind === "client" ? clients.length : properties.length) === 0 && (
                    <p className={styles.emptySearch}>
                        No {kind === "client" ? "clients" : "properties"} found. Try another name.
                    </p>
                )}
            </div>
            <p className={styles.muted}>
                {kind === "client"
                    ? "One client per visit."
                    : "The visit links the original property record."}
            </p>
        </FlowStep>
    );
}

export function DateTimePicker({
    draft,
    onApply,
    onClose,
}: {
    draft: VisitDraft;
    onApply: (patch: Partial<VisitDraft>) => void;
    onClose: () => void;
}) {
    const [date, setDate] = useState(draft.date);
    const [startTime, setStartTime] = useState(draft.startTime);
    const [endTime, setEndTime] = useState(draft.endTime);
    const selected = date ? new Date(`${date}T12:00:00+05:30`) : undefined;
    return (
        <FlowStep
            title="Set visit time"
            description="Choose the start and end time. All visits use India Standard Time."
            onBack={onClose}
        >
            <div className={styles.datePickerGrid}>
                <Calendar
                    mode="single"
                    weekStartsOn={1}
                    timeZone="Asia/Kolkata"
                    selected={selected}
                    defaultMonth={selected}
                    onSelect={(value) => setDate(value ? istDateKey(value) : "")}
                    disabled={{ before: new Date(`${istDateKey(new Date())}T00:00:00+05:30`) }}
                />
                <div className={styles.timeFields}>
                    <label className={styles.field}>
                        Start time
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                    </label>
                    <label className={styles.field}>
                        End time
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </label>
                    <p className={styles.muted}>One client and one property per visit.</p>
                </div>
            </div>
            <div className={styles.actions}>
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    disabled={!date || !startTime || !endTime || endTime <= startTime}
                    onClick={() => onApply({ date, startTime, endTime })}
                >
                    Use this time
                </Button>
            </div>
        </FlowStep>
    );
}

export function ReminderPicker({
    value,
    onSave,
    onClose,
    busy = false,
    error = "",
}: {
    value: number;
    onSave: (minutes: number) => void;
    onClose: () => void;
    busy?: boolean;
    error?: string;
}) {
    const [selected, setSelected] = useState(value);
    return (
        <FlowStep
            title="Set an extra reminder"
            description="Choose an earlier reminder in addition to the start and end notifications."
            onBack={onClose}
            aside={
                <>
                    <div className={styles.asideSection}>
                        <h3>Always included</h3>
                        <p>
                            At start time
                            <br />
                            Your visit moves to Running and you receive a notification.
                        </p>
                        <p>
                            At end time
                            <br />
                            You are asked to record attendance or reschedule.
                        </p>
                    </div>
                    <div className={styles.summary}>
                        <h3>A reminder for you</h3>
                        <p>These notifications do not message your client.</p>
                    </div>
                </>
            }
        >
            <RadioGroup
                disabled={busy}
                aria-label="Extra reminder"
                value={String(selected)}
                onValueChange={(value) => setSelected(Number(value))}
            >
                {REMINDERS.map((r) => (
                    <label key={r.value} className={styles.reminderOption}>
                        <RadioGroupItem value={String(r.value)} />
                        <span>{r.label}</span>
                        {selected === r.value && <Check aria-hidden />}
                    </label>
                ))}
            </RadioGroup>
            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
            <div className={styles.actions}>
                <Button variant="outline" disabled={busy} onClick={onClose}>
                    Cancel
                </Button>
                <Button disabled={busy} onClick={() => onSave(selected)}>
                    {busy ? "Saving…" : "Save reminder"}
                </Button>
            </div>
        </FlowStep>
    );
}
