"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import type { NewBuyerInput } from "@/lib/api/clients";
import { contactsApi } from "@/lib/api/contacts";
import {
    type BuyerFormValues,
    buyerFormSchema,
    normalizeBuyerBudget,
    normalizeBuyerPhone,
    parseBuyerLocalities,
} from "@/lib/validation/buyer";

import { useAppSelector } from "@/store/hooks";

import { Button } from "@/components/ui/button";

import { SOURCE_OPTIONS } from "@/features/contacts/buyer-options";
import {
    BudgetRangeField,
    ChoiceRadioField,
    ComboboxField,
    ContactFormDrawer,
    LocalityPicker,
    MoreDetails,
    NotesField,
    TextField,
} from "@/features/contacts/contact-form-ui";
import { contactLocationDefaults } from "@/features/contacts/contact-location-defaults";
import { ContactLocationFields } from "@/features/contacts/contact-location-fields";
import type { BuyerRow } from "@/features/contacts/types";

function emptyValues(location = contactLocationDefaults()): BuyerFormValues {
    return {
        name: "",
        phone: "",
        email: "",
        lookingFor: "buy",
        propertyKind: "any",
        country: location.country,
        state: location.state,
        city: location.city,
        localities: "",
        budgetMin: "",
        budgetMax: "",
        bhk: "",
        source: "walk_in",
        note: "",
    };
}

function valuesFromBuyer(
    buyer: BuyerRow | null,
    location = contactLocationDefaults(),
): BuyerFormValues {
    if (!buyer) return emptyValues(location);
    const lookingFor =
        buyer.lookingFor === "rent" || buyer.lookingFor === "both" ? buyer.lookingFor : "buy";
    return {
        name: buyer.name,
        phone: buyer.phoneDigits,
        email: buyer.email ?? "",
        lookingFor,
        propertyKind: buyer.propertyKind || "any",
        country: buyer.country?.trim() || location.country,
        state: buyer.state?.trim() || location.state,
        city: buyer.city?.trim() || location.city,
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
    return {
        name: values.name.trim(),
        phoneDigits: normalizeBuyerPhone(values.phone),
        email: values.email.trim() || null,
        lookingFor: values.lookingFor,
        propertyKind: values.propertyKind || "any",
        preferredLocalities: parseBuyerLocalities(values.localities),
        country: values.country.trim() || null,
        state: values.state.trim() || null,
        city: values.city.trim() || null,
        budgetMinInr: minDigits ? Number(minDigits) : null,
        budgetMaxInr: maxDigits ? Number(maxDigits) : null,
        bhk: values.bhk ? Number(values.bhk) || null : null,
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
    onAttach,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (name: string, id?: string) => void;
    buyer?: BuyerRow | null;
    onUpdated?: (name: string) => void;
    /** Edit mode — open the attach-properties sheet for this buyer. */
    onAttach?: () => void;
}) {
    const isEdit = Boolean(buyer);
    const profile = useAppSelector((state) => state.dashboard.profile);
    const locationDefaults = useMemo(() => contactLocationDefaults(profile), [profile]);

    const form = useForm<BuyerFormValues>({
        resolver: zodResolver(buyerFormSchema),
        defaultValues: valuesFromBuyer(buyer, locationDefaults),
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
    const [moreOpen, setMoreOpen] = useState(false);

    const isDirty = form.formState.isDirty;
    const localityList = useMemo(
        () => parseBuyerLocalities(values.localities ?? ""),
        [values.localities],
    );

    useEffect(() => {
        if (!open) return;
        form.reset(valuesFromBuyer(buyer, locationDefaults));
        setBusy(false);
        setFormError(undefined);
        setDuplicate(null);
        setIgnoreDuplicate(false);
        setMoreOpen(Boolean(buyer?.email || buyer?.notes));
    }, [buyer, form, locationDefaults, open]);

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

    const onInvalid = () => {
        setFormError("Check the highlighted fields and try again.");
    };

    const save = form.handleSubmit(async (parsed) => {
        if (duplicate && !ignoreDuplicate && !isEdit) {
            setFormError(
                "This mobile number is already saved. Open the existing contact, or continue anyway.",
            );
            return;
        }
        setBusy(true);
        setFormError(undefined);
        try {
            const input = toNewBuyerInput(parsed);
            if (isEdit && buyer) {
                await contactsApi.saveBuyer(input, buyer.id);
                onUpdated?.(input.name);
                toast.success("Buyer updated");
                onOpenChange(false);
            } else {
                const savedId = await contactsApi.saveBuyer(input);
                onCreated(input.name, savedId);
                toast.success("Buyer added");
                form.reset(emptyValues(locationDefaults));
                onOpenChange(false);
            }
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not save this buyer. Try again.";
            setFormError(message);
        } finally {
            setBusy(false);
        }
    }, onInvalid);

    const saveAnother = form.handleSubmit(async (parsed) => {
        if (duplicate && !ignoreDuplicate) {
            setFormError(
                "This mobile number is already saved. Open the existing contact, or continue anyway.",
            );
            return;
        }
        setBusy(true);
        setFormError(undefined);
        try {
            const input = toNewBuyerInput(parsed);
            const savedId = await contactsApi.saveBuyer(input);
            onCreated(input.name, savedId);
            toast.success("Buyer added");
            form.reset(emptyValues(locationDefaults));
            setDuplicate(null);
            setIgnoreDuplicate(false);
            setMoreOpen(false);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not save this buyer. Try again.";
            setFormError(message);
        } finally {
            setBusy(false);
        }
    }, onInvalid);

    return (
        <ContactFormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit buyer" : "Add buyer"}
            description="Capture their requirement once, then match them to your private listings."
            isDirty={isDirty}
            busy={busy}
            primaryLabel={isEdit ? "Save changes" : "Save buyer"}
            onPrimary={() => void save()}
            onSaveAnother={isEdit ? undefined : () => void saveAnother()}
            footerError={formError}
        >
            <div className="space-y-5">
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

                <Controller
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                        <ChoiceRadioField
                            name="looking-for"
                            label="Looking for"
                            columns={3}
                            value={field.value}
                            onChange={field.onChange}
                            options={[
                                {
                                    value: "buy",
                                    label: "Buy",
                                    description: "Find a property to buy",
                                },
                                {
                                    value: "rent",
                                    label: "Rent",
                                    description: "Find a rental",
                                },
                                {
                                    value: "both",
                                    label: "Both",
                                    description: "Open to buy or rent",
                                },
                            ]}
                        />
                    )}
                />

                <ContactLocationFields
                    country={values.country ?? ""}
                    state={values.state ?? ""}
                    city={values.city ?? ""}
                    countryError={form.formState.errors.country?.message}
                    stateError={form.formState.errors.state?.message}
                    cityError={form.formState.errors.city?.message}
                    onCountryChange={(country) =>
                        form.setValue("country", country, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    onStateChange={(state) =>
                        form.setValue("state", state, { shouldDirty: true, shouldValidate: true })
                    }
                    onCityChange={(city) =>
                        form.setValue("city", city, { shouldDirty: true, shouldValidate: true })
                    }
                />

                <LocalityPicker
                    label="Areas"
                    required
                    values={localityList}
                    placeholder="Type another area…"
                    error={form.formState.errors.localities?.message}
                    onChange={(next) =>
                        form.setValue("localities", next.join(", "), {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                />

                <BudgetRangeField
                    lookingFor={values.lookingFor ?? "buy"}
                    minInr={values.budgetMin ?? ""}
                    maxInr={values.budgetMax ?? ""}
                    onMinChange={(budgetMin) =>
                        form.setValue("budgetMin", budgetMin, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    onMaxChange={(budgetMax) =>
                        form.setValue("budgetMax", budgetMax, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    minError={form.formState.errors.budgetMin?.message}
                    maxError={form.formState.errors.budgetMax?.message}
                />

                {isEdit && onAttach ? (
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-ink">Matched properties</p>
                        <button
                            type="button"
                            onClick={onAttach}
                            className="
                              body-sm flex items-center gap-2 rounded-control border border-dashed
                              border-brand/35 px-4 py-3.5 font-semibold text-brand-text inline-full
                              hover:bg-brand-soft/40
                            "
                        >
                            <Link2 aria-hidden className="block-4 inline-4" />
                            Attach property
                        </button>
                    </div>
                ) : null}

                <MoreDetails open={moreOpen} onOpenChange={setMoreOpen}>
                    <TextField
                        label="Email"
                        type="email"
                        value={values.email ?? ""}
                        onValueChange={(email) =>
                            form.setValue("email", email, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={form.formState.errors.email?.message}
                        placeholder="Optional"
                    />

                    <ComboboxField
                        label="Source"
                        value={values.source ?? "walk_in"}
                        placeholder="Source"
                        emptyText="No source matches"
                        options={SOURCE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                        }))}
                        error={form.formState.errors.source?.message}
                        onChange={(source) =>
                            form.setValue("source", source as BuyerFormValues["source"], {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                    />

                    <NotesField
                        value={values.note ?? ""}
                        onChange={(note) =>
                            form.setValue("note", note, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={form.formState.errors.note?.message}
                    />
                </MoreDetails>
            </div>
        </ContactFormDrawer>
    );
}
