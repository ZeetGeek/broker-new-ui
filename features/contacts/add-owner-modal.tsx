"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api/client";
import { exclusiveOwnersApi } from "@/lib/api/exclusive-owners";
import {
    exclusiveOwnerFormSchema,
    type ExclusiveOwnerFormValues,
    normalizeExclusiveOwnerPhone,
} from "@/lib/validation/exclusive-owner";
import { useLocationOptions } from "@/hooks/use-locations";

import { CallIcon, UserRound } from "@/components/shared/icons";
import { LocalityCombobox } from "@/components/shared/locality-combobox";

import { FEATURE_RERA_VERIFICATION } from "@/config/index";
import { SOURCE_OPTIONS } from "@/features/contacts/buyer-options";
import {
    ComboboxField,
    ContactFormDrawer,
    FormField,
    NotesField,
    TextField,
} from "@/features/contacts/contact-form-ui";
import { contactLocationDefaults } from "@/features/contacts/contact-location-defaults";
import { ContactLocationFields } from "@/features/contacts/contact-location-fields";
import type { OwnerRow } from "@/features/contacts/types";
import {
    FORM_SECTIONS_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import { useAppSelector } from "@/store/hooks";

const OWNER_TYPE_OPTIONS = [
    { value: "individual", label: "Individual", description: "Private person" },
    { value: "builder", label: "Builder", description: "Project developer" },
    { value: "company", label: "Company", description: "Business owner" },
] as const;

function emptyValues(location = contactLocationDefaults()): ExclusiveOwnerFormValues {
    return {
        fullName: "",
        phone: "",
        email: "",
        ownerType: "individual",
        society: "",
        area: "",
        country: location.country,
        state: location.state,
        city: location.city,
        pincode: "",
        fullAddress: "",
        reraNumber: "",
        source: "",
        notes: "",
    };
}

function valuesFromOwner(
    owner: OwnerRow | null,
    location = contactLocationDefaults(),
): ExclusiveOwnerFormValues {
    if (!owner) return emptyValues(location);
    const details = owner.details;
    return {
        fullName: owner.name,
        phone: owner.phoneDigits ?? "",
        email: details?.email ?? "",
        ownerType:
            details?.ownerType === "builder" || details?.ownerType === "company"
                ? details.ownerType
                : "individual",
        society: details?.societyName ?? "",
        area: details?.locality ?? owner.localities[0] ?? "",
        country: details?.country?.trim() || location.country,
        state: details?.state?.trim() || location.state,
        city: details?.city?.trim() || location.city,
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
    const profile = useAppSelector((state) => state.dashboard.profile);
    const locationDefaults = useMemo(() => contactLocationDefaults(profile), [profile]);
    const [busy, setBusy] = useState(false);
    const [initializedFor, setInitializedFor] = useState<OwnerRow | null | undefined>(undefined);
    const [submitError, setSubmitError] = useState("");

    const form = useForm<ExclusiveOwnerFormValues>({
        resolver: zodResolver(exclusiveOwnerFormSchema),
        defaultValues: emptyValues(locationDefaults),
        mode: "onSubmit",
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isDirty },
    } = form;

    const values = useWatch({ control });
    const { selectedCity } = useLocationOptions({
        countryName: values.country,
        stateName: values.state,
        cityName: values.city,
    });

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(() => {
            const next = valuesFromOwner(owner, locationDefaults);
            reset(next);
            setSubmitError("");
            setBusy(false);
            setInitializedFor(owner);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [locationDefaults, open, owner, reset]);

    const onInvalid = () => {
        document
            .querySelectorAll<HTMLDetailsElement>(".contacts-form-drawer details")
            .forEach((section) => {
                section.open = true;
            });
        setSubmitError("Check the highlighted fields and try again.");
    };

    const createOwner = async (parsed: ExclusiveOwnerFormValues) => {
        const saved = await exclusiveOwnersApi.create({
            ...parsed,
            phone: normalizeExclusiveOwnerPhone(parsed.phone),
        });
        onSaved(saved.fullName, "created");
        return saved;
    };

    const save = handleSubmit(async (parsed) => {
        if (isEdit) {
            setSubmitError("Editing owners is not available yet.");
            return;
        }
        setBusy(true);
        setSubmitError("");
        try {
            await createOwner(parsed);
            reset(emptyValues(locationDefaults));
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
    }, onInvalid);

    const saveAnother = handleSubmit(async (parsed) => {
        if (isEdit) return;
        setBusy(true);
        setSubmitError("");
        try {
            await createOwner(parsed);
            reset(emptyValues(locationDefaults));
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
    }, onInvalid);

    return (
        <ContactFormDrawer
            loading={initializedFor !== owner}
            skeletonVariant="owner"
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit owner" : "Add owner"}
            description=""
            isDirty={isDirty}
            busy={busy}
            primaryLabel={isEdit ? "Save changes" : "Save owner"}
            onPrimary={() => void save()}
            onSaveAnother={isEdit ? undefined : () => void saveAnother()}
            footerError={submitError || undefined}
        >
            <div className={FORM_SECTIONS_CLASS}>
                <WizardSection
                    title="Owner details"
                    description="Add their name and the number you can reach them on."
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField
                            label="Full name"
                            startIcon={UserRound}
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
                            startIcon={CallIcon}
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
                            placeholder="Enter mobile number"
                            hint="India (+91) mobile number"
                        />
                    </div>
                </WizardSection>

                <WizardSection
                    title="What kind of owner?"
                    description="Choose whether they’re an individual, builder, or company."
                >
                    <Controller
                        control={control}
                        name="ownerType"
                        render={({ field }) => (
                            <ComboboxField
                                label="Owner type"
                                startIcon={UserRound}
                                required
                                value={field.value}
                                onChange={field.onChange}
                                options={[...OWNER_TYPE_OPTIONS]}
                                error={errors.ownerType?.message}
                            />
                        )}
                    />
                </WizardSection>

                <WizardSection
                    title="Where is the owner based?"
                    description="Choose their city, then add their area."
                >
                    <div className="flex flex-col gap-4">
                        <ContactLocationFields
                            country={values.country ?? ""}
                            state={values.state ?? ""}
                            city={values.city ?? ""}
                            countryError={errors.country?.message}
                            stateError={errors.state?.message}
                            cityError={errors.city?.message}
                            onCountryChange={(country) =>
                                setValue("country", country, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            onStateChange={(state) =>
                                setValue("state", state, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            onCityChange={(city) => {
                                const current = form.getValues("city");
                                setValue("city", city, { shouldDirty: true, shouldValidate: true });
                                if (city.trim().toLowerCase() === current.trim().toLowerCase())
                                    return;
                                setValue("area", "", { shouldDirty: true });
                            }}
                        />

                        <FormField label="Area" htmlFor="owner-area">
                            <LocalityCombobox
                                id="owner-area"
                                size="lg"
                                cityId={selectedCity?.id}
                                value={values.area ?? ""}
                                placeholder="Search an area, e.g. Vesu"
                                errorText={errors.area?.message}
                                onValueChange={(area: string) =>
                                    setValue("area", area, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                            />
                        </FormField>
                    </div>
                </WizardSection>

                <WizardSection
                    title="Additional details"
                    description="Keep their email, address, source, and useful notes together."
                >
                    <div className="flex flex-col gap-4">
                        <TextField
                            label="Email"
                            type="email"
                            value={values.email ?? ""}
                            onValueChange={(email) =>
                                setValue("email", email, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            error={errors.email?.message}
                            placeholder="Optional"
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

                        {/* RERA verification temporarily hidden; retain UI for later. */}
                        {FEATURE_RERA_VERIFICATION && (
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
                        )}

                        <ComboboxField
                            label="Source"
                            value={values.source ?? ""}
                            placeholder="Source"
                            emptyText="No source matches"
                            options={SOURCE_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                            error={errors.source?.message}
                            onChange={(source) =>
                                setValue("source", source as ExclusiveOwnerFormValues["source"], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        />

                        <NotesField
                            value={values.notes ?? ""}
                            onChange={(notes) =>
                                setValue("notes", notes, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            error={errors.notes?.message}
                        />
                    </div>
                </WizardSection>
            </div>
        </ContactFormDrawer>
    );
}
