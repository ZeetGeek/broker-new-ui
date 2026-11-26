"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";

import { formatPersonName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

import { EmptyStateAction } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Check, ChevronDown, Search, UserPlus, UserRound, Users } from "@/components/shared/icons";
import { ListAddButton } from "@/components/shared/list-toolbar";
import {
    LOOKING_FOR_BADGE,
    OWNER_TYPE_LABEL,
    peoplePersonMatchesQuery,
    peopleRoleLabel,
} from "@/components/shared/people-person-meta";
import { PEOPLE_ROLE_DOT_CLASS } from "@/components/shared/people-role-dot";
import { PhoneNumber } from "@/components/shared/phone-number";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type PeoplePickerRole = "client" | "owner";

/** Same intent labels as client cards — Buying / Renting / Buying or renting. */
export type PeoplePickerLookingFor = "buy" | "rent" | "both";

export type PeoplePickerPerson = {
    id: string;
    name: string;
    role: PeoplePickerRole;
    imageUrl?: string;
    /** Optional client companion text. Owner rows show phone and owner type instead. */
    detail?: string;
    /**
     * Owner category. Form owners use individual/builder/company;
     * task link-options also use platform / exclusive.
     */
    ownerType?: "individual" | "builder" | "company" | "platform" | "exclusive" | null;
    /** Digits only (or +91…) — rendered with `<PhoneNumber>`. */
    phoneDigits?: string;
    /**
     * Client intent — renders the same Buying / Renting badge as contact cards.
     * Prefer this over free-text in `detail` for clients.
     */
    lookingFor?: PeoplePickerLookingFor | null;
    /** Amber chip for soft warnings (budget / intent mismatch). */
    warning?: string | null;
    /** Existing links in an additive picker remain selected and cannot be removed. */
    selectionLocked?: boolean;
    /** Extra chips after type / looking-for (e.g. “Current”). */
    statusChips?: readonly { label: string; color: "emerald" | "amber" | "sky" | "stone" }[];
};

type RoleFilter = "all" | PeoplePickerRole;

type PeoplePickerBase = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Which roles this picker can show.
     * `"both"` also unlocks All / Client / Owner tabs inside the modal.
     */
    kinds: PeoplePickerRole | "both";
    people: readonly PeoplePickerPerson[];
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    emptyHeading?: string;
    emptyDescription?: string;
    /** Shown when the search query matches nobody. */
    filteredEmptyHeading?: string;
    filteredEmptyDescription?: string;
    loading?: boolean;
    errorText?: string;
    onRetry?: () => void;
    /** Opens create-contact flow owned by the caller. */
    onCreate?: () => void;
    createLabel?: string;
    /** Extra header content under search (filters, hints). */
    headerExtra?: ReactNode;
    /** Below the list — e.g. “Load more” for infinite queries. */
    listFooter?: ReactNode;
    /**
     * Controlled search. When set with `onSearchChange`, the parent owns the
     * query (server-side search). Pair with `skipLocalFilter` when the API
     * already filtered `people`.
     */
    searchValue?: string;
    onSearchChange?: (query: string) => void;
    /** Skip name/phone client filter — use when `people` is already filtered. */
    skipLocalFilter?: boolean;
    /** Allow clearing to “no person” (filters / optional fields). */
    allowClear?: boolean;
    clearLabel?: string;
    /** Footer primary label override. */
    confirmLabel?: string;
    /** Extra disable for Confirm (e.g. same exclusive owner already attached). */
    confirmDisabled?: boolean;
    /**
     * When false, Confirm runs `onConfirm` but leaves the modal open
     * (caller closes after an async attach succeeds).
     */
    closeOnConfirm?: boolean;
    size?: "md" | "lg";
    className?: string;
};

type PeoplePickerSingle = PeoplePickerBase & {
    multiple?: false;
    value: string | null;
    onConfirm: (id: string | null) => void;
    /**
     * When true (default), choosing a row confirms and closes immediately.
     * Set false to require the footer Confirm button.
     */
    commitOnSelect?: boolean;
};

type PeoplePickerMultiple = PeoplePickerBase & {
    multiple: true;
    value: readonly string[];
    onConfirm: (ids: string[]) => void;
    commitOnSelect?: never;
};

export type PeoplePickerProps = PeoplePickerSingle | PeoplePickerMultiple;

function roleNoun(kinds: PeoplePickerProps["kinds"], plural = false): string {
    if (kinds === "both") return plural ? "people" : "person";
    if (kinds === "owner") return plural ? "owners" : "owner";
    return plural ? "clients" : "client";
}

function defaultTitle(kinds: PeoplePickerProps["kinds"], multiple: boolean): string {
    const noun = roleNoun(kinds, multiple);
    return multiple ? `Select ${noun}` : `Select a ${noun}`;
}

function defaultSearchPlaceholder(kinds: PeoplePickerProps["kinds"]): string {
    if (kinds === "both") return "Search by name or phone";
    if (kinds === "owner") return "Search owners by name or phone";
    return "Search clients by name or phone";
}

function defaultCreateLabel(kinds: PeoplePickerProps["kinds"]): string {
    if (kinds === "owner") return "Create owner";
    if (kinds === "both") return "Create contact";
    return "Create client";
}

/** Quiet role cue when kinds=both — color only, no Client/Owner chip. */
function rolePipClass(role: PeoplePickerRole): string {
    return role === "owner" ? PEOPLE_ROLE_DOT_CLASS.owner : PEOPLE_ROLE_DOT_CLASS.client;
}

function PeoplePickerRow({
    person,
    selected,
    multiple,
    showRole,
}: {
    person: PeoplePickerPerson;
    selected: boolean;
    multiple: boolean;
    showRole: boolean;
}) {
    const displayName = formatPersonName(person.name);

    const intent = person.lookingFor ? LOOKING_FOR_BADGE[person.lookingFor] : null;
    const ownerType =
        person.role === "owner" && person.ownerType ? OWNER_TYPE_LABEL[person.ownerType] : null;
    const phone = person.phoneDigits?.replace(/\D/g, "") || undefined;

    return (
        <span
            className={cn(
                `
                  flex cursor-pointer items-center gap-3 rounded-card border p-3 text-start
                  transition-[background-color,border-color] duration-160 outline-none
                  inline-full
                `,
                selected
                    ? "border-brand bg-brand-soft/50"
                    : `
                      border-border-warm bg-surface
                      hover:border-ink/20 hover:bg-surface-muted/60
                    `,
                person.selectionLocked && "cursor-default",
            )}
        >
            {multiple ? (
                <Checkbox
                    checked={selected}
                    tabIndex={-1}
                    className="pointer-events-none shrink-0"
                    aria-hidden
                />
            ) : (
                <span
                    className={cn(
                        "grid shrink-0 place-items-center rounded-full border block-5 inline-5",
                        selected
                            ? "border-brand bg-brand text-surface"
                            : "border-border-warm bg-surface",
                    )}
                    aria-hidden
                >
                    {selected ? <Check className="block-3 inline-3" strokeWidth={2.5} /> : null}
                </span>
            )}
            {showRole ? (
                <span
                    className={cn(
                        "shrink-0 rounded-full block-2 inline-2",
                        rolePipClass(person.role),
                    )}
                    title={peopleRoleLabel(person.role)}
                    aria-hidden
                />
            ) : null}
            {showRole ? <span className="sr-only">{peopleRoleLabel(person.role)}</span> : null}
            <UserAvatar name={displayName} imageUrl={person.imageUrl} size="sm" />
            <span className="flex flex-1 flex-col gap-1 min-inline-0">
                <span data-control-value className="truncate text-control font-semibold text-ink">
                    {displayName}
                </span>
                {phone ? (
                    <span className="body-xs truncate text-ink-muted">
                        <PhoneNumber phoneDigits={phone} />
                    </span>
                ) : null}
            </span>
            {person.warning ? (
                <Badge color="amber" className="shrink-0">
                    {person.warning}
                </Badge>
            ) : null}
            {intent ? (
                <Badge color={intent.color} className="shrink-0">
                    {intent.label}
                </Badge>
            ) : null}
            {ownerType ? (
                <Badge color="emerald" className="shrink-0">
                    {ownerType}
                </Badge>
            ) : null}
            {person.statusChips?.map((chip) => (
                <Badge key={chip.label} color={chip.color} className="shrink-0">
                    {chip.label}
                </Badge>
            ))}
        </span>
    );
}

/**
 * Shared modal for picking a client, an owner, or either.
 * Pass data in — this component does not fetch. Wire create / retry from the caller.
 */
export function PeoplePicker(props: PeoplePickerProps) {
    const {
        open,
        onOpenChange,
        kinds,
        people,
        title,
        description,
        searchPlaceholder,
        emptyHeading,
        emptyDescription,
        filteredEmptyHeading,
        filteredEmptyDescription,
        loading = false,
        errorText,
        onRetry,
        onCreate,
        createLabel,
        headerExtra,
        listFooter,
        searchValue,
        onSearchChange,
        skipLocalFilter = false,
        allowClear = false,
        clearLabel,
        confirmLabel,
        confirmDisabled = false,
        closeOnConfirm = true,
        size = "md",
        className,
        multiple = false,
    } = props;

    const searchId = useId();
    const [localQuery, setLocalQuery] = useState("");
    const query = onSearchChange ? (searchValue ?? "") : localQuery;
    const setQuery = onSearchChange ?? setLocalQuery;
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [draftSingle, setDraftSingle] = useState<string | null>(null);
    const [draftMulti, setDraftMulti] = useState<string[]>([]);
    const lockedIds = useMemo(
        () => new Set(people.filter((person) => person.selectionLocked).map((person) => person.id)),
        [people],
    );
    /** List scrolls inside VirtualListBox — drive the sticky header divider from that. */
    const [listScrolled, setListScrolled] = useState(false);

    const commitOnSelect = !multiple && (props.commitOnSelect ?? true);

    useEffect(() => {
        if (!open) return undefined;
        const frame = window.requestAnimationFrame(() => {
            setQuery("");
            setRoleFilter("all");
            setListScrolled(false);
            if (props.multiple) setDraftMulti([...props.value]);
            else setDraftSingle(props.value);
        });
        return () => window.cancelAnimationFrame(frame);
        // Seed draft only when the modal opens — keep in-progress picks while open.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-only sync
    }, [open]);

    function onListScroll(event: { currentTarget: HTMLDivElement }) {
        setListScrolled(event.currentTarget.scrollTop > 2);
    }

    const scopedPeople = useMemo(() => {
        if (kinds === "both") return people;
        return people.filter((person) => person.role === kinds);
    }, [kinds, people]);

    const clientCount = useMemo(
        () => scopedPeople.filter((person) => person.role === "client").length,
        [scopedPeople],
    );
    const ownerCount = useMemo(
        () => scopedPeople.filter((person) => person.role === "owner").length,
        [scopedPeople],
    );

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        return scopedPeople.filter((person) => {
            if (kinds === "both" && roleFilter !== "all" && person.role !== roleFilter) {
                return false;
            }
            if (skipLocalFilter) return true;
            return peoplePersonMatchesQuery(person, term);
        });
    }, [scopedPeople, kinds, roleFilter, query, skipLocalFilter]);

    const selectedCount = multiple ? draftMulti.length : draftSingle ? 1 : 0;
    const nounPlural = roleNoun(kinds, true);
    const nounSingular = roleNoun(kinds, false);
    const resolvedTitle = title ?? defaultTitle(kinds, multiple);
    const resolvedSearchPlaceholder = searchPlaceholder ?? defaultSearchPlaceholder(kinds);
    const resolvedCreateLabel = createLabel ?? defaultCreateLabel(kinds);
    const resolvedClearLabel =
        clearLabel ?? (kinds === "both" ? "Clear selection" : `Any ${nounSingular}`);

    const countLabel = (() => {
        if (kinds === "both" && roleFilter === "all") {
            return `People · ${scopedPeople.length}`;
        }
        if (kinds === "both" && roleFilter === "client") {
            return `Clients · ${clientCount}`;
        }
        if (kinds === "both" && roleFilter === "owner") {
            return `Owners · ${ownerCount}`;
        }
        if (kinds === "owner") return `Owners · ${scopedPeople.length}`;
        return `Clients · ${scopedPeople.length}`;
    })();

    function isSelected(id: string): boolean {
        return multiple ? lockedIds.has(id) || draftMulti.includes(id) : draftSingle === id;
    }

    function selectSingle(id: string | null) {
        setDraftSingle(id);
        if (commitOnSelect && !props.multiple) {
            props.onConfirm(id);
            onOpenChange(false);
        }
    }

    function toggleMulti(id: string) {
        if (lockedIds.has(id)) return;
        setDraftMulti((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    function confirm() {
        if (props.multiple) props.onConfirm([...new Set([...draftMulti, ...lockedIds])]);
        else props.onConfirm(draftSingle);
        if (closeOnConfirm) onOpenChange(false);
    }

    function onRowKeyDown(event: KeyboardEvent<HTMLElement>, id: string) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (multiple) toggleMulti(id);
        else selectSingle(id);
    }

    const showRoleBadge = kinds === "both";
    const listBusy = loading;
    const hasError = Boolean(errorText) && scopedPeople.length === 0;
    const showFooter = multiple || !commitOnSelect || allowClear;

    const primaryLabel =
        confirmLabel ??
        (multiple
            ? selectedCount > 0
                ? `Select ${selectedCount} ${selectedCount === 1 ? nounSingular : nounPlural}`
                : `Select ${nounPlural}`
            : draftSingle
              ? "Confirm"
              : `Select a ${nounSingular}`);

    const primaryDisabled =
        listBusy ||
        hasError ||
        confirmDisabled ||
        (multiple ? false : !allowClear && !draftSingle) ||
        (multiple && draftMulti.length === 0 && !allowClear);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size={size}
            title={resolvedTitle}
            description={description}
            className={className}
            bodyClassName="pbs-0!"
            headerClassName={cn(
                "pbs-2 pbe-2.5",
                listScrolled
                    ? "border-be border-(--dialog-divider)"
                    : "border-be border-transparent",
            )}
            header={
                <div className="flex flex-col gap-2">
                    <Input
                        id={searchId}
                        size="default"
                        value={query}
                        onValueChange={setQuery}
                        placeholder={resolvedSearchPlaceholder}
                        aria-label={resolvedSearchPlaceholder}
                        startIcon={Search}
                        clearable
                        wrapperClassName="min-inline-0 flex-1"
                    />
                    {kinds === "both" ? (
                        <SlidingTabs
                            label="Filter by role"
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                            className="mbs-1.5 self-start"
                            options={[
                                { value: "all", label: "All", count: scopedPeople.length },
                                { value: "client", label: "Clients", count: clientCount },
                                { value: "owner", label: "Owners", count: ownerCount },
                            ]}
                        />
                    ) : null}
                    <div className="mbs-1.5 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-inline-0">
                            <p className="body-sm font-medium text-ink-muted">{countLabel}</p>
                            {kinds === "both" ? (
                                <p className="body-xs flex items-center gap-2.5 text-ink-subtle">
                                    <span className="inline-flex items-center gap-1">
                                        <span
                                            className={`rounded-full ${PEOPLE_ROLE_DOT_CLASS.client} block-2 inline-2`}
                                            aria-hidden
                                        />
                                        Client
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span
                                            className={`rounded-full ${PEOPLE_ROLE_DOT_CLASS.owner} block-2 inline-2`}
                                            aria-hidden
                                        />
                                        Owner
                                    </span>
                                </p>
                            ) : null}
                        </div>
                        {onCreate ? (
                            <ListAddButton
                                label={resolvedCreateLabel}
                                icon={UserPlus}
                                variant="outline"
                                onClick={onCreate}
                                className="shrink-0"
                            />
                        ) : null}
                    </div>
                    {headerExtra}
                </div>
            }
            footer={
                showFooter ? (
                    <AppModalFooter
                        primaryLabel={primaryLabel}
                        primaryIcon={<Check aria-hidden strokeWidth={1.75} />}
                        onPrimary={confirm}
                        primaryDisabled={primaryDisabled}
                        secondaryLabel="Cancel"
                        onSecondary={() => onOpenChange(false)}
                    >
                        {allowClear ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="default"
                                className="me-auto inline-auto"
                                disabled={listBusy}
                                onClick={() => {
                                    if (props.multiple) {
                                        setDraftMulti([]);
                                        props.onConfirm([]);
                                    } else {
                                        setDraftSingle(null);
                                        props.onConfirm(null);
                                    }
                                    onOpenChange(false);
                                }}
                            >
                                {resolvedClearLabel}
                            </Button>
                        ) : null}
                    </AppModalFooter>
                ) : undefined
            }
        >
            {listBusy ? (
                <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading people">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-18"
                            aria-hidden
                        />
                    ))}
                </div>
            ) : hasError ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                    <p className="body-sm text-danger">{errorText}</p>
                    {onRetry ? (
                        <Button type="button" variant="outline" onClick={onRetry}>
                            Try again
                        </Button>
                    ) : null}
                </div>
            ) : scopedPeople.length === 0 ? (
                <EmptyState
                    icon={kinds === "both" ? Users : UserRound}
                    heading={emptyHeading ?? `No ${nounPlural} yet`}
                    description={
                        emptyDescription ??
                        (onCreate
                            ? `Create a ${nounSingular} to get started.`
                            : `Add a ${nounSingular} first, then come back here.`)
                    }
                >
                    {onCreate ? (
                        <EmptyStateAction
                            label={resolvedCreateLabel}
                            icon={UserPlus}
                            onClick={onCreate}
                        />
                    ) : null}
                </EmptyState>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Search}
                    heading={filteredEmptyHeading ?? `No ${nounPlural} match your search`}
                    description={
                        filteredEmptyDescription ?? "Try a different name or phone number."
                    }
                />
            ) : (
                <>
                    {multiple ? (
                        <VirtualListBox
                            items={filtered}
                            getKey={(person) => person.id}
                            estimateItemHeight={76}
                            ariaLabel={`${nounPlural} available to select`}
                            onScroll={onListScroll}
                            renderItem={(person) => {
                                const selected = isSelected(person.id);
                                return (
                                    <button
                                        type="button"
                                        aria-pressed={selected}
                                        aria-disabled={person.selectionLocked || undefined}
                                        onClick={() => toggleMulti(person.id)}
                                        onKeyDown={(event) => onRowKeyDown(event, person.id)}
                                        className="text-start inline-full"
                                    >
                                        <PeoplePickerRow
                                            person={person}
                                            selected={selected}
                                            multiple
                                            showRole={showRoleBadge}
                                        />
                                    </button>
                                );
                            }}
                        />
                    ) : (
                        <RadioGroup
                            value={draftSingle ?? ""}
                            onValueChange={(next) => selectSingle(next || null)}
                        >
                            <VirtualListBox
                                items={filtered}
                                getKey={(person) => person.id}
                                estimateItemHeight={76}
                                ariaLabel={`${nounPlural} available to select`}
                                onScroll={onListScroll}
                                renderItem={(person) => {
                                    const selected = isSelected(person.id);
                                    return (
                                        <label className="block cursor-pointer">
                                            <RadioGroupItem
                                                value={person.id}
                                                className="sr-only"
                                                aria-label={`Select ${formatPersonName(person.name)}`}
                                            />
                                            <PeoplePickerRow
                                                person={person}
                                                selected={selected}
                                                multiple={false}
                                                showRole={showRoleBadge}
                                            />
                                        </label>
                                    );
                                }}
                            />
                        </RadioGroup>
                    )}
                    {listFooter}
                </>
            )}
        </AppModal>
    );
}

type PeoplePickerFieldChrome = {
    id?: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    errorText?: string;
    helperText?: string;
    /** Form field face size. */
    triggerSize?: "default" | "lg";
};

export type PeoplePickerFieldProps =
    | (Omit<PeoplePickerSingle, "open" | "onOpenChange"> & PeoplePickerFieldChrome)
    | (Omit<PeoplePickerMultiple, "open" | "onOpenChange"> & PeoplePickerFieldChrome);

/**
 * Form / filter trigger that opens {@link PeoplePicker}.
 * Same `kinds` / `multiple` contract as the modal.
 */
export function PeoplePickerField(props: PeoplePickerFieldProps) {
    const {
        id,
        label,
        required,
        placeholder,
        disabled = false,
        errorText,
        helperText,
        triggerSize = "lg",
        kinds,
        people,
    } = props;

    const [open, setOpen] = useState(false);
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    const selectedPeople = useMemo(() => {
        if (props.multiple) {
            const ids = new Set(props.value);
            return people.filter((person) => ids.has(person.id));
        }
        if (!props.value) return [];
        const match = people.find((person) => person.id === props.value);
        return match ? [match] : [];
    }, [people, props]);

    const facePlaceholder =
        placeholder ??
        (kinds === "both"
            ? "Select a client or owner"
            : kinds === "owner"
              ? "Select an owner"
              : "Select a client");

    const StartIcon = kinds === "both" ? Users : UserRound;

    return (
        <div className="flex flex-col gap-2 min-inline-0">
            {label ? (
                <label htmlFor={fieldId} className="body-sm font-medium text-ink">
                    {label}
                    {required ? (
                        <span className="text-danger" aria-hidden>
                            {" "}
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}
            <button
                id={fieldId}
                type="button"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                data-invalid={errorText ? "" : undefined}
                aria-describedby={
                    errorText ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
                }
                onClick={() => setOpen(true)}
                className={cn(
                    `
                      flex items-center gap-2.5 rounded-control border-2 border-border-warm
                      bg-surface text-start transition-[border-color,box-shadow] duration-160
                      outline-none inline-full
                      hover:border-ring/50
                      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                      disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50
                      aria-expanded:border-ring
                      data-invalid:border-danger-mid
                      data-invalid:hover:border-danger-mid
                      data-invalid:focus-visible:ring-danger/20
                    `,
                    triggerSize === "lg" ? "px-4 block-control-xl" : "px-3.5 block-control-md",
                )}
            >
                {selectedPeople.length === 1 ? (
                    <UserAvatar
                        name={formatPersonName(selectedPeople[0]!.name)}
                        imageUrl={selectedPeople[0]!.imageUrl}
                        size="2xs"
                        framed={false}
                    />
                ) : (
                    <StartIcon
                        className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                        aria-hidden
                        strokeWidth={1.75}
                    />
                )}
                <span className="flex-1 min-inline-0">
                    {selectedPeople.length === 0 ? (
                        <span data-control-value className="truncate text-control text-ink-subtle">
                            {facePlaceholder}
                        </span>
                    ) : selectedPeople.length === 1 ? (
                        <span className="flex flex-col min-inline-0">
                            <span
                                data-control-value
                                className="truncate text-control font-medium text-ink"
                            >
                                {formatPersonName(selectedPeople[0]!.name)}
                            </span>
                            {kinds === "both" ? (
                                <span className="body-xs truncate text-ink-muted">
                                    {peopleRoleLabel(selectedPeople[0]!.role)}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        <span
                            data-control-value
                            className="truncate text-control font-medium text-ink"
                        >
                            {selectedPeople.length} selected
                        </span>
                    )}
                </span>
                <ChevronDown
                    className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                    aria-hidden
                />
            </button>
            {errorText ? (
                <p id={`${fieldId}-error`} role="alert" className="body-sm text-danger">
                    {errorText}
                </p>
            ) : null}
            {!errorText && helperText ? (
                <p id={`${fieldId}-helper`} className="body-sm text-ink-muted">
                    {helperText}
                </p>
            ) : null}

            {props.multiple ? (
                <PeoplePicker
                    {...props}
                    open={open}
                    onOpenChange={setOpen}
                    multiple
                    value={props.value}
                    onConfirm={props.onConfirm}
                />
            ) : (
                <PeoplePicker
                    {...props}
                    open={open}
                    onOpenChange={setOpen}
                    multiple={false}
                    value={props.value}
                    onConfirm={props.onConfirm}
                />
            )}
        </div>
    );
}
