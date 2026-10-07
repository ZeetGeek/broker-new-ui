"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api/client";
import { exclusiveOwnersApi } from "@/lib/api/exclusive-owners";
import {
    exclusiveOwnerFormSchema,
    normalizeExclusiveOwnerPhone,
    type ExclusiveOwnerFormValues,
} from "@/lib/validation/exclusive-owner";

import { SOURCE_OPTIONS } from "@/features/contacts/buyer-options";
import {
    ContactFormDrawer,
    MoreDetails,
    NotesField,
    Segmented,
    SelectField,
    TextField,
} from "@/features/contacts/contact-form-ui";
import type { OwnerRow } from "@/features/contacts/types";

const OWNER_TYPE_OPTIONS = [
    { value: "individual", label: "Individual" },
    { value: "builder", label: "Builder" },
    { value: "company", label: "Company" },
] as const;

function emptyValues(): ExclusiveOwnerFormValues {
    return {
        fullName: "",
        phone: "",
        email: "",
        ownerType: "individual",
        society: "",
        area: "",
        city: "",
        pincode: "",
        fullAddress: "",
        reraNumber: "",
        source: "",
        notes: "",
    };
}

function valuesFromOwner(owner: OwnerRow | null): ExclusiveOwnerFormValues {
    if (!owner) return emptyValues();
    const details = owner.details;
    return {
        fullName: owner.name,
        phone: owner.phoneDigits ?? "",
        email: details?.email ?? "",
        ownerType:
            details?.ownerType === "builder" || details?.ownerType === "company"
                ? details.ownerType
                : "individual",
        society: details?.societyName ?? owner.propertyTitles[0] ?? "",
        area: details?.locality ?? owner.localities[0] ?? "",
        city: details?.city ?? "",
        pincode: details?.pincode ?? "",
        fullAddress: details?.fullAddress ?? details?.address ?? "",
        reraNumber: details?.reraNumber ?? "",
        source:
            details?.source === "referral" ||
            details?.source === "walk_in" ||
            details?.source === "portal" ||
            details?.source === "social" ||
            details?.source === "repeat" ||
            details?.source === "other"
                ? details.source
                : "",
        notes: owner.notes ?? details?.notes ?? "",
    };
}

export function AddOwnerModal({
    open,
    onOpenChange,
    onSaved,
    owner = null,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (name: string, mode: "created" | "updated") => void;
    owner?: OwnerRow | null;
}) {
    const isEdit = Boolean(owner);
    const [busy, setBusy] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [moreOpen, setMoreOpen] = useState(false);

    const form = useForm<ExclusiveOwnerFormValues>({
        resolver: zodResolver(exclusiveOwnerFormSchema),
        defaultValues: emptyValues(),
        mode: "onSubmit",
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = form;

    const values = watch();

    useEffect(() => {
        if (!open) return;
        const next = valuesFromOwner(owner);
        reset(next);
        setSubmitError("");
        setBusy(false);
        setMoreOpen(
            Boolean(
                next.email || next.fullAddress || next.pincode || next.reraNumber || next.notes,
            ),
        );
    }, [open, owner, reset]);

    const save = handleSubmit(async (parsed) => {
        if (isEdit) {
            setSubmitError("Editing owners is not available yet.");
            return;
        }
        setBusy(true);
        setSubmitError("");
        try {
            const saved = await exclusiveOwnersApi.create({
                ...parsed,
                phone: normalizeExclusiveOwnerPhone(parsed.phone),
            });
            onSaved(saved.fullName, "created");
            toast.success(`Added ${saved.fullName}`);
            reset(emptyValues());
            onOpenChange(false);
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not save this owner. Try again.";
            setSubmitError(message);
        } finally {
            setBusy(false);
        }
    });

    return (
        <ContactFormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit owner" : "Add owner"}
            description="Private owner contact for your inventory — only visible on your account."
            isDirty={isDirty}
            busy={busy}
            primaryLabel={isEdit ? "Save changes" : "Save owner"}
            onPrimary={() => void save()}
        >
            <div className="space-y-5">
                {submitError ? (
                    <p
                        role="alert"
                        className="body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger"
                    >
                        {submitError}
                    </p>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                        label="Full name"
                        required
                        value={values.fullName ?? ""}
                        onValueChange={(fullName) =>
                            setValue("fullName", fullName, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.fullName?.message}
                        placeholder="Ramesh Patel"
                    />
                    <TextField
                        label="Mobile"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={values.phone ?? ""}
                        onValueChange={(phone) =>
                            setValue("phone", phone.replace(/\D/g, "").slice(0, 10), {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.phone?.message}
                        placeholder="9876543210"
                        hint="+91 India mobile"
                    />
                </div>

                <Controller
                    control={control}
                    name="ownerType"
                    render={({ field }) => (
                        <Segmented
                            label="Owner type"
                            tone="brand"
                            value={field.value}
                            onChange={field.onChange}
                            options={[...OWNER_TYPE_OPTIONS]}
                            error={errors.ownerType?.message}
                        />
                    )}
                />

                <TextField
                    label="Society / Project"
                    required
                    value={values.society ?? ""}
                    onValueChange={(society) =>
                        setValue("society", society, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    error={errors.society?.message}
                    placeholder="Green Valley Heights"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                        label="Area"
                        value={values.area ?? ""}
                        onValueChange={(area) =>
                            setValue("area", area, { shouldDirty: true, shouldValidate: true })
                        }
                        error={errors.area?.message}
                        placeholder="Vesu"
                    />
                    <TextField
                        label="City"
                        value={values.city ?? ""}
                        onValueChange={(city) =>
                            setValue("city", city, { shouldDirty: true, shouldValidate: true })
                        }
                        error={errors.city?.message}
                        placeholder="Surat"
                    />
                </div>

                <MoreDetails open={moreOpen} onOpenChange={setMoreOpen}>
                    <TextField
                        label="Email"
                        type="email"
                        value={values.email ?? ""}
                        onValueChange={(email) =>
                            setValue("email", email, { shouldDirty: true, shouldValidate: true })
                        }
                        error={errors.email?.message}
                        placeholder="Optional"
                    />

                    <TextField
                        label="Pincode"
                        inputMode="numeric"
                        maxLength={6}
                        value={values.pincode ?? ""}
                        onValueChange={(pincode) =>
                            setValue("pincode", pincode.replace(/\D/g, "").slice(0, 6), {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.pincode?.message}
                        placeholder="395007"
                    />

                    <TextField
                        label="Full address"
                        value={values.fullAddress ?? ""}
                        onValueChange={(fullAddress) =>
                            setValue("fullAddress", fullAddress, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.fullAddress?.message}
                        placeholder="Flat, tower, landmark"
                    />

                    <TextField
                        label="RERA number"
                        value={values.reraNumber ?? ""}
                        onValueChange={(reraNumber) =>
                            setValue("reraNumber", reraNumber, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.reraNumber?.message}
                        placeholder="Optional"
                    />

                    <SelectField
                        label="Source"
                        value={values.source ?? ""}
                        onChange={(source) =>
                            setValue("source", source as ExclusiveOwnerFormValues["source"], {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        options={SOURCE_OPTIONS}
                        error={errors.source?.message}
                    />

                    <NotesField
                        value={values.notes ?? ""}
                        onChange={(notes) =>
                            setValue("notes", notes, { shouldDirty: true, shouldValidate: true })
                        }
                        error={errors.notes?.message}
                    />
                </MoreDetails>
            </div>
        </ContactFormDrawer>
    );
}
