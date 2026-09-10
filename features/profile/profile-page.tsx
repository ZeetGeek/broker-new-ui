"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, MapPin, Phone, UserRound } from "lucide-react";

import { profileApi, type UpdateProfileInput, type UserProfile } from "@/lib/api/profile";
import {
    BIO_MAX,
    normalizeProfilePhone,
    parseCommaList,
    profileFormSchema,
    type ProfileFormValues,
} from "@/lib/validation/profile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { NotificationPreferences } from "@/features/profile/notification-preferences";
import { ProfilePhotoField } from "@/features/profile/profile-photo-field";
import { ProfileStats } from "@/features/profile/profile-stats";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/slices/dashboard-slice";

/** A titled band of related fields, so a long form reads as three short ones. */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section
            className="
              flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
              sm:p-5
            "
        >
            <div className="flex flex-col gap-0.5">
                <h2 className="body font-semibold text-ink">{title}</h2>
                {description ? <p className="body-sm text-ink-muted">{description}</p> : null}
            </div>
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

function isOwnerProfile(profile: UserProfile | null): boolean {
    return profile?.profileType === "owner" || profile?.role === "owner";
}

/** The form's starting values, read off whatever the API returned. */
function toFormValues(profile: UserProfile): ProfileFormValues {
    const owner = isOwnerProfile(profile);

    return {
        fullName: profile.fullName ?? "",
        // Stored E.164, shown as the ten digits an Indian broker recognises.
        phone: normalizeProfilePhone(profile.phone ?? ""),
        city: profile.city ?? "",
        country: profile.country ?? "India",
        orgName: profile.orgName ?? "",
        bio: owner ? (profile.owner?.bio ?? "") : (profile.broker?.bio ?? ""),
        companyName: profile.owner?.companyName ?? profile.companyName ?? "",
        gstin: profile.owner?.gstin ?? "",
        preferredCities: (profile.owner?.preferredCities ?? []).join(", "),
        preferredLocalities: (profile.owner?.preferredLocalities ?? []).join(", "),
        experienceYears:
            profile.broker?.experienceYears == null ? "" : String(profile.broker.experienceYears),
        licenseNumber: profile.broker?.licenseNumber ?? profile.licenseNumber ?? "",
        reraState: profile.broker?.reraState ?? profile.reraState ?? "",
        publicSlug: profile.broker?.publicSlug ?? profile.qr?.publicSlug ?? "",
        serviceAreas: (profile.broker?.serviceAreas ?? []).join(", "),
        specializations: (profile.broker?.specializations ?? []).join(", "),
    };
}

const EMPTY_FORM: ProfileFormValues = {
    fullName: "",
    phone: "",
    city: "",
    country: "India",
    orgName: "",
    bio: "",
    companyName: "",
    gstin: "",
    preferredCities: "",
    preferredLocalities: "",
    experienceYears: "",
    licenseNumber: "",
    reraState: "",
    publicSlug: "",
    serviceAreas: "",
    specializations: "",
};

export function ProfilePage() {
    const dispatch = useAppDispatch();
    const storedProfile = useAppSelector((state) => state.dashboard.profile);

    const [profile, setLocalProfile] = useState<UserProfile | null>(storedProfile);
    const [isLoading, setIsLoading] = useState(storedProfile === null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        // Validation waits for blur — an error on a field nobody has finished
        // typing reads as being told off. docs/MESSAGES.md rule 5.
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: storedProfile ? toFormValues(storedProfile) : EMPTY_FORM,
    });

    /**
     * Always refetch on mount, even when the dashboard already put a profile in
     * the store. That copy can be minutes old, and editing a stale profile is
     * how a field someone changed on another device gets silently overwritten.
     */
    useEffect(() => {
        let cancelled = false;

        void profileApi
            .get()
            .then((next) => {
                if (cancelled) return;
                setLocalProfile(next);
                dispatch(setProfile(next));
                // Only reset the form from the server while the user has not
                // started typing — clobbering their edits mid-sentence is worse
                // than showing a slightly stale field.
                reset(toFormValues(next), { keepDirtyValues: true });
                setLoadError(null);
            })
            .catch(() => {
                if (!cancelled) {
                    setLoadError(
                        "Could not load your profile. Check your connection and try again.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [dispatch, reset]);

    const bio = useWatch({ control, name: "bio" });

    const handleProfileReplaced = useCallback(
        (next: UserProfile) => {
            setLocalProfile(next);
            dispatch(setProfile(next));
        },
        [dispatch],
    );

    const onSubmit = useCallback(
        async (values: ProfileFormValues) => {
            setSubmitError(null);
            const owner = isOwnerProfile(profile);

            try {
                const payload: UpdateProfileInput = {
                    fullName: values.fullName.trim(),
                    // Back to E.164 on the way out — the wire format, not the
                    // display one. lib/api is the boundary that converts.
                    phone: `+91${normalizeProfilePhone(values.phone)}`,
                    city: values.city.trim(),
                    country: values.country.trim(),
                    orgName: values.orgName.trim(),
                    bio: values.bio.trim(),
                };

                if (owner) {
                    payload.companyName = values.companyName.trim();
                    payload.gstin = values.gstin.trim();
                    payload.preferredCities = parseCommaList(values.preferredCities);
                    payload.preferredLocalities = parseCommaList(values.preferredLocalities);
                } else {
                    payload.experienceYears =
                        values.experienceYears.trim() === ""
                            ? null
                            : Number(values.experienceYears);
                    payload.licenseNumber = values.licenseNumber.trim();
                    payload.reraState = values.reraState.trim();
                    payload.publicSlug = values.publicSlug.trim();
                    payload.serviceAreas = parseCommaList(values.serviceAreas);
                    payload.specializations = parseCommaList(values.specializations);
                }

                const updated = await profileApi.update(payload);

                handleProfileReplaced(updated);
                // Reset to what the server stored, not to what was typed, so
                // the form stops being dirty and shows any value the server
                // adjusted on the way in.
                reset(toFormValues(updated));
                toast.success("Profile saved");
            } catch (error) {
                setSubmitError(
                    error instanceof Error && error.message
                        ? error.message
                        : "Could not save your profile. Check your connection and try again.",
                );
            }
        },
        [handleProfileReplaced, profile, reset],
    );

    if (isLoading && !profile) {
        return null;
    }

    if (loadError && !profile) {
        return (
            <div className="flex flex-col gap-3">
                <h1 className="h1 text-ink">Profile</h1>
                <p role="alert" className="body text-urgent">
                    {loadError}
                </p>
                <Button
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    onClick={() => window.location.reload()}
                >
                    Try again
                </Button>
            </div>
        );
    }

    const ownerAccount = isOwnerProfile(profile);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="h1">
                        <span className="text-ink">
                            {profile?.fullName?.trim() || "Your profile"}.
                        </span>{" "}
                        <span className="text-ink-muted">
                            {ownerAccount
                                ? "This is what brokers see."
                                : "This is what owners see."}
                        </span>
                    </h1>
                    <p className="body-sm text-ink-subtle">{profile?.email}</p>
                </div>

                {/* Disabled until something actually changed — a live Save on an
                    untouched form invites a pointless round trip. */}
                <Button type="submit" size="md" loading={isSubmitting} disabled={!isDirty}>
                    {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
            </div>

            <ProfileStats profile={profile} />

            {submitError ? (
                <p
                    role="alert"
                    className="
                      body-sm rounded-inner border border-danger/25 bg-danger-soft px-3 py-2.5
                      text-danger
                    "
                >
                    {submitError}
                </p>
            ) : null}

            <ProfilePhotoField profile={profile} onUploaded={handleProfileReplaced} />

            <Section
                title="Your details"
                description={
                    ownerAccount
                        ? "How brokers reach you about your properties."
                        : "How owners and buyers reach you."
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                        name="fullName"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-name"
                                    autoComplete="name"
                                    startIcon={UserRound}
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <div className="flex flex-col gap-2">
                        <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                        <Input
                            id="profile-email"
                            value={profile?.email ?? ""}
                            readOnly
                            disabled
                            startIcon={Mail}
                            helperText="Contact support to change this."
                        />
                    </div>

                    <Controller
                        name="phone"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-phone">Mobile number</FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    placeholder="98200 22001"
                                    startIcon={Phone}
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="city"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-city">City</FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-city"
                                    autoComplete="address-level2"
                                    startIcon={MapPin}
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="country"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-country">Country</FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-country"
                                    autoComplete="country-name"
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="orgName"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-org">
                                    {ownerAccount ? "Organization" : "Agency"}
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-org"
                                    startIcon={Building2}
                                    placeholder={
                                        ownerAccount
                                            ? "Leave blank if you list as an individual"
                                            : "Leave blank if you work independently"
                                    }
                                    errorText={fieldState.error?.message}
                                />
                            </div>
                        )}
                    />
                </div>
            </Section>

            {ownerAccount ? (
                <Section
                    title="Your property preferences"
                    description="Brokers use this to decide which listings to bring you."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="companyName"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-company">Company name</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-company"
                                        startIcon={Building2}
                                        placeholder="Desai Estates"
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="gstin"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-gstin">GSTIN</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-gstin"
                                        placeholder="22AAAAA0000A1Z5"
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <Controller
                        name="preferredCities"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-preferred-cities">
                                    Preferred cities
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-preferred-cities"
                                    placeholder="Surat, Ahmedabad"
                                    errorText={fieldState.error?.message}
                                    helperText="Separate them with commas."
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="preferredLocalities"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-preferred-localities">
                                    Preferred localities
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-preferred-localities"
                                    placeholder="Adajan, Vesu"
                                    errorText={fieldState.error?.message}
                                    helperText="Separate them with commas."
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="bio"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-bio">About you</FieldLabel>
                                <Textarea
                                    {...field}
                                    id="profile-bio"
                                    rows={4}
                                    placeholder="What kind of properties you look for, and why."
                                    aria-invalid={Boolean(fieldState.error) || undefined}
                                    aria-describedby="profile-bio-help"
                                />
                                <p
                                    id="profile-bio-help"
                                    className={
                                        fieldState.error
                                            ? "body-xs text-danger"
                                            : "body-xs tabular text-ink-subtle"
                                    }
                                >
                                    {fieldState.error?.message ??
                                        `${(bio ?? "").length} of ${BIO_MAX} characters`}
                                </p>
                            </div>
                        )}
                    />
                </Section>
            ) : (
                <Section
                    title="Your work"
                    description="Owners read this before they accept a request. It is the strongest part of your profile."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="experienceYears"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-experience">
                                        Years of experience
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-experience"
                                        inputMode="numeric"
                                        placeholder="8"
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="licenseNumber"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-rera">RERA number</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-rera"
                                        placeholder="A52100012345"
                                        errorText={fieldState.error?.message}
                                        helperText="Verified brokers get a badge owners can see."
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="reraState"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-rera-state">RERA state</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-rera-state"
                                        placeholder="Gujarat"
                                        errorText={fieldState.error?.message}
                                    />
                                </div>
                            )}
                        />

                        <Controller
                            name="publicSlug"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="flex flex-col gap-2">
                                    <FieldLabel htmlFor="profile-slug">Your public page</FieldLabel>
                                    <Input
                                        {...field}
                                        id="profile-slug"
                                        placeholder="rajesh-patel-surat"
                                        errorText={fieldState.error?.message}
                                        helperText={
                                            field.value
                                                ? `yesbroker.in/brokers/${field.value}`
                                                : "The web address buyers can share."
                                        }
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <Controller
                        name="serviceAreas"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-areas">Areas you work</FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-areas"
                                    placeholder="Vesu, Adajan, Piplod"
                                    errorText={fieldState.error?.message}
                                    helperText="Separate them with commas."
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="specializations"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-specializations">
                                    What you deal in
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id="profile-specializations"
                                    placeholder="Residential, commercial"
                                    errorText={fieldState.error?.message}
                                    helperText="Separate them with commas."
                                />
                            </div>
                        )}
                    />

                    <Controller
                        name="bio"
                        control={control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-2">
                                <FieldLabel htmlFor="profile-bio">About you</FieldLabel>
                                <Textarea
                                    {...field}
                                    id="profile-bio"
                                    rows={4}
                                    placeholder="Two lines on what you know that other brokers do not."
                                    aria-invalid={Boolean(fieldState.error) || undefined}
                                    aria-describedby="profile-bio-help"
                                />
                                <p
                                    id="profile-bio-help"
                                    className={
                                        fieldState.error
                                            ? "body-xs text-danger"
                                            : "body-xs tabular text-ink-subtle"
                                    }
                                >
                                    {fieldState.error?.message ??
                                        `${(bio ?? "").length} of ${BIO_MAX} characters`}
                                </p>
                            </div>
                        )}
                    />
                </Section>
            )}

            <NotificationPreferences profile={profile} onSaved={handleProfileReplaced} />
        </form>
    );
}
