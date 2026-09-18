"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api/client";
import { contactsApi } from "@/lib/api/contacts";
import type { NewBuyerInput } from "@/lib/api/clients";
import {
    type BuyerFormValues,
    buyerFormSchema,
    normalizeBuyerBudget,
    normalizeBuyerPhone,
    parseBuyerLocalities,
} from "@/lib/validation/buyer";

import { Button } from "@/components/ui/button";

import {
    BHK_OPTIONS,
    KINDS_WITHOUT_BHK,
    PROPERTY_KIND_OPTIONS,
    SOURCE_OPTIONS,
} from "@/features/contacts/buyer-options";
import {
    ContactFormDrawer,
    LocalityPicker,
    NotesField,
    Segmented,
    SelectField,
    TextField,
} from "@/features/contacts/contact-form-ui";
import type { BuyerRow } from "@/features/contacts/types";

const STEPS = ["Buyer details"];

function emptyValues(): BuyerFormValues {
    return {
        name: "",
        phone: "",
        email: "",
        lookingFor: "buy",
        propertyKind: "apartment",
        localities: "",
        budgetMin: "",
        budgetMax: "",
        bhk: "2",
        source: "walk_in",
        note: "",
    };
}

function valuesFromBuyer(buyer: BuyerRow | null): BuyerFormValues {
    if (!buyer) return emptyValues();
    return {
        name: buyer.name,
        phone: buyer.phoneDigits,
        email: buyer.email ?? "",
        lookingFor: buyer.lookingFor,
        propertyKind: buyer.propertyKind,
        localities: buyer.preferredLocalities.join(", "),
        budgetMin: buyer.budgetMinInr ? String(buyer.budgetMinInr) : "",
        budgetMax: buyer.budgetMaxInr ? String(buyer.budgetMaxInr) : "",
        bhk: buyer.bhk ? String(buyer.bhk) : "",
        source: buyer.source ?? "walk_in",
        note: buyer.notes ?? "",
    };
}

function toNewBuyerInput(values: BuyerFormValues): NewBuyerInput {
    const minDigits = normalizeBuyerBudget(values.budgetMin);
    const maxDigits = normalizeBuyerBudget(values.budgetMax);
    const hideBhk = KINDS_WITHOUT_BHK.includes(values.propertyKind);
    return {
        name: values.name.trim(),
        phoneDigits: normalizeBuyerPhone(values.phone),
        email: values.email.trim() || null,
        lookingFor: values.lookingFor,
        propertyKind: values.propertyKind,
        preferredLocalities: parseBuyerLocalities(values.localities),
        budgetMinInr: minDigits ? Number(minDigits) : null,
        budgetMaxInr: maxDigits ? Number(maxDigits) : null,
        bhk: hideBhk || !values.bhk ? null : Number(values.bhk) || null,
        source: values.source,
        notes: values.note.trim() || null,
    };
}

function DuplicateWarning({
    match,
    onContinue,
}: {
    match: { id: string; name: string; type: "buyer" | "owner" };
    onContinue: () => void;
}) {
    return (
        <div
            className="border-warning/40 bg-warning-soft rounded-inner border px-3.5 py-3"
            role="status"
        >
            <p className="body-sm text-ink">
                This number is already saved as <strong>{match.name}</strong> ({match.type}).
            </p>
            <div className="mbs-2 flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.assign(`/broker/contacts?open=${match.id}`)}
                >
                    Open existing
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onContinue}>
                    Continue anyway
                </Button>
            </div>
        </div>
    );
}

export function AddBuyerModal({
    open,
    onOpenChange,
    onCreated,
    buyer = null,
    onUpdated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (name: string, id?: string) => void;
    buyer?: BuyerRow | null;
    onUpdated?: (name: string) => void;
}) {
    const isEdit = Boolean(buyer);
    const form = useForm<BuyerFormValues>({
        resolver: zodResolver(buyerFormSchema),
        defaultValues: valuesFromBuyer(buyer),
    });
    const values = useWatch({ control: form.control });
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState<string>();
    const [duplicate, setDuplicate] = useState<{
        id: string;
        name: string;
        type: "buyer" | "owner";
    } | null>(null);
    const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);

    const propertyKind = values.propertyKind ?? "apartment";
    const showBhk = !KINDS_WITHOUT_BHK.includes(propertyKind);
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        if (!open) return;
        form.reset(valuesFromBuyer(buyer));
        setBusy(false);
        setFormError(undefined);
        setDuplicate(null);
        setIgnoreDuplicate(false);
    }, [buyer, form, open]);

    useEffect(() => {
        if (!open || isEdit || ignoreDuplicate) return;
        const phone = normalizeBuyerPhone(values.phone ?? "");
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setDuplicate(null);
            return;
        }
        const timer = window.setTimeout(() => {
            void contactsApi
                .checkDuplicate(phone)
                .then((match) => {
                    setDuplicate(match);
                })
                .catch(() => setDuplicate(null));
        }, 350);
        return () => window.clearTimeout(timer);
    }, [ignoreDuplicate, isEdit, open, values.phone]);

    const localityList = useMemo(
        () => parseBuyerLocalities(values.localities ?? ""),
        [values.localities],
    );

    const save = form.handleSubmit(async (parsed) => {
        if (duplicate && !ignoreDuplicate && !isEdit) return;
        setBusy(true);
        setFormError(undefined);
        try {
            const input = toNewBuyerInput(parsed);
            const savedId = await contactsApi.saveBuyer(input, buyer?.id);
            if (isEdit) onUpdated?.(input.name);
            else onCreated(input.name, savedId);
            toast.success(isEdit ? "Buyer updated" : "Buyer added");
            onOpenChange(false);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not save this buyer. Try again.";
            setFormError(message);
            toast.error(message);
        } finally {
            setBusy(false);
        }
    });

    const saveAnother = form.handleSubmit(async (parsed) => {
        if (duplicate && !ignoreDuplicate) return;
        setBusy(true);
        setFormError(undefined);
        try {
            const input = toNewBuyerInput(parsed);
            const savedId = await contactsApi.saveBuyer(input);
            onCreated(input.name, savedId);
            toast.success("Buyer added");
            form.reset(emptyValues());
            setDuplicate(null);
            setIgnoreDuplicate(false);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not save this buyer. Try again.";
            setFormError(message);
            toast.error(message);
        } finally {
            setBusy(false);
        }
    });

    return (
        <ContactFormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit buyer" : "Add buyer"}
            description="Capture their requirement once, then match them to your private listings."
            step={0}
            steps={STEPS}
            isDirty={isDirty}
            busy={busy}
            onBack={() => onOpenChange(false)}
            onNext={() => void save()}
            onSaveAnother={isEdit ? undefined : () => void saveAnother()}
        >
            <div className="space-y-4">
                {formError ? (
                    <p
                        role="alert"
                        className="body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger"
                    >
                        {formError}
                    </p>
                ) : null}
                {duplicate && !ignoreDuplicate && !isEdit ? (
                    <DuplicateWarning
                        match={duplicate}
                        onContinue={() => setIgnoreDuplicate(true)}
                    />
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                        label="Full name"
                        required
                        value={values.name ?? ""}
                        onValueChange={(name) =>
                            form.setValue("name", name, { shouldDirty: true, shouldValidate: true })
                        }
                        error={form.formState.errors.name?.message}
                        placeholder="Aarav Shah"
                    />
                    <TextField
                        label="Mobile"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={values.phone ?? ""}
                        onValueChange={(phone) =>
                            form.setValue("phone", phone.replace(/\D/g, "").slice(0, 10), {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={form.formState.errors.phone?.message}
                        placeholder="9876543210"
                        hint="+91 India mobile"
                    />
                </div>

                <TextField
                    label="Email"
                    type="email"
                    value={values.email ?? ""}
                    onValueChange={(email) =>
                        form.setValue("email", email, { shouldDirty: true, shouldValidate: true })
                    }
                    error={form.formState.errors.email?.message}
                    placeholder="Optional"
                />

                <Controller
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                        <Segmented
                            label="Looking for"
                            value={field.value}
                            onChange={field.onChange}
                            options={[
                                { value: "buy", label: "Buy" },
                                { value: "rent", label: "Rent" },
                            ]}
                        />
                    )}
                />

                <SelectField
                    label="Property type"
                    required
                    value={propertyKind}
                    onChange={(propertyKindNext) => {
                        form.setValue(
                            "propertyKind",
                            propertyKindNext as BuyerFormValues["propertyKind"],
                            {
                                shouldDirty: true,
                                shouldValidate: true,
                            },
                        );
                        if (
                            KINDS_WITHOUT_BHK.includes(
                                propertyKindNext as BuyerFormValues["propertyKind"],
                            )
                        ) {
                            form.setValue("bhk", "", { shouldDirty: true });
                        } else if (!values.bhk) {
                            form.setValue("bhk", "2", { shouldDirty: true });
                        }
                    }}
                    options={PROPERTY_KIND_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                    }))}
                    error={form.formState.errors.propertyKind?.message}
                />

                {showBhk ? (
                    <SelectField
                        label="BHK"
                        value={values.bhk ?? ""}
                        onChange={(bhk) =>
                            form.setValue("bhk", bhk, { shouldDirty: true, shouldValidate: true })
                        }
                        options={BHK_OPTIONS.map((value) => ({ value, label: `${value} BHK` }))}
                        placeholder="Any"
                        error={form.formState.errors.bhk?.message}
                    />
                ) : null}

                <LocalityPicker
                    label="Preferred localities"
                    required
                    values={localityList}
                    placeholder="Vesu, Adajan…"
                    error={form.formState.errors.localities?.message}
                    onChange={(next) =>
                        form.setValue("localities", next.join(", "), {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                        label="Budget min (₹)"
                        inputMode="numeric"
                        value={values.budgetMin ?? ""}
                        onValueChange={(budgetMin) =>
                            form.setValue("budgetMin", normalizeBuyerBudget(budgetMin), {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={form.formState.errors.budgetMin?.message}
                        placeholder="Optional"
                    />
                    <TextField
                        label="Budget max (₹)"
                        inputMode="numeric"
                        value={values.budgetMax ?? ""}
                        onValueChange={(budgetMax) =>
                            form.setValue("budgetMax", normalizeBuyerBudget(budgetMax), {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={form.formState.errors.budgetMax?.message}
                        placeholder="Optional"
                    />
                </div>

                <SelectField
                    label="Source"
                    required
                    value={values.source ?? "walk_in"}
                    onChange={(source) =>
                        form.setValue("source", source as BuyerFormValues["source"], {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    options={SOURCE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                    }))}
                    error={form.formState.errors.source?.message}
                />

                <NotesField
                    value={values.note ?? ""}
                    onChange={(note) =>
                        form.setValue("note", note, { shouldDirty: true, shouldValidate: true })
                    }
                    error={form.formState.errors.note?.message}
                />
            </div>
        </ContactFormDrawer>
    );
}
