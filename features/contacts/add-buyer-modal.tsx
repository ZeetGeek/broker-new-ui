"use client";

import { type ReactNode, useCallback, useState } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Home, KeyRound, MapPin, Phone, UserPlus } from "lucide-react";

import { clientsApi } from "@/lib/api/clients";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";
import {
    buyerFormSchema,
    type BuyerFormValues,
    normalizeBuyerBudget,
    normalizeBuyerPhone,
    parseBuyerLocalities,
} from "@/lib/validation/buyer";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    BHK_OPTIONS,
    KINDS_WITHOUT_BHK,
    type Option,
    PROPERTY_KIND_OPTIONS,
    SOURCE_OPTIONS,
} from "@/features/contacts/buyer-options";
import { SelectionChip } from "@/features/properties/property-form/selection-chip";

const EMPTY: BuyerFormValues = {
    name: "",
    phone: "",
    email: "",
    lookingFor: "buy",
    propertyKind: "any",
    localities: "",
    budgetMin: "",
    budgetMax: "",
    bhk: "",
    urgency: "three_months",
    funding: "unknown",
    source: "referral",
    note: "",
};

/**
 * A titled band of related fields. Grouping is what lets a long form read as
 * four short decisions rather than one wall of inputs.
 */
function Section({
    eyebrow,
    children,
    className,
}: {
    eyebrow: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("flex flex-col gap-3", className)}>
            <h3 className="eyebrow">{eyebrow}</h3>
            {children}
        </section>
    );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="body-sm font-medium text-ink">
            {children}
        </label>
    );
}

/** A labelled row of chips bound to one form field. */
function ChipRow<T extends string>({
    label,
    options,
    value,
    onChange,
    dense = false,
}: {
    label: string;
    options: Option<T>[];
    value: T;
    onChange: (next: T) => void;
    dense?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="body-sm font-medium text-ink">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    const chip = (
                        <SelectionChip
                            active={value === option.value}
                            showCheck={false}
                            onClick={() => onChange(option.value)}
                            className={dense ? "px-3.5 py-2" : undefined}
                            icon={Icon ? <Icon strokeWidth={1.75} /> : undefined}
                        >
                            {option.label}
                        </SelectionChip>
                    );

                    if (!option.hint) {
                        return <div key={option.value}>{chip}</div>;
                    }

                    return (
                        <Tooltip key={option.value}>
                            <TooltipTrigger render={<div />}>{chip}</TooltipTrigger>
                            <TooltipContent side="bottom">{option.hint}</TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}

/** Live rupee readout under a budget field, per docs/DESIGN.md §6. */
function budgetHint(raw: string, isRent: boolean): string | null {
    const digits = normalizeBuyerBudget(String(raw ?? ""));
    if (digits === "") return null;
    return isRent ? formatRentInr(Number(digits)) : formatPriceInr(Number(digits));
}

function BudgetFields({ control, isRent }: { control: Control<BuyerFormValues>; isRent: boolean }) {
    const minDraft = useWatch({ control, name: "budgetMin" });
    const maxDraft = useWatch({ control, name: "budgetMax" });

    const minHint = budgetHint(String(minDraft ?? ""), isRent);
    const maxHint = budgetHint(String(maxDraft ?? ""), isRent);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
                name="budgetMin"
                control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <FieldLabel htmlFor="buyer-budget-min">Lowest</FieldLabel>
                        <Input
                            {...field}
                            id="buyer-budget-min"
                            inputMode="numeric"
                            placeholder={isRent ? "20000" : "6000000"}
                            autoComplete="off"
                            errorText={fieldState.error?.message}
                        />
                        <p className="body-xs tabular text-ink-subtle">{minHint ?? "Optional"}</p>
                    </div>
                )}
            />

            <Controller
                name="budgetMax"
                control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <FieldLabel htmlFor="buyer-budget-max">Highest</FieldLabel>
                        <Input
                            {...field}
                            id="buyer-budget-max"
                            inputMode="numeric"
                            placeholder={isRent ? "35000" : "8500000"}
                            autoComplete="off"
                            errorText={fieldState.error?.message}
                        />
                        <p className="body-xs tabular text-ink-subtle">{maxHint ?? "Optional"}</p>
                    </div>
                )}
            />
        </div>
    );
}

export function AddBuyerModal({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (name: string) => void;
}) {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<BuyerFormValues>({
        resolver: zodResolver(buyerFormSchema),
        defaultValues: EMPTY,
        mode: "onTouched",
        reValidateMode: "onChange",
    });

    // A reopened modal always starts clean — a half-typed buyer from last time
    // is worse than an empty form. Done as derived state on the open->true
    // edge rather than in an effect, which would cascade a second render.
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            reset(EMPTY);
            setSubmitError(null);
        }
    }

    const lookingFor = useWatch({ control, name: "lookingFor" });
    const propertyKind = useWatch({ control, name: "propertyKind" });

    const isRent = lookingFor === "rent";
    // A plot, shop or office has no bedroom count, so asking for one is noise.
    const showBhk = !KINDS_WITHOUT_BHK.includes(propertyKind);

    const onSubmit = useCallback(
        async (values: BuyerFormValues) => {
            setSubmitError(null);

            // The schema validates the typed strings; converting to the stored
            // shape happens here, where the types stay honest.
            const maxDigits = normalizeBuyerBudget(values.budgetMax);
            const minDigits = normalizeBuyerBudget(values.budgetMin);
            // The card shows one ceiling, so fall back to the lower figure when
            // that is the only one given.
            const ceiling = maxDigits || minDigits;

            try {
                await clientsApi.create({
                    name: values.name.trim(),
                    phoneDigits: normalizeBuyerPhone(values.phone),
                    lookingFor: values.lookingFor,
                    preferredLocalities: parseBuyerLocalities(values.localities),
                    budgetMaxInr: ceiling === "" ? null : Number(ceiling),
                    bhk: values.bhk === "" ? null : Number(values.bhk),
                });

                onCreated(values.name.trim());
                onOpenChange(false);
            } catch (error) {
                setSubmitError(
                    error instanceof Error
                        ? error.message
                        : "Could not save this buyer. Try again.",
                );
            }
        },
        [onCreated, onOpenChange],
    );

    return (
        <TooltipProvider>
            <AppModal
                open={open}
                onOpenChange={onOpenChange}
                size="lg"
                title="Add a buyer"
                description="Someone looking to buy or rent. You can link them to a property afterwards."
                footer={
                    <AppModalFooter
                        primaryLabel={isSubmitting ? "Saving…" : "Save buyer"}
                        primaryIcon={<UserPlus aria-hidden strokeWidth={1.75} />}
                        onPrimary={handleSubmit(onSubmit)}
                        primaryDisabled={isSubmitting}
                        secondaryLabel="Cancel"
                        onSecondary={() => onOpenChange(false)}
                        secondaryDisabled={isSubmitting}
                    >
                        <span className="body-xs hidden text-ink-subtle sm:inline">
                            Name, number and area are all you need.
                        </span>
                    </AppModalFooter>
                }
            >
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
                    <Section eyebrow="Who they are">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="buyer-name">Name</FieldLabel>
                                        <Input
                                            {...field}
                                            id="buyer-name"
                                            placeholder="Ankit Shah"
                                            autoComplete="off"
                                            errorText={fieldState.error?.message}
                                        />
                                    </div>
                                )}
                            />

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2">
                                        <FieldLabel htmlFor="buyer-phone">Mobile number</FieldLabel>
                                        <Input
                                            {...field}
                                            id="buyer-phone"
                                            inputMode="numeric"
                                            placeholder="98250 11223"
                                            autoComplete="off"
                                            startIcon={Phone}
                                            errorText={fieldState.error?.message}
                                        />
                                    </div>
                                )}
                            />
                        </div>

                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="buyer-email">
                                        Email{" "}
                                        <span className="font-normal text-ink-subtle">
                                            (optional)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="buyer-email"
                                        type="email"
                                        placeholder="ankit@example.com"
                                        autoComplete="off"
                                        startIcon={AtSign}
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="source"
                            control={control}
                            render={({ field }) => (
                                <ChipRow
                                    label="How they found you"
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={SOURCE_OPTIONS}
                                    dense
                                />
                            )}
                        />
                    </Section>

                    <div className="border-bs border-border-warm" />

                    <Section eyebrow="What they want">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Controller
                                name="lookingFor"
                                control={control}
                                render={({ field }) => (
                                    <ChipRow
                                        label="Looking to"
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { value: "buy", label: "Buy", icon: Home },
                                            { value: "rent", label: "Rent", icon: KeyRound },
                                        ]}
                                    />
                                )}
                            />

                            <Controller
                                name="propertyKind"
                                control={control}
                                render={({ field }) => (
                                    <ChipRow
                                        label="Property type"
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={PROPERTY_KIND_OPTIONS}
                                        dense
                                    />
                                )}
                            />
                        </div>

                        <Controller
                            name="localities"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="buyer-localities">
                                        Areas they want
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="buyer-localities"
                                        placeholder="Vesu, Piplod"
                                        autoComplete="off"
                                        startIcon={MapPin}
                                        errorText={fieldState.error?.message}
                                    />
                                    <p className="body-xs text-ink-subtle">
                                        Separate areas with a comma.
                                    </p>
                                </div>
                            )}
                        />

                        {showBhk ? (
                            <Controller
                                name="bhk"
                                control={control}
                                render={({ field }) => (
                                    <ChipRow
                                        label="Size they want"
                                        value={field.value}
                                        onChange={field.onChange}
                                        dense
                                        options={[
                                            { value: "", label: "Any" },
                                            ...BHK_OPTIONS.map((option) => ({
                                                value: option as string,
                                                label: `${option} BHK`,
                                            })),
                                        ]}
                                    />
                                )}
                            />
                        ) : null}
                    </Section>

                    <div className="border-bs border-border-warm" />

                    <Section eyebrow={isRent ? "Rent they will pay" : "Budget"}>
                        <BudgetFields control={control} isRent={isRent} />
                    </Section>

                    <div className="border-bs border-border-warm" />

                    <Section eyebrow="Anything else">
                        <Controller
                            name="note"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="buyer-note">
                                        Note{" "}
                                        <span className="font-normal text-ink-subtle">
                                            (optional)
                                        </span>
                                    </FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="buyer-note"
                                        rows={3}
                                        maxLength={300}
                                        placeholder="Wants possession by March. Bringing family to the next visit."
                                        className="rounded-inner"
                                    />
                                    {fieldState.error?.message ? (
                                        <p role="alert" className="body-xs text-danger">
                                            {fieldState.error.message}
                                        </p>
                                    ) : (
                                        <p className="body-xs tabular text-ink-subtle">
                                            {String(field.value ?? "").length} of 300
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </Section>

                    {submitError ? (
                        <p role="alert" className="body-sm text-danger">
                            {submitError}
                        </p>
                    ) : null}
                </form>
            </AppModal>
        </TooltipProvider>
    );
}
