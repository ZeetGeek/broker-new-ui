"use client";

import { type MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import {
    ImageIcon,
    ImagePlus,
    Images,
    MapPin,
    RefreshCw,
    Ruler,
    Sparkles,
    Tag,
    Upload,
    X,
} from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import { preparePhotoForUpload } from "@/lib/media/prepare-photo";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";
import { useLocationOptions } from "@/hooks/use-locations";

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
    CurrencyField,
    FORM_GRID_CLASS,
    LocalityField,
    NumberField,
    SelectField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

const MAX_PHOTOS = 30;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * Minimal create form: every field here maps to a value the create-property API
 * needs (or a value we must send so the listing is usable after save).
 */
export function QuickAdd({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue, getValues, formState } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const values = watch();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { cityOptions, citiesLoading, selectedState, selectedCity } = useLocationOptions({
        countryName: values.location.country,
        stateName: values.location.state,
        cityName: values.location.city,
    });
    const photos = values.media.photos;
    const cover = photos.find((photo) => photo.isCover) ?? null;
    const galleryPhotos = photos.filter((photo) => !photo.isCover);
    const showBhk = derived.isResidential && !derived.isPlot;
    const showSalePrice = derived.isSell;
    const showRent = derived.isRentLike && !derived.isPg;
    const maxGallery = MAX_PHOTOS - (cover ? 1 : 0);

    const coverError =
        typeof formState.errors.media === "object" &&
        formState.errors.media &&
        "cover" in formState.errors.media
            ? String(
                  (formState.errors.media as { cover?: { message?: string } }).cover?.message ?? "",
              )
            : "";

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

    useEffect(() => {
        if (titleTouched || !suggestedTitle) return;
        setValue("basics.title", suggestedTitle, { shouldDirty: true, shouldValidate: true });
    }, [setValue, suggestedTitle, titleTouched]);

    function commitPhotos(next: DraftPhoto[]) {
        setValue("media.photos", normalizePhotoOrder(next), {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    function updatePhoto(photoId: string, patch: Partial<DraftPhoto>) {
        setValue(
            "media.photos",
            getValues("media.photos").map((photo) =>
                photo.id === photoId ? { ...photo, ...patch } : photo,
            ),
            { shouldDirty: true, shouldValidate: true },
        );
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
        const id = createClientId("photo");
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

    async function handleCoverFile(file: File | undefined) {
        if (!file) return;
        await replaceCoverPhoto({
            file,
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
            patchPhoto: updatePhoto,
        });
    }

    function handleRemoveCover() {
        removeCoverPhoto({
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
        });
    }

    function addGalleryPhotos(files: FileList | null) {
        if (!files) return;
        const current = getValues("media.photos");
        const accepted: DraftPhoto[] = [];
        const gallery = current.filter((photo) => !photo.isCover);
        const currentCover = current.find((photo) => photo.isCover);
        const galleryCap = MAX_PHOTOS - (currentCover ? 1 : 0);
        for (const file of Array.from(files)) {
            if (gallery.length + accepted.length >= galleryCap) {
                toast.error(`You can add up to ${galleryCap} property photos.`);
                break;
            }
            accepted.push(buildGalleryEntry(file));
        }
        if (!accepted.length) return;
        commitPhotos([...(currentCover ? [currentCover] : []), ...gallery, ...accepted]);
        for (const photo of accepted) {
            const file = photoFilesRef.current.get(photo.id);
            if (file && photo.url) void processPhoto(photo.id, file, photo.url);
        }
    }

    function removeGalleryPhoto(photoId: string) {
        const current = getValues("media.photos");
        const removed = current.find((photo) => photo.id === photoId);
        if (removed?.url.startsWith("blob:")) {
            URL.revokeObjectURL(removed.url);
            photoFilesRef.current.delete(removed.url);
        }
        photoFilesRef.current.delete(photoId);
        commitPhotos(current.filter((photo) => photo.id !== photoId));
    }

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-1.5">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
                    Quick add
                </h2>
                <p className="text-sm/6 text-ink-muted max-inline-3xl">
                    Capture the essentials now. Save as a draft, then finish the rest in Full
                    details when you have time.
                </p>
            </header>

            <WizardSection
                title={
                    <>
                        <Tag
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Deal type
                    </>
                }
                description="What kind of listing is this?"
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
                        {showBhk ? (
                            <SelectField
                                name="details.bedrooms"
                                label="BHK"
                                options={BEDROOM_OPTIONS}
                            />
                        ) : null}
                    </div>
                </div>
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <MapPin
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Location
                    </>
                }
                description="Where buyers will find this property."
            >
                <div className={FORM_GRID_CLASS}>
                    <SelectField
                        name="location.city"
                        label="City"
                        options={cityOptions}
                        placeholder={selectedState ? "Choose a city" : "Loading cities…"}
                        loading={citiesLoading}
                        disabled={!selectedState}
                        emptyText={citiesLoading ? "Loading cities…" : "No cities match"}
                        limit={100}
                        onValueChange={() => {
                            // Localities are per city.
                            setValue("location.locality", "", { shouldDirty: true });
                        }}
                    />
                    <LocalityField
                        name="location.locality"
                        label="Locality"
                        cityId={selectedCity?.id}
                        placeholder="Search a locality, e.g. Vesu"
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
                        className="md:col-span-2"
                    />
                </div>
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <Ruler
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Size, price & title
                    </>
                }
                description="Enough for a usable draft listing."
            >
                <div className={FORM_GRID_CLASS}>
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
                                      gap-1.5 rounded-control px-2.5 font-semibold text-brand-text
                                      hover:bg-brand-soft hover:text-brand-text
                                    "
                                >
                                    <Sparkles className="block-3.5 inline-3.5" aria-hidden />
                                    <span className="hidden sm:inline">Use suggested title</span>
                                    <span className="sm:hidden">Suggest</span>
                                </Button>
                            ) : null
                        }
                    />
                </div>
            </WizardSection>

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
                description="Add a cover for the listing card, then optional property photos. Cover is required to save."
            >
                <div className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-stretch">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <ImageIcon
                                        className="shrink-0 text-brand block-4 inline-4"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    Cover image
                                </p>
                                <p
                                    className={cn(
                                        "text-xs font-medium",
                                        cover ? "text-brand-text" : "text-ink-muted",
                                    )}
                                >
                                    {cover ? "Added" : "Required"}
                                </p>
                            </div>
                            <input
                                ref={coverInputRef}
                                id="quick-cover-upload"
                                type="file"
                                accept={PHOTO_ACCEPT}
                                capture="environment"
                                className="sr-only"
                                onChange={(event) => {
                                    void handleCoverFile(event.target.files?.[0]);
                                    event.currentTarget.value = "";
                                }}
                            />
                            {cover?.url ? (
                                <div className="group relative flex-1 overflow-hidden rounded-card bg-surface-muted aspect-3/4 min-block-48">
                                    <AppImage
                                        src={cover.url}
                                        alt={cover.alt || "Cover photo"}
                                        fill
                                        sizes="280px"
                                        className="object-cover"
                                        unoptimized={
                                            cover.url.startsWith("blob:") ||
                                            cover.url.startsWith("http")
                                        }
                                    />
                                    <div
                                        className="
                                          absolute inset-0 flex flex-col items-center justify-center
                                          gap-2 bg-ink/50 p-3 opacity-100
                                          transition-opacity duration-160
                                          md:opacity-0 md:group-hover:opacity-100
                                          md:group-focus-within:opacity-100
                                        "
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 border-0 bg-surface text-ink"
                                            onClick={() => coverInputRef.current?.click()}
                                        >
                                            <RefreshCw
                                                className="block-3.5 inline-3.5"
                                                aria-hidden
                                            />
                                            Replace
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 text-surface hover:bg-surface/15"
                                            onClick={handleRemoveCover}
                                        >
                                            <X className="block-3.5 inline-3.5" aria-hidden />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => coverInputRef.current?.click()}
                                    className={cn(
                                        `
                                          flex flex-1 cursor-pointer flex-col items-center
                                          justify-center rounded-card border-2 border-dashed
                                          bg-brand-soft/40 px-4 py-6 text-center aspect-3/4
                                          min-block-48
                                          transition-colors duration-160
                                          hover:border-brand/50 hover:bg-brand-soft/55
                                          focus-visible:ring-3 focus-visible:ring-ring/30
                                          focus-visible:outline-none
                                        `,
                                        coverError ? "border-danger/50" : "border-brand/35",
                                    )}
                                >
                                    <span
                                        className="
                                          flex items-center justify-center rounded-full border-2
                                          border-dashed border-brand/35 bg-surface text-brand
                                          block-12 inline-12
                                        "
                                    >
                                        <Upload className="block-5 inline-5" aria-hidden />
                                    </span>
                                    <span className="mbs-3 text-sm font-bold text-ink">
                                        Upload cover
                                    </span>
                                    <span className="mbs-1 text-xs text-ink-muted">
                                        Portrait · up to 10 MB
                                    </span>
                                </button>
                            )}
                            {coverError ? (
                                <p role="alert" className="text-sm text-danger">
                                    {coverError}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-2 min-inline-0">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <Images
                                        className="shrink-0 text-brand block-4 inline-4"
                                        strokeWidth={1.75}
                                        aria-hidden
                                    />
                                    Property photos
                                </p>
                                <p className="text-xs font-medium text-ink-muted">
                                    {galleryPhotos.length} added · up to {maxGallery}
                                </p>
                            </div>
                            <Label
                                htmlFor="quick-gallery-upload"
                                className="
                                  flex flex-1 cursor-pointer flex-col items-center justify-center
                                  rounded-card border-2 border-dashed border-brand/35
                                  bg-brand-soft/40 px-6 py-8 text-center min-block-48
                                  transition-colors duration-160
                                  hover:border-brand/50 hover:bg-brand-soft/55
                                  focus-within:ring-3 focus-within:ring-ring/30
                                "
                            >
                                <span
                                    className="
                                      flex items-center justify-center rounded-full border-2
                                      border-dashed border-brand/35 bg-surface text-brand block-12
                                      inline-12
                                    "
                                >
                                    <ImagePlus className="block-5 inline-5" aria-hidden />
                                </span>
                                <span className="mbs-3 text-sm font-bold text-ink">
                                    Add property photos
                                </span>
                                <span className="mbs-1 text-xs text-ink-muted">
                                    Optional for draft · multiple allowed · up to 10 MB each
                                </span>
                                <Input
                                    id="quick-gallery-upload"
                                    type="file"
                                    multiple
                                    accept={PHOTO_ACCEPT}
                                    className="sr-only"
                                    onChange={(event) => {
                                        addGalleryPhotos(event.target.files);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </Label>
                        </div>
                    </div>

                    {galleryPhotos.length ? (
                        <div
                            className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                            role="list"
                            aria-label="Property photos"
                        >
                            {galleryPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    role="listitem"
                                    className="
                                      group relative overflow-hidden rounded-control border
                                      border-border-warm bg-surface-muted aspect-square
                                    "
                                >
                                    {photo.url ? (
                                        <AppImage
                                            src={photo.url}
                                            alt={photo.alt || photo.name || "Property photo"}
                                            fill
                                            sizes="200px"
                                            className="object-cover"
                                            unoptimized={
                                                photo.url.startsWith("blob:") ||
                                                photo.url.startsWith("http")
                                            }
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center block-full text-ink-muted">
                                            <ImageIcon className="block-6 inline-6" aria-hidden />
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Remove ${photo.name || "photo"}`}
                                        onClick={() => removeGalleryPhoto(photo.id)}
                                        className="
                                          absolute inset-e-2 inset-bs-2 rounded-control bg-surface
                                          text-ink shadow-sm
                                          hover:bg-surface
                                        "
                                    >
                                        <X className="block-3.5 inline-3.5" aria-hidden />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </WizardSection>
        </div>
    );
}
