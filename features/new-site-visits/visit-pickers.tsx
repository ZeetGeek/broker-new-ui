"use client";

import { useState } from "react";

import { formatVisitDate, istDateKey } from "@/lib/visits/time";

import { Building2, CalendarDays, ChevronDown, UserRound } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";

import styles from "./visits.module.css";

export function VisitEntityCombobox({
    kind,
    id,
    value,
    onChange,
    disabled,
    error,
}: {
    kind: "client" | "property";
    id: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
}) {
    const options =
        kind === "client"
            ? PREVIEW_CLIENTS.map((client) => ({
                  value: client.id,
                  label: client.name,
                  detail: `${client.type} · ${client.requirement}`,
                  search: client.phoneDigits,
              }))
            : PREVIEW_PROPERTIES.map((property) => ({
                  value: property.id,
                  label: property.title,
                  detail: `${property.configLabel} · ${property.locality}, ${property.city}`,
                  search: property.address,
              }));
    const labelFor = (item: string) => options.find((option) => option.value === item)?.label ?? "";
    return (
        <Combobox
            items={options.map((option) => option.value)}
            value={value || null}
            disabled={disabled}
            onValueChange={(next: string | null) => onChange(next ?? "")}
            itemToStringLabel={labelFor}
            filter={(item, query) => {
                const option = options.find((candidate) => candidate.value === item);
                return `${option?.label} ${option?.detail} ${option?.search}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase());
            }}
        >
            <ComboboxInput
                id={id}
                size="lg"
                startIcon={kind === "client" ? UserRound : Building2}
                placeholder={`Select a ${kind}`}
                errorText={error}
                disabled={disabled}
            />
            <ComboboxContent>
                <ComboboxEmpty>
                    No {kind === "client" ? "clients" : "properties"} found. Try another search.
                </ComboboxEmpty>
                <ComboboxList>
                    {(item: string) => {
                        const option = options.find((candidate) => candidate.value === item);
                        return (
                            <ComboboxItem key={item} value={item}>
                                <span className={styles.entityOption}>
                                    {kind === "client" ? (
                                        <UserAvatar name={option?.label ?? "Client"} size="sm" />
                                    ) : (
                                        <span className={styles.entityIcon}>
                                            <Building2 aria-hidden />
                                        </span>
                                    )}
                                    <span>
                                        <span className={styles.entityName}>{option?.label}</span>
                                        <span className={styles.entityDetail}>
                                            {option?.detail}
                                        </span>
                                    </span>
                                </span>
                            </ComboboxItem>
                        );
                    }}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

export function VisitDatePicker({
    id,
    value,
    onChange,
    error,
    recorded = false,
    disabled = false,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    recorded?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(`${value}T12:00:00+05:30`) : undefined;
    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    render={
                        <Button
                            id={id}
                            type="button"
                            disabled={disabled}
                            variant="outline"
                            size="lg"
                            className={styles.dateTrigger}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${id}-error` : undefined}
                        />
                    }
                >
                    <CalendarDays className="block-4.5 inline-4.5" aria-hidden />
                    <span>{selected ? formatVisitDate(selected) : "Select a date"}</span>
                    <ChevronDown className="block-4.5 inline-4.5" aria-hidden />
                </PopoverTrigger>
                <PopoverContent
                    aria-label="Choose visit date"
                    align="start"
                    className="p-0 inline-[min(21rem,calc(100vw-1.5rem))]"
                >
                    <Calendar
                        className="inline-full [&_button]:aspect-auto [&_button]:min-inline-0! [&_table]:table-fixed [&_td]:min-inline-0"
                        mode="single"
                        weekStartsOn={1}
                        timeZone="Asia/Kolkata"
                        selected={selected}
                        defaultMonth={selected}
                        onSelect={(date) => {
                            if (date) {
                                onChange(istDateKey(date));
                                setOpen(false);
                            }
                        }}
                        disabled={
                            recorded
                                ? { after: new Date(`${istDateKey(new Date())}T23:59:59+05:30`) }
                                : { before: new Date(`${istDateKey(new Date())}T00:00:00+05:30`) }
                        }
                    />
                </PopoverContent>
            </Popover>
            {error && (
                <p id={`${id}-error`} role="alert" className={styles.fieldError}>
                    {error}
                </p>
            )}
        </div>
    );
}
