"use client";

import { type MutableRefObject, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Camera, Check, Sparkles } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";
import { useLocationOptions } from "@/hooks/use-locations";

import { FieldLabel } from "@/components/property/fields/field-label";
import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    BEDROOM_OPTIONS,
    LISTING_FOR_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    propertyTypeOptions,
} from "@/constants/property";
import {
    normalizePhotoOrder,
    removeCoverPhoto,
    replaceCoverPhoto,
    type DraftPhoto,
} from "@/features/properties/property-form/cover-photo";
import {
    ChoiceField,
    CounterField,
    CurrencyField,
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    NumberField,
    SelectField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const COVER_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * Minimal create form: every field here maps to a value the create-property API
 * needs (or a value we must send so the listing is usable after save).
 *
 * API-required: visibility (set on save), transactionType ← listingFor, city.
 * Always sent with create: category/type, locality→address, area, price/rent, photo.
 */
export function QuickAdd({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const values = watch();
    // Quick add has no country / state field — it keeps the draft defaults, so
    // the city list is the cities of that default state. The full wizard step
    // is where country and state can be changed.
    const { cityOptions, citiesLoading, selectedState } = useLocationOptions({
        countryName: values.location.country,
        stateName: values.location.state,
    });
    const firstPhoto = values.media.photos[0];
    const showBhk = derived.isResidential && !derived.isPlot;
    const showSalePrice = derived.isSell;
    const showRent = derived.isRentLike && !derived.isPg;
    const [titleTouched, setTitleTouched] = useState(false);

    const [titleTouched, setTitleTouched] = useState(() =>
        Boolean(getValues("basics.title")?.trim()),
    );
    const suggestedTitle = useMemo(
        () =>
            buildBasicsSuggestedTitle({
                bedrooms: showBhk ? values.details.bedrooms : undefined,
                propertyType: values.basics.propertyType,
                locality: values.location.locality,
                city: values.location.city,
            }),
        [
            showBhk,
            values.basics.propertyType,
            values.details.bedrooms,
            values.location.city,
            values.location.locality,
        ],
    );

    // Keep the title in sync with the suggestion until the user edits it.
    useEffect(() => {
        if (titleTouched || !suggestedTitle) return;
        setValue("basics.title", suggestedTitle, { shouldDirty: true, shouldValidate: true });
    }, [setValue, suggestedTitle, titleTouched]);

    function addPhoto(file: File | undefined) {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Choose a photo smaller than 10 MB.");
            return;
        }
        const url = URL.createObjectURL(file);
        photoFilesRef.current.set(url, file);
        setValue(
            "media.photos",
            getValues("media.photos").map((photo) =>
                photo.id === photoId ? { ...photo, ...patch } : photo,
            ),
            { shouldDirty: true, shouldValidate: true },
        );
    }

    function revokePhoto(photo: DraftPhoto | null | undefined) {
        if (!photo) return;
        if (photo.url.startsWith("blob:")) {
            URL.revokeObjectURL(photo.url);
            photoFilesRef.current.delete(photo.url);
        }
        photoFilesRef.current.delete(photo.id);
    }

    async function processPhoto(photoId: string, file: File, url: string) {
        updatePhoto(photoId, { status: "processing" });
        try {
            const prepared = await preparePhotoForUpload(file);
            photoFilesRef.current.set(photoId, prepared);
            photoFilesRef.current.set(url, prepared);
            updatePhoto(photoId, { status: "queued", name: prepared.name });
        } catch {
            updatePhoto(photoId, {
                status: "error",
                errorMessage: "This photo could not be compressed on this device.",
            });
        }
    }

    function buildGalleryEntry(file: File): DraftPhoto {
        const id = createClientId("quick-photo");
        if (file.size > MAX_PHOTO_BYTES) {
            photoFilesRef.current.set(id, file);
            return {
                id,
                url: "",
                name: file.name,
                tag: "other",
                isCover: false,
                order: 0,
                alt: "",
                status: "error",
                errorMessage: "File is larger than 10 MB. Choose a smaller copy.",
            };
        }
        if (!PHOTO_TYPES.has(file.type)) {
            photoFilesRef.current.set(id, file);
            return {
                id,
                url: "",
                name: file.name,
                tag: "other",
                isCover: false,
                order: 0,
                alt: "",
                status: "error",
                errorMessage: "Use a JPG, PNG, WebP, HEIC, or HEIF photo.",
            };
        }
        const url = URL.createObjectURL(file);
        photoFilesRef.current.set(url, file);
        photoFilesRef.current.set(id, file);
        return {
            id,
            url,
            name: file.name,
            tag: "other",
            isCover: false,
            order: 0,
            alt: "",
            status: "processing",
        };
    }

    async function replaceCover(file: File | undefined) {
        if (!file) return;
        await replaceCoverPhoto({
            file,
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
            patchPhoto: (photoId, patch) => updatePhoto(photoId, patch),
        });
    }

    function removeCover() {
        removeCoverPhoto({
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
        });
    }

    function addGalleryPhotos(files: FileList | null) {
        if (!files) return;
        const current = getValues("media.photos");
        const currentCover = current.find((photo) => photo.isCover) ?? null;
        const currentGallery = current.filter((photo) => !photo.isCover);
        const accepted: DraftPhoto[] = [];
        const galleryCap = MAX_PHOTOS - (currentCover ? 1 : 0);
        for (const file of Array.from(files)) {
            if (currentGallery.length + accepted.length >= galleryCap) {
                toast.error(`You can add up to ${galleryCap} property photos.`);
                break;
            }
            accepted.push(buildGalleryEntry(file));
        }
        if (!accepted.length) return;
        commitPhotos([...(currentCover ? [currentCover] : []), ...currentGallery, ...accepted]);
        for (const photo of accepted) {
            const file = photoFilesRef.current.get(photo.id);
            if (file && photo.url) void processPhoto(photo.id, file, photo.url);
        }
    }

    function removePhotoById(photoId: string) {
        const current = getValues("media.photos");
        const removed = current.find((photo) => photo.id === photoId);
        revokePhoto(removed);
        commitPhotos(current.filter((photo) => photo.id !== photoId));
    }

    function retryPhoto(photoId: string) {
        const photo = getValues("media.photos").find((item) => item.id === photoId);
        const file = photoFilesRef.current.get(photoId);
        if (!photo || !file) {
            toast.error("Choose this photo again to retry.");
            return;
        }
        const url = photo.url || URL.createObjectURL(file);
        if (!photo.url) updatePhoto(photoId, { url });
        void processPhoto(photoId, file, url);
    }

    const hasUsableCover = coverPhoto != null && coverPhoto.status !== "error";
    const maxGallery = MAX_PHOTOS - (coverPhoto ? 1 : 0);

    return (
        <div
            className="
              grid flex-1 min-block-0
              xl:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)]
            "
        >
            <div
                className="
                  overflow-y-auto px-5 py-6 min-block-0 min-inline-0
                  sm:px-6
                "
            >
                <div className="flex flex-col gap-4">
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={3}
                    />
                    <ChoiceField
                        name="basics.category"
                        label="Category"
                        options={PROPERTY_CATEGORY_OPTIONS}
                        columns={5}
                        onValueChange={() => {
                            setValue("basics.propertyType", "", { shouldDirty: true });
                            setValue("basics.propertySubType", "", { shouldDirty: true });
                            setValue(
                                "details.commercial",
                                structuredClone(DEFAULT_PROPERTY_DRAFT.details.commercial),
                                { shouldDirty: true },
                            );
                            setValue(
                                "details.land",
                                structuredClone(DEFAULT_PROPERTY_DRAFT.details.land),
                                { shouldDirty: true },
                            );
                        }}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="basics.propertyType"
                            label="Property type"
                            options={propertyTypeOptions(values.basics.category)}
                        />
                        <SelectField
                            name="location.city"
                            label="City"
                            options={cityOptions}
                            placeholder={selectedState ? "Choose a city" : "Loading cities…"}
                            loading={citiesLoading}
                            disabled={!selectedState}
                            emptyText={citiesLoading ? "Loading cities…" : "No cities match"}
                            limit={100}
                        />
                        <TextField
                            name="location.locality"
                            label="Locality"
                            placeholder="e.g. Vesu"
                        />
                        <TextField
                            name="location.pincode"
                            label="PIN code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="395007"
                        />
                        <TextField
                            name="location.landmark"
                            label="Landmark"
                            placeholder="e.g. Near VR Mall"
                        />
                        <TextField
                            name="location.projectOrSociety"
                            label="Project or society"
                            placeholder="e.g. Happy Glorious"
                        />
                        {showBhk ? (
                            <SelectField
                                name="details.bedrooms"
                                label="BHK"
                                options={BEDROOM_OPTIONS}
                            />
                        ) : null}
                        <NumberField
                            name="area.plotArea"
                            label="Area (sq ft)"
                            min={0}
                            placeholder="e.g. 1200"
                            onValueChange={(next) => {
                                const sqft = next != null && next > 0 ? next : 0;
                                setValue("area.plotArea", next, { shouldDirty: true });
                                setValue("area.carpetArea", next, { shouldDirty: true });
                                setValue("area.areaSqft", sqft, { shouldDirty: true });
                                setValue("area.unit", "sqft", { shouldDirty: true });
                            }}
                        />
                        <TextField
                            name="basics.title"
                            label="Property title"
                            placeholder={suggestedTitle || "e.g. 3 BHK Apartment in Vesu, Surat"}
                            hint="Auto-filled from BHK, type, locality, and city. You can edit it anytime."
                            className="md:col-span-2"
                            onChange={() => setTitleTouched(true)}
                            endAction={
                                suggestedTitle ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setValue("basics.title", suggestedTitle, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            });
                                            setTitleTouched(false);
                                        }}
                                        className="
                                          gap-1.5 rounded-control px-2.5 font-semibold
                                          text-brand-text
                                          hover:bg-brand-soft hover:text-brand-text
                                        "
                                    >
                                        <Sparkles className="block-3.5 inline-3.5" aria-hidden />
                                        <span className="hidden sm:inline">
                                            Use suggested title
                                        </span>
                                        <span className="sm:hidden">Suggest</span>
                                    </Button>
                                ) : null
                            }
                        />
                        {showSalePrice ? (
                            <CurrencyField name="sale.expectedPrice" label="Expected price" />
                        ) : null}
                        {showRent ? (
                            <CurrencyField name="rent.monthlyRent" label="Monthly rent" />
                        ) : null}
                        <TextField
                            name="owner.phone"
                            label="Owner phone"
                            inputMode="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            visibility="private"
                        />
                    </div>

                    <WizardSection
                        title={
                            <>
                                <Building2
                                    className="shrink-0 text-brand block-5 inline-5"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                                Property essentials
                            </>
                        }
                        description="Listing for, category, and the fields that decide how brokers find this property."
                    >
                        <div className={FORM_STACK_CLASS}>
                            <ChoiceField
                                name="basics.listingFor"
                                label="Listing for"
                                options={LISTING_FOR_OPTIONS}
                                columns={3}
                            />
                            <ChoiceField
                                name="basics.category"
                                label="Category"
                                options={PROPERTY_CATEGORY_OPTIONS}
                                columns={5}
                                onValueChange={() => {
                                    setValue("basics.propertyType", "", { shouldDirty: true });
                                    setValue("basics.propertySubType", "", { shouldDirty: true });
                                    setValue(
                                        "details.commercial",
                                        structuredClone(DEFAULT_PROPERTY_DRAFT.details.commercial),
                                        { shouldDirty: true },
                                    );
                                    setValue(
                                        "details.land",
                                        structuredClone(DEFAULT_PROPERTY_DRAFT.details.land),
                                        { shouldDirty: true },
                                    );
                                    if (!watch("area.carpetArea") && !watch("area.plotArea")) {
                                        setValue("area.unit", "sqft", { shouldDirty: true });
                                    }
                                }}
                            />

                            <div className={FORM_GRID_CLASS}>
                                <SelectField
                                    name="basics.propertyType"
                                    label="Property type"
                                    options={propertyTypeOptions(values.basics.category)}
                                    onValueChange={() => {
                                        setValue(
                                            "details.commercial",
                                            structuredClone(
                                                DEFAULT_PROPERTY_DRAFT.details.commercial,
                                            ),
                                            { shouldDirty: true },
                                        );
                                        setValue(
                                            "details.land",
                                            structuredClone(DEFAULT_PROPERTY_DRAFT.details.land),
                                            { shouldDirty: true },
                                        );
                                    }}
                                />
                                <SelectField
                                    name="location.city"
                                    label="City"
                                    options={CITY_OPTIONS}
                                />
                                <TextField
                                    name="location.locality"
                                    label="Locality"
                                    placeholder="e.g. Vesu"
                                />
                                <TextField
                                    name="location.pincode"
                                    label="PIN code"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="395007"
                                />
                                <TextField
                                    name="location.landmark"
                                    label="Landmark"
                                    placeholder="e.g. Near VR Mall"
                                />
                                <TextField
                                    name="location.projectOrSociety"
                                    label="Project or society"
                                    placeholder="e.g. Happy Glorious"
                                />
                                <TextField
                                    name="basics.title"
                                    label="Property title"
                                    placeholder={suggestedTitle || "e.g. 3 BHK in Vesu"}
                                    className="md:col-span-2"
                                    onChange={() => setTitleTouched(true)}
                                    endAction={
                                        suggestedTitle ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setValue("basics.title", suggestedTitle, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    });
                                                    setTitleTouched(false);
                                                }}
                                                className="
                                                  gap-1.5 rounded-control px-2.5 font-semibold
                                                  text-brand-text
                                                  hover:bg-brand-soft hover:text-brand-text
                                                "
                                            >
                                                <Sparkles
                                                    className="block-3.5 inline-3.5"
                                                    aria-hidden
                                                />
                                                <span className="hidden sm:inline">
                                                    Use suggested title
                                                </span>
                                                <span className="sm:hidden">Suggest</span>
                                            </Button>
                                        ) : null
                                    }
                                />
                                {showBhk ? (
                                    <CounterField
                                        name="details.bedrooms"
                                        label="BHK"
                                        min={1}
                                        max={10}
                                        storeAsString
                                        startIcon={BedDouble}
                                    />
                                ) : null}
                                <NumberField
                                    name="area.plotArea"
                                    label="Area"
                                    min={0}
                                    step={0.01}
                                    placeholder="e.g. 1200"
                                    hint="Total area in sq ft."
                                    onValueChange={(next) => {
                                        const sqft = next != null && next > 0 ? next : 0;
                                        setValue("area.plotArea", next, { shouldDirty: true });
                                        setValue("area.carpetArea", next, { shouldDirty: true });
                                        setValue("area.areaSqft", sqft, { shouldDirty: true });
                                        setValue("area.unit", "sqft", { shouldDirty: true });
                                    }}
                                />
                                {showSalePrice ? (
                                    <CurrencyField
                                        name="sale.expectedPrice"
                                        label="Expected price"
                                        placeholder="e.g. 85,00,000"
                                    />
                                ) : null}
                                {showRent ? (
                                    <CurrencyField
                                        name="rent.monthlyRent"
                                        label="Monthly rent"
                                        placeholder="e.g. 25,000"
                                    />
                                ) : null}
                            </div>
                        </div>
                    </WizardSection>

                    <WizardSection
                        title={
                            <>
                                <Phone
                                    className="shrink-0 text-brand block-5 inline-5"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                                Owner contact
                            </>
                        }
                        description="Kept private on the listing. Used so you can reach the owner later."
                        tone="private"
                    >
                        <div className={FORM_GRID_CLASS}>
                            <TextField
                                name="owner.phone"
                                label="Owner phone"
                                inputMode="tel"
                                maxLength={10}
                                placeholder="9876543210"
                                visibility="private"
                            />
                        </div>
                    </WizardSection>
                </div>
            </div>

            <aside
                className="
                  overflow-y-auto border-bs border-border-warm px-5 py-6 min-block-0
                  sm:px-6
                  xl:border-bs-0 xl:border-s
                "
            >
                <WizardSection
                    title={
                        <>
                            <Images
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Photos
                        </>
                    }
                    description="Cover for the listing card, plus a few more so brokers recognise the property."
                >
                    <div className={FORM_STACK_CLASS}>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <ImageIcon
                                        className="shrink-0 text-brand block-4 inline-4"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    <FieldLabel path="media.cover">Cover image</FieldLabel>
                                </p>
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        hasUsableCover ? "text-brand-text" : "text-ink-muted",
                                    )}
                                >
                                    {hasUsableCover ? "Added" : "1 only"}
                                </p>
                            </div>

                            {coverPhoto ? (
                                <QuickCoverPreview
                                    photo={coverPhoto}
                                    onReplace={(file) => void replaceCover(file)}
                                    onRemove={removeCover}
                                    onRetry={() => retryPhoto(coverPhoto.id)}
                                />
                            ) : (
                                <Label
                                    htmlFor="quick-cover-upload"
                                    className="
                                      flex cursor-pointer flex-col items-center justify-center
                                      rounded-card border-2 border-dashed border-brand/35
                                      bg-brand-soft/40 px-4 py-6 text-center aspect-3/4
                                      focus-within:ring-3 focus-within:ring-ring/30
                                    "
                                >
                                    <DropzoneIcon>
                                        <ImageIcon className="block-5 inline-5" aria-hidden />
                                    </DropzoneIcon>
                                    <span className="mbs-3 text-base font-bold text-ink">
                                        Upload cover
                                    </span>
                                    <span className="mbs-1 text-sm text-ink-muted">
                                        Portrait · JPG, PNG, WebP or HEIC
                                    </span>
                                    <Input
                                        id="quick-cover-upload"
                                        type="file"
                                        accept={COVER_ACCEPT}
                                        capture="environment"
                                        className="sr-only"
                                        onChange={(event) => {
                                            void replaceCover(event.target.files?.[0]);
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                </Label>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 min-inline-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <Images
                                        className="shrink-0 text-brand block-4 inline-4"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    Other images
                                </p>
                                <p className="text-sm font-medium text-ink-muted">
                                    {galleryPhotos.length} · up to {maxGallery}
                                </p>
                            </div>

                            <Label
                                htmlFor="quick-gallery-upload"
                                className="
                                  flex cursor-pointer flex-col items-center justify-center
                                  rounded-card border-2 border-dashed border-brand/35
                                  bg-brand-soft/40 px-4 py-6 text-center min-block-28
                                  focus-within:ring-3 focus-within:ring-ring/30
                                "
                            >
                                <DropzoneIcon>
                                    <ImagePlus className="block-5 inline-5" aria-hidden />
                                </DropzoneIcon>
                                <span className="mbs-3 text-sm font-bold text-ink">
                                    Add property photos
                                </span>
                                <span className="mbs-1 text-xs text-ink-muted">
                                    Multiple allowed · up to 10 MB each
                                </span>
                                <Input
                                    id="quick-gallery-upload"
                                    type="file"
                                    multiple
                                    accept={COVER_ACCEPT}
                                    className="sr-only"
                                    onChange={(event) => {
                                        addGalleryPhotos(event.target.files);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </Label>

                            {galleryPhotos.length ? (
                                <div className="grid grid-cols-3 gap-2" role="list">
                                    {galleryPhotos.map((photo) => (
                                        <QuickGalleryThumb
                                            key={photo.id}
                                            photo={photo}
                                            onRemove={() => removePhotoById(photo.id)}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </WizardSection>
            </aside>
        </div>
    );
}

function DropzoneIcon({ children }: { children: ReactNode }) {
    return (
        <span
            className="
              flex items-center justify-center rounded-full border-2 border-dashed
              border-brand/35 bg-brand-soft/40 text-brand block-12 inline-12
            "
        >
            {children}
        </span>
    );
}

function QuickCoverPreview({
    photo,
    onReplace,
    onRemove,
    onRetry,
}: {
    photo: DraftPhoto;
    onReplace: (file: File) => void;
    onRemove: () => void;
    onRetry: () => void;
}) {
    const inputId = "quick-cover-replace";
    const hasImage = Boolean(photo.url);

    return (
        <div
            className="
              group relative overflow-hidden rounded-card border-2 border-border-warm
              bg-surface-muted aspect-3/4
            "
        >
            {hasImage ? (
                <AppImage
                    src={photo.url}
                    alt={photo.alt || photo.name || "Cover image"}
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized={
                        photo.url.startsWith("blob:") ||
                        photo.url.startsWith("http://") ||
                        photo.url.startsWith("https://")
                    }
                />
            ) : (
                <div className="flex block-full items-center justify-center px-4 text-center">
                    <p className="text-sm text-ink-muted">
                        {photo.errorMessage ?? "Cover preview unavailable"}
                    </p>
                </div>
            )}

            <Input
                id={inputId}
                type="file"
                accept={COVER_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onReplace(file);
                    event.currentTarget.value = "";
                }}
            />

            <div
                className="
                  absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/55 p-3
                  opacity-100 transition-opacity duration-160
                  md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100
                "
            >
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-0 bg-surface text-ink hover:bg-surface"
                    onClick={() => document.getElementById(inputId)?.click()}
                >
                    <RefreshCw className="block-3.5 inline-3.5" aria-hidden />
                    Replace
                </Button>
                <div className="flex items-center gap-2">
                    {photo.status === "error" ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-surface hover:bg-surface/15 hover:text-surface"
                            onClick={onRetry}
                        >
                            Retry
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-surface hover:bg-surface/15 hover:text-surface"
                        onClick={onRemove}
                    >
                        <X className="me-1 block-3.5 inline-3.5" aria-hidden />
                        Remove
                    </Button>
                </div>
            </div>
        </div>
    );
}

function QuickGalleryThumb({ photo, onRemove }: { photo: DraftPhoto; onRemove: () => void }) {
    return (
        <div
            role="listitem"
            className="
              group relative overflow-hidden rounded-control border border-border-warm
              bg-surface-muted aspect-square
            "
        >
            {photo.url ? (
                <AppImage
                    src={photo.url}
                    alt={photo.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized={
                        photo.url.startsWith("blob:") ||
                        photo.url.startsWith("http://") ||
                        photo.url.startsWith("https://")
                    }
                />
            ) : (
                <div className="flex block-full items-center justify-center p-2 text-center">
                    <p className="text-[10px] text-ink-muted">Failed</p>
                </div>
            )}
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${photo.name}`}
                onClick={onRemove}
                className="
                  absolute inset-e-1 inset-bs-1 rounded-full bg-ink/70 text-surface
                  hover:bg-ink hover:text-surface
                "
            >
                <X className="block-3 inline-3" aria-hidden />
            </Button>
        </div>
    );
}
