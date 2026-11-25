"use client";

import { useId, useMemo, useRef, useState } from "react";

import { formatPersonName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { Check, ChevronDown, Search, UserPlus, UserRound, Users } from "@/components/shared/icons";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import {
    mobileSelectMessageClass,
    mobileSelectPlaceholderClass,
    mobileSelectSearchClass,
    mobileSelectTriggerClass,
} from "@/components/shared/mobile-select-drawer";
import { PeopleOptionRow } from "@/components/shared/people-option-row";
import { peoplePersonMatchesQuery } from "@/components/shared/people-person-meta";
import { type PeoplePickerPerson, type PeoplePickerRole } from "@/components/shared/people-picker";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    type ComboboxInputProps,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

export type PeopleInlineScope = "all" | PeoplePickerRole;

const CLEAR_VALUE = "__people_inline_clear__";

/** Hide the default check; light hover + soft selected fill. */
const INLINE_ITEM_CLASS = `
  gap-3 px-3 py-2.5 pe-3
  data-highlighted:bg-canvas
  data-selected:bg-brand-soft/45
  data-selected:text-ink
  data-highlighted:data-selected:bg-brand-soft/55
  [&>span.absolute]:hidden
`;

export type PeopleInlineSelectProps = {
    id?: string;
    label?: string;
    people: readonly PeoplePickerPerson[];
    value: string | null;
    onValueChange: (id: string | null) => void;
    /** Starting role filter inside the popup. Defaults to All. */
    defaultScope?: PeopleInlineScope;
    /**
     * Lock the list to one role and hide All / Clients / Owners.
     * Use on filter sheets that are already Client-only or Owner-only.
     */
    lockedScope?: PeoplePickerRole;
    placeholder?: string;
    allowClear?: boolean;
    clearLabel?: string;
    /** Called with the current search text when Create is pressed. */
    onCreate?: (query: string) => void;
    createLabel?: string;
    disabled?: boolean;
    loading?: boolean;
    errorText?: string;
    helperText?: string;
    size?: ComboboxInputProps["size"];
    className?: string;
};

/**
 * Compact combobox for mentions, filters, and form fields.
 * Role scope: All / Clients / Owners. Empty search offers Create when wired.
 * Rows match the People picker modal — role pip + right-side type badge.
 */
export function PeopleInlineSelect({
    id,
    label,
    people,
    value,
    onValueChange,
    defaultScope = "all",
    lockedScope,
    placeholder = "Select a client or owner",
    allowClear = false,
    clearLabel = "Anyone",
    onCreate,
    createLabel = "Create it",
    disabled = false,
    loading = false,
    errorText,
    helperText,
    size = "default",
    className,
}: PeopleInlineSelectProps) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const mobile = useMobileMenu();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const afterClose = useRef<null | (() => void)>(null);
    const [scope, setScope] = useState<PeopleInlineScope>(lockedScope ?? defaultScope);
    const [query, setQuery] = useState("");
    const activeScope = lockedScope ?? scope;
    const showRolePip = !lockedScope && activeScope === "all";

    const byId = useMemo(() => {
        const map = new Map<string, PeoplePickerPerson>();
        for (const person of people) map.set(person.id, person);
        return map;
    }, [people]);

    const scopedPeople = useMemo(() => {
        if (activeScope === "all") return people;
        return people.filter((person) => person.role === activeScope);
    }, [people, activeScope]);

    const filteredPeople = useMemo(() => {
        const term = query.trim().toLowerCase();
        return scopedPeople.filter((person) => peoplePersonMatchesQuery(person, term));
    }, [scopedPeople, query]);

    const items = useMemo(() => {
        const ids = filteredPeople.map((person) => person.id);
        if (allowClear) return [CLEAR_VALUE, ...ids];
        return ids;
    }, [filteredPeople, allowClear]);

    const selectedPerson = value ? (byId.get(value) ?? null) : null;
    const showCreate = Boolean(onCreate) && query.trim().length > 0 && filteredPeople.length === 0;
    const StartIcon = lockedScope ? UserRound : Users;

    function labelFor(item: string): string {
        if (item === CLEAR_VALUE) return clearLabel;
        return formatPersonName(byId.get(item)?.name ?? item);
    }

    function choose(next: string | null) {
        onValueChange(next);
        setQuery("");
        setDrawerOpen(false);
    }

    const fieldMessage = errorText ?? helperText;

    if (mobile) {
        return (
            <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
                {label ? (
                    <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
                        {label}
                    </label>
                ) : null}
                <MobileActionDrawer
                    open={drawerOpen}
                    onOpenChange={(open) => {
                        setDrawerOpen(open);
                        if (open) {
                            setQuery("");
                            if (lockedScope) setScope(lockedScope);
                        }
                    }}
                    onOpenChangeComplete={(open) => {
                        if (open) return;
                        const action = afterClose.current;
                        afterClose.current = null;
                        action?.();
                    }}
                    title={label ?? (lockedScope === "client" ? "Select client" : "Select person")}
                    trigger={
                        <button
                            id={fieldId}
                            type="button"
                            disabled={disabled || loading}
                            aria-label={`${label ?? "Person"}: ${selectedPerson ? formatPersonName(selectedPerson.name) : placeholder}`}
                            data-invalid={Boolean(errorText) || undefined}
                            className={cn(
                                mobileSelectTriggerClass,
                                !selectedPerson && mobileSelectPlaceholderClass,
                            )}
                        >
                            <StartIcon aria-hidden />
                            <span>
                                {loading
                                    ? "Loading..."
                                    : selectedPerson
                                      ? formatPersonName(selectedPerson.name)
                                      : placeholder}
                            </span>
                            <ChevronDown aria-hidden />
                        </button>
                    }
                >
                    {!lockedScope ? (
                        <div className="border-be border-border-warm pbe-3">
                            <SlidingTabs
                                label="Filter people by role"
                                value={activeScope}
                                onValueChange={(next) => {
                                    setScope(next);
                                    setQuery("");
                                }}
                                className="self-start"
                                height={36}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "client", label: "Clients" },
                                    { value: "owner", label: "Owners" },
                                ]}
                            />
                        </div>
                    ) : null}
                    <div className={mobileSelectSearchClass}>
                        <Input
                            value={query}
                            onValueChange={setQuery}
                            startIcon={Search}
                            placeholder="Search people"
                            aria-label="Search people"
                            clearable
                        />
                    </div>
                    {allowClear ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            aria-pressed={!value}
                            onClick={() => choose(null)}
                        >
                            <span className="text-ink-muted">{clearLabel}</span>
                            {!value ? <Check aria-hidden className="ms-auto" /> : null}
                        </button>
                    ) : null}
                    {filteredPeople.map((person) => (
                        <button
                            key={person.id}
                            type="button"
                            className={mobileActionClass}
                            aria-pressed={value === person.id}
                            onClick={() => choose(person.id)}
                        >
                            <PeopleOptionRow person={person} showRolePip={showRolePip} />
                            {value === person.id ? <Check aria-hidden className="ms-auto" /> : null}
                        </button>
                    ))}
                    {!filteredPeople.length && !showCreate ? (
                        <p role="status" className={mobileSelectMessageClass}>
                            {query.trim()
                                ? "No matching people"
                                : activeScope === "client"
                                  ? "No clients yet"
                                  : activeScope === "owner"
                                    ? "No owners yet"
                                    : "No people yet"}
                        </p>
                    ) : null}
                    {showCreate ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            onClick={() => {
                                const nextQuery = query.trim();
                                afterClose.current = () => onCreate?.(nextQuery);
                                setDrawerOpen(false);
                            }}
                        >
                            <UserPlus aria-hidden />
                            <span className="flex flex-col text-start min-inline-0">
                                <span>{createLabel}</span>
                                <span className="truncate text-xs font-normal text-ink-muted">
                                    “{query.trim()}”
                                </span>
                            </span>
                        </button>
                    ) : null}
                </MobileActionDrawer>
                {fieldMessage ? (
                    <p
                        role={errorText ? "alert" : undefined}
                        className={errorText ? "body-sm text-danger" : "body-sm text-ink-subtle"}
                    >
                        {fieldMessage}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
            {label ? (
                <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
                    {label}
                </label>
            ) : null}
            <Combobox
                value={value || (allowClear ? CLEAR_VALUE : null)}
                disabled={disabled}
                items={items}
                itemToStringLabel={labelFor}
                inputValue={
                    // Keep the typed query while open; show the chosen name when settled.
                    query.length > 0
                        ? query
                        : selectedPerson
                          ? formatPersonName(selectedPerson.name)
                          : ""
                }
                onInputValueChange={setQuery}
                filter={null}
                onValueChange={(next) => {
                    if (!next || next === CLEAR_VALUE) {
                        onValueChange(null);
                        setQuery("");
                        return;
                    }
                    onValueChange(next);
                    setQuery("");
                }}
                onOpenChange={(open) => {
                    if (!open) setQuery("");
                    else if (lockedScope) setScope(lockedScope);
                }}
            >
                <ComboboxInput
                    id={fieldId}
                    size={size}
                    // Form size: same 14px text as the property and contact forms.
                    className={size === "md" ? "text-sm" : undefined}
                    startIcon={StartIcon}
                    placeholder={placeholder}
                    loading={loading}
                    disabled={disabled}
                    errorText={errorText}
                    helperText={helperText}
                    showClear={Boolean(value) && allowClear}
                />
                <ComboboxContent
                    align="start"
                    className="flex flex-col gap-0 overflow-hidden p-0 inline-[min(24rem,calc(100dvw-2rem))]"
                >
                    {!lockedScope ? (
                        <div className="shrink-0 border-be border-border-warm px-3 py-2.5">
                            <SlidingTabs
                                label="Filter people by role"
                                value={activeScope}
                                onValueChange={setScope}
                                className="self-start"
                                height={32}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "client", label: "Clients" },
                                    { value: "owner", label: "Owners" },
                                ]}
                            />
                        </div>
                    ) : null}
                    <ComboboxEmpty className="py-4">
                        {query.trim()
                            ? "No matching people"
                            : activeScope === "client"
                              ? "No clients yet"
                              : activeScope === "owner"
                                ? "No owners yet"
                                : "No people yet"}
                    </ComboboxEmpty>
                    <ComboboxList className="gap-1 p-2 max-block-[min(20rem,var(--available-height))]">
                        {(item: string) => {
                            if (item === CLEAR_VALUE) {
                                return (
                                    <ComboboxItem
                                        key={CLEAR_VALUE}
                                        value={CLEAR_VALUE}
                                        className={INLINE_ITEM_CLASS}
                                    >
                                        <span className="body-sm text-ink-muted">{clearLabel}</span>
                                    </ComboboxItem>
                                );
                            }
                            const person = byId.get(item);
                            if (!person) return null;
                            return (
                                <ComboboxItem key={item} value={item} className={INLINE_ITEM_CLASS}>
                                    <PeopleOptionRow person={person} showRolePip={showRolePip} />
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                    {showCreate ? (
                        <div className="shrink-0 border-bs border-border-warm p-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 inline-full"
                                onMouseDown={(event) => {
                                    // Keep the popup open long enough to fire create.
                                    event.preventDefault();
                                }}
                                onClick={() => onCreate?.(query.trim())}
                            >
                                <UserPlus aria-hidden strokeWidth={1.75} />
                                {createLabel}
                                <span className="truncate font-normal text-ink-muted max-inline-36">
                                    “{query.trim()}”
                                </span>
                            </Button>
                        </div>
                    ) : null}
                </ComboboxContent>
            </Combobox>
        </div>
    );
}
