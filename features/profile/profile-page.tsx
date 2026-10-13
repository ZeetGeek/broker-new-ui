"use client";

import {
    type ChangeEvent,
    type FocusEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useState,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    Award,
    BadgeCheck,
    Briefcase,
    Building2,
    FileText,
    Globe2,
    Home,
    Landmark,
    Link2,
    type LucideIcon,
    Mail,
    MapPinned,
    MapPin,
    Phone,
    Receipt,
    Tags,
    UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

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

/**
 * Same section chrome as property-form `WizardSection`: brand icon + title,
 * hairline bottom separator, no coloured panel behind the block.
 */
function Section({
    title,
    description,
    icon: Icon,
    children,
}: {
    title: string;
    description?: string;
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <section className="border-be border-border-warm/80 pbe-8 last:border-be-0 last:pbe-0">
            <div className="mbe-4 flex items-start justify-between gap-4">
                <div>
                    <h2
                        className="
                          flex items-center gap-2.5 font-display text-xl font-semibold
                          tracking-[-0.02em] text-ink
                        "
                    >
                        <Icon
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        {title}
                    </h2>
                    {description ? (
                        <p className="mbs-1 text-sm/6 text-ink-muted max-inline-2xl">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="flex flex-col gap-4">{children}</div>
        </section>
    );
}

/** Matches property-form TextAreaField — same height language as Input size="lg". */
const PROFILE_TEXTAREA_CLASS = `
  field-sizing-fixed resize-y rounded-control border-2 border-border-warm bg-surface
  px-4 py-3 text-[15px]/6 text-ink shadow-xs outline-none min-block-28
  placeholder:text-ink-subtle
  hover:border-ink-subtle
  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
  aria-invalid:border-danger-mid
`;

function BioField({
    value,
    onChange,
    onBlur,
    name,
    placeholder,
    errorMessage,
    charCount,
}: {
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
    name: string;
    placeholder: string;
    errorMessage?: string;
    charCount: string;
}) {
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <FieldLabel htmlFor="profile-bio">About you</FieldLabel>
            <div className="relative">
                <FileText
                    aria-hidden
                    strokeWidth={1.75}
                    className="
                      pointer-events-none absolute inset-s-3.5 inset-bs-3.5 z-10 text-ink-muted
                      block-4 inline-4
                    "
                />
                <Textarea
                    id="profile-bio"
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    rows={4}
                    placeholder={placeholder}
                    aria-invalid={Boolean(errorMessage) || undefined}
                    aria-describedby="profile-bio-help"
                    className={cn(PROFILE_TEXTAREA_CLASS, "ps-11")}
                />
            </div>
            <p
                id="profile-bio-help"
                className={errorMessage ? "body-xs text-danger" : "body-xs tabular text-ink-subtle"}
            >
                {errorMessage ?? charCount}
            </p>
        </div>
    );
}

function publicSlugHelper(
    value: string,
    savedSlug: string | null | undefined,
    publicProfileUrl: string | null | undefined,
): string {
    if (value && publicProfileUrl && value === (savedSlug ?? "")) return publicProfileUrl;
    if (!value)
        return "The public address brokers can share. Lowercase letters, numbers and hyphens.";
    return "Lowercase letters, numbers and hyphens.";
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
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
        publicSlug: owner
            ? (profile.owner?.publicSlug ?? profile.qr?.publicSlug ?? "")
            : (profile.broker?.publicSlug ?? profile.qr?.publicSlug ?? ""),
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

    // Cheap phones switch apps mid-edit. Warn before the tab closes on a dirty form.
    useEffect(() => {
        if (!isDirty) return;

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [isDirty]);

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
                    payload.publicSlug = values.publicSlug.trim();
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 lg:gap-5">
            <header className="flex flex-wrap items-center justify-between gap-3 text-start">
                <h1 className="h3 min-inline-0">
                    <span className="text-ink">{profile?.fullName?.trim() || "Your profile"}.</span>{" "}
                    <span className="text-ink-muted">
                        {ownerAccount ? "This is what brokers see." : "This is what owners see."}
                    </span>
                </h1>

                {/* Header Save on desktop. Mobile uses the sticky bar when dirty. */}
                <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    loading={isSubmitting}
                    disabled={!isDirty}
                    className="max-md:hidden"
                >
                    {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
            </header>

            {/* Property-form layout: elevated form panel + sticky glance rail. */}
            <div
                className="
                  grid items-start gap-5
                  lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6
                  xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8
                "
            >
                <div
                    className="
                      flex flex-col gap-0 rounded-card border border-border-warm bg-surface p-5
                      shadow-sm
                      sm:p-6
                      xl:p-7
                      order-2 lg:order-1
                    "
                >
                    {submitError ? (
                        <p
                            role="alert"
                            className="
                              body-sm rounded-inner border border-danger/25 bg-danger-soft px-3
                              py-2.5 text-danger
                            "
                        >
                            {submitError}
                        </p>
                    ) : null}

                    <ProfilePhotoField
                        profile={profile}
                        isOwner={ownerAccount}
                        onUploaded={handleProfileReplaced}
                    />

                    <Section
                        title="Your details"
                        icon={UserRound}
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-name"
                                            size="lg"
                                            autoComplete="name"
                                            startIcon={UserRound}
                                            errorText={fieldState.error?.message}
                                        />
                                    </div>
                                )}
                            />

                            <div className="flex flex-col gap-2 min-inline-0">
                                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                                <Input
                                    id="profile-email"
                                    size="lg"
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-phone">
                                            Mobile number
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-phone"
                                            size="lg"
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-city">City</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-city"
                                            size="lg"
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-country">Country</FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-country"
                                            size="lg"
                                            autoComplete="country-name"
                                            startIcon={Globe2}
                                            errorText={fieldState.error?.message}
                                        />
                                    </div>
                                )}
                            />

                            <Controller
                                name="orgName"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-org">
                                            {ownerAccount ? "Organization" : "Agency"}
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-org"
                                            size="lg"
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
                            icon={Home}
                            description="Brokers use this to decide which listings to bring you."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Controller
                                    name="companyName"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-company">
                                                Company name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-company"
                                                size="lg"
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
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-gstin">GSTIN</FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-gstin"
                                                size="lg"
                                                startIcon={Receipt}
                                                placeholder="22AAAAA0000A1Z5"
                                                errorText={fieldState.error?.message}
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <Controller
                                name="publicSlug"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-slug">
                                            Your public page
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-slug"
                                            size="lg"
                                            startIcon={Link2}
                                            placeholder="desai-estates"
                                            errorText={fieldState.error?.message}
                                            helperText={publicSlugHelper(
                                                field.value,
                                                profile?.owner?.publicSlug,
                                                profile?.qr?.publicProfileUrl,
                                            )}
                                        />
                                    </div>
                                )}
                            />

                            <Controller
                                name="preferredCities"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-preferred-cities">
                                            Preferred cities
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-preferred-cities"
                                            size="lg"
                                            startIcon={MapPin}
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-preferred-localities">
                                            Preferred localities
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-preferred-localities"
                                            size="lg"
                                            startIcon={MapPinned}
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
                                    <BioField
                                        name={field.name}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="What kind of properties you look for, and why."
                                        errorMessage={fieldState.error?.message}
                                        charCount={`${(bio ?? "").length} of ${BIO_MAX} characters`}
                                    />
                                )}
                            />
                        </Section>
                    ) : (
                        <Section
                            title="Your work"
                            icon={Briefcase}
                            description="Owners read this before they accept a request. It is the strongest part of your profile."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Controller
                                    name="experienceYears"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-experience">
                                                Years of experience
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-experience"
                                                size="lg"
                                                startIcon={Award}
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
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-rera">
                                                RERA number
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-rera"
                                                size="lg"
                                                startIcon={BadgeCheck}
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
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-rera-state">
                                                RERA state
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-rera-state"
                                                size="lg"
                                                startIcon={Landmark}
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
                                        <div className="flex flex-col gap-2 min-inline-0">
                                            <FieldLabel htmlFor="profile-slug">
                                                Your public page
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="profile-slug"
                                                size="lg"
                                                startIcon={Link2}
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-areas">
                                            Areas you work
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-areas"
                                            size="lg"
                                            startIcon={MapPinned}
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
                                    <div className="flex flex-col gap-2 min-inline-0">
                                        <FieldLabel htmlFor="profile-specializations">
                                            What you deal in
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="profile-specializations"
                                            size="lg"
                                            startIcon={Tags}
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
                                    <BioField
                                        name={field.name}
                                        value={field.value}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="Two lines on what you know that other brokers do not."
                                        errorMessage={fieldState.error?.message}
                                        charCount={`${(bio ?? "").length} of ${BIO_MAX} characters`}
                                    />
                                )}
                            />
                        </Section>
                    )}

                    <NotificationPreferences profile={profile} onSaved={handleProfileReplaced} />
                </div>

                <aside className="order-1 lg:sticky lg:inset-bs-24 lg:order-2">
                    <ProfileStats profile={profile} layout="stack" />
                </aside>
            </div>

            {/* Sits above the portal bottom nav. lg uses the header Save. */}
            {isDirty ? (
                <div
                    className="
                      fixed inset-x-0 z-30 border-bs border-border-warm bg-surface/95 p-3
                      shadow-md backdrop-blur-sm
                      inset-be-[calc(4.75rem+env(safe-area-inset-bottom))]
                      md:hidden
                    "
                >
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        loading={isSubmitting}
                        disabled={!isDirty}
                        className="w-full"
                    >
                        {isSubmitting ? "Saving…" : "Save changes"}
                    </Button>
                </div>
            ) : null}

            {/* Clearance so the last fields are not buried under the sticky Save. */}
            {isDirty ? <div className="block-16 md:hidden" aria-hidden /> : null}
        </form>
    );
}
