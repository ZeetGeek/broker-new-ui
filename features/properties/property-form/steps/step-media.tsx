"use client";

import { type MutableRefObject } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import {
    Check,
    CircleAlert,
    // FileText,
    ImagePlus,
    LoaderCircle,
    RefreshCw,
    // ShieldCheck,
    Trash2,
    // Upload,
} from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { preparePhotoForUpload } from "@/lib/media/prepare-photo";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/property/fields/field-label";
import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    FORM_GRID_CLASS,
    TextField,
    // ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

// Private documents UI temporarily commented out
// const DEFAULT_DOCUMENT_TYPE = "owner_id_proof";

const MAX_PHOTOS = 30;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

type DraftPhoto = PropertyDraftValues["media"]["photos"][number];

function normalizePhotoOrder(list: DraftPhoto[]): DraftPhoto[] {
    const cover = list.find((photo) => photo.isCover);
    const gallery = list.filter((photo) => !photo.isCover);
    return [...(cover ? [cover] : []), ...gallery].map((photo, order) => ({ ...photo, order }));
}

function isPortraitImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img.naturalHeight > img.naturalWidth);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(true);
        };
        img.src = url;
    });
}

export function StepMedia({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const photos = watch("media.photos");
    const usablePhotoCount = photos.filter((photo) => photo.status !== "error").length;
    const publishReady = usablePhotoCount >= 3;
    // Private documents UI temporarily commented out
    // const documents = watch("documents");
    const coverPhoto = photos.find((photo) => photo.isCover) ?? null;
    const galleryPhotos = photos.filter((photo) => !photo.isCover);
    const usableGalleryCount = galleryPhotos.filter((photo) => photo.status !== "error").length;
    const hasUsableCover = coverPhoto != null && coverPhoto.status !== "error";

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

    function updatePhoto(
        photoId: string,
        patch: Partial<PropertyDraftValues["media"]["photos"][number]>,
    ) {
        setValue(
            "media.photos",
            watch("media.photos").map((photo) =>
                photo.id === photoId ? { ...photo, ...patch } : photo,
            ),
            { shouldDirty: true, shouldValidate: true },
        );
    }

    function buildPhotoEntry(file: File, isCover: boolean): DraftPhoto {
        const id = createClientId("photo");
        if (file.size > MAX_PHOTO_BYTES) {
            photoFilesRef.current.set(id, file);
            return {
                id,
                url: "",
                name: file.name,
                tag: isCover ? "cover" : "other",
                isCover,
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
                tag: isCover ? "cover" : "other",
                isCover,
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
            tag: isCover ? "cover" : "other",
            isCover,
            order: 0,
            alt: "",
            status: "processing",
        };
    }

    function commitPhotos(next: DraftPhoto[]) {
        setValue("media.photos", normalizePhotoOrder(next), {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    function revokePhoto(photo: DraftPhoto | null | undefined) {
        if (!photo) return;
        if (photo.url.startsWith("blob:")) {
            URL.revokeObjectURL(photo.url);
            photoFilesRef.current.delete(photo.url);
        }
        photoFilesRef.current.delete(photo.id);
    }

    async function replaceCover(file: File | undefined) {
        if (!file) return;
        const portrait = await isPortraitImage(file);
        if (!portrait) {
            toast.error("Cover works best as a vertical photo (taller than wide).");
        }
        revokePhoto(coverPhoto);
        const entry = buildPhotoEntry(file, true);
        const gallery = photos.filter((photo) => !photo.isCover);
        commitPhotos([entry, ...gallery]);
        if (entry.url) void processPhoto(entry.id, file, entry.url);
    }

    function addGalleryPhotos(files: FileList | null) {
        if (!files) return;
        const accepted: DraftPhoto[] = [];
        const gallery = photos.filter((photo) => !photo.isCover);
        const cover = photos.find((photo) => photo.isCover);
        const maxGallery = MAX_PHOTOS - (cover ? 1 : 0);
        for (const file of Array.from(files)) {
            if (gallery.length + accepted.length >= maxGallery) {
                toast.error(`You can add up to ${maxGallery} property photos.`);
                break;
            }
            accepted.push(buildPhotoEntry(file, false));
        }
        if (!accepted.length) return;
        commitPhotos([...(cover ? [cover] : []), ...gallery, ...accepted]);
        for (const photo of accepted) {
            const file = photoFilesRef.current.get(photo.id);
            if (file && photo.url) void processPhoto(photo.id, file, photo.url);
        }
    }

    function removePhotoById(photoId: string) {
        const removed = photos.find((photo) => photo.id === photoId);
        revokePhoto(removed);
        commitPhotos(photos.filter((photo) => photo.id !== photoId));
    }

    function retryPhoto(photoId: string) {
        const photo = photos.find((item) => item.id === photoId);
        const file = photoFilesRef.current.get(photoId);
        if (!photo || !file) {
            toast.error("Choose this photo again to retry.");
            return;
        }
        if (file.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.has(file.type)) {
            toast.error(
                file.size > MAX_PHOTO_BYTES
                    ? "This photo is still larger than 10 MB."
                    : "Use a JPG, PNG, WebP, HEIC, or HEIF photo.",
            );
            return;
        }
        const url = photo.url || URL.createObjectURL(file);
        if (!photo.url) updatePhoto(photoId, { url });
        void processPhoto(photoId, file, url);
    }

    /*
    function addDocument(file: File | undefined) {
        if (!file) return;
        setValue(
            "documents",
            [
                ...documents,
                {
                    id: createClientId("document"),
                    type: DEFAULT_DOCUMENT_TYPE,
                    fileName: file.name,
                    uploadedOn: new Date().toISOString(),
                    verified: false,
                    verifiedBy: "",
                    expiryDate: "",
                    notes: "",
                },
            ],
            { shouldDirty: true },
        );
    }
    */

    return (
        <div className="flex flex-col gap-8">
            <WizardSection
                title="Property photos"
                description="Upload one vertical cover for the listing card, then add property photos. Need 3 usable photos total to publish."
            >
                <div className="flex flex-col gap-4">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-ink">Cover image</p>
                            <p
                                className={cn(
                                    "text-xs font-medium",
                                    hasUsableCover ? "text-brand-text" : "text-ink-muted",
                                )}
                            >
                                {hasUsableCover ? "Added" : "Vertical photo · 1 only"}
                            </p>
                        </div>
                        {coverPhoto ? (
                            <PhotoPreviewCard
                                photo={coverPhoto}
                                aspectClass="aspect-3/4 max-inline-56"
                                onRemove={() => removePhotoById(coverPhoto.id)}
                                onRetry={() => retryPhoto(coverPhoto.id)}
                            />
                        ) : (
                            <Label
                                htmlFor="property-cover-upload"
                                className="
                                  flex cursor-pointer flex-col items-center justify-center
                                  rounded-card border-2 border-dashed border-brand/35
                                  bg-brand-soft/30 px-6 py-8 text-center aspect-3/4 max-inline-56
                                  focus-within:ring-3 focus-within:ring-ring/30
                                "
                            >
                                <span
                                    className="
                                      flex items-center justify-center rounded-full bg-brand
                                      text-surface block-12 inline-12
                                    "
                                >
                                    <ImagePlus className="block-5 inline-5" aria-hidden />
                                </span>
                                <span className="mbs-4 text-base font-bold text-ink">
                                    Upload cover
                                </span>
                                <span className="mbs-1 text-sm text-ink-muted">
                                    Portrait / vertical · JPG, PNG, WebP or HEIC · up to 10 MB
                                </span>
                                <Input
                                    id="property-cover-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                    className="sr-only"
                                    onChange={(event) => {
                                        void replaceCover(event.target.files?.[0]);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </Label>
                        )}
                        {coverPhoto ? (
                            <Label
                                htmlFor="property-cover-replace"
                                className="
                                  inline-flex cursor-pointer items-center gap-2 text-sm
                                  font-semibold text-brand hover:text-brand-text
                                  focus-within:ring-3 focus-within:ring-ring/30
                                "
                            >
                                Replace cover
                                <Input
                                    id="property-cover-replace"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                    className="sr-only"
                                    onChange={(event) => {
                                        void replaceCover(event.target.files?.[0]);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </Label>
                        ) : null}
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-ink">
                                <FieldLabel path="media.photos">Property images</FieldLabel>
                            </p>
                            <p
                                className={cn(
                                    "text-xs font-medium",
                                    usableGalleryCount >= 2 ? "text-brand-text" : "text-ink-muted",
                                )}
                            >
                                {usableGalleryCount} added · up to{" "}
                                {MAX_PHOTOS - (coverPhoto ? 1 : 0)}
                            </p>
                        </div>
                        <Label
                            htmlFor="property-gallery-upload"
                            className="
                              flex cursor-pointer flex-col items-center justify-center rounded-card
                              border-2 border-dashed border-brand/35 bg-brand-soft/30 px-6 py-8
                              text-center min-block-36
                              focus-within:ring-3 focus-within:ring-ring/30
                            "
                        >
                            <span
                                className="
                                  flex items-center justify-center rounded-full bg-brand
                                  text-surface block-12 inline-12
                                "
                            >
                                <ImagePlus className="block-5 inline-5" aria-hidden />
                            </span>
                            <span className="mbs-4 text-base font-bold text-ink">
                                Add property photos
                            </span>
                            <span className="mbs-1 text-sm text-ink-muted">
                                Multiple allowed · JPG, PNG, WebP or HEIC · up to 10 MB each
                            </span>
                            <Input
                                id="property-gallery-upload"
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                className="sr-only"
                                onChange={(event) => {
                                    addGalleryPhotos(event.target.files);
                                    event.currentTarget.value = "";
                                }}
                            />
                        </Label>

                        {galleryPhotos.length ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {galleryPhotos.map((photo) => (
                                    <PhotoPreviewCard
                                        key={photo.id}
                                        photo={photo}
                                        aspectClass="aspect-4/3"
                                        onRemove={() => removePhotoById(photo.id)}
                                        onRetry={() => retryPhoto(photo.id)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mbs-4 flex items-center justify-between gap-4">
                    <p
                        className={cn(
                            "text-sm font-semibold",
                            publishReady ? "text-brand-text" : "text-ink-muted",
                        )}
                    >
                        {publishReady ? (
                            <Check className="me-1.5 inline block-4 inline-4" aria-hidden />
                        ) : null}
                        {usablePhotoCount}/3 minimum · {photos.length}/{MAX_PHOTOS} total
                    </p>
                    <p className="text-xs text-ink-muted">
                        Photos stay queued locally until the current API upload runs.
                    </p>
                </div>
            </WizardSection>

            <WizardSection
                title="Video and virtual tour"
                description="Optional links for buyers. Paste a hosted URL — no file upload here."
            >
                <div className={FORM_GRID_CLASS}>
                    <TextField
                        name="media.videoUrl"
                        label="YouTube or Vimeo link"
                        type="url"
                        placeholder="https://youtube.com/… or https://vimeo.com/…"
                    />
                    <TextField
                        name="media.virtualTourUrl"
                        label="Virtual tour link"
                        type="url"
                        placeholder="Matterport or 360° tour"
                    />
                </div>
            </WizardSection>

            {/* Private documents UI temporarily commented out (kept for restore).
            <WizardSection
                title="Private documents"
                description="Legal and owner documents never appear on the public listing."
                tone="private"
            >
                <div
                    className="
                      mbe-5 overflow-hidden rounded-control border border-border-warm bg-surface
                    "
                >
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                            <p className="text-sm font-bold text-ink">Document checklist</p>
                            <p className="text-xs text-ink-muted">
                                {documents.length} document{documents.length === 1 ? "" : "s"} added
                            </p>
                        </div>
                        <ShieldCheck className="text-brand block-5 inline-5" aria-hidden />
                    </div>
                    <div className="bg-surface-muted block-2">
                        <div
                            className="bg-brand transition-[width] duration-160 block-full"
                            style={{ width: `${Math.min(100, documents.length * 20)}%` }}
                        />
                    </div>
                </div>
                <Label
                    htmlFor="property-document-upload"
                    className="
                      flex cursor-pointer items-center justify-center gap-2 rounded-control border
                      border-dashed border-brand/35 bg-surface px-4 text-sm font-semibold
                      text-brand-text block-control-xl
                      focus-within:ring-3 focus-within:ring-ring/30
                    "
                >
                    <Upload className="block-4 inline-4" aria-hidden /> Upload document
                    <Input
                        id="property-document-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="sr-only"
                        onChange={(event) => {
                            addDocument(event.target.files?.[0]);
                            event.currentTarget.value = "";
                        }}
                    />
                </Label>
                {documents.length ? (
                    <div className="mbs-4 space-y-3">
                        {documents.map((document, index) => (
                            <div
                                key={document.id}
                                className="rounded-control border border-border-warm bg-surface p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex gap-3 min-inline-0">
                                        <FileText
                                            className="mbs-0.5 shrink-0 text-brand block-5 inline-5"
                                            aria-hidden
                                        />
                                        <div className="min-inline-0">
                                            <p className="truncate text-sm font-bold text-ink">
                                                {document.fileName}
                                            </p>
                                            <p className="text-xs text-ink-muted">
                                                Private · broker only
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-md"
                                        aria-label={`Remove ${document.fileName}`}
                                        onClick={() =>
                                            setValue(
                                                "documents",
                                                documents.filter(
                                                    (_, itemIndex) => itemIndex !== index,
                                                ),
                                                { shouldDirty: true },
                                            )
                                        }
                                        className="
                                          flex items-center justify-center rounded-control
                                          text-danger block-10 inline-10
                                          hover:bg-danger-soft
                                          focus-visible:ring-3 focus-visible:ring-danger/20
                                        "
                                    >
                                        <Trash2 className="block-4 inline-4" />
                                    </Button>
                                </div>
                                <div className="mbs-4 grid gap-4 sm:grid-cols-2">
                                    <ToggleField
                                        name={`documents.${index}.verified`}
                                        label="Verified"
                                        visibility="private"
                                    />
                                    <TextField
                                        name={`documents.${index}.expiryDate`}
                                        label="Expiry date"
                                        type="date"
                                        visibility="private"
                                    />
                                    <TextField
                                        name={`documents.${index}.verifiedBy`}
                                        label="Verified by"
                                        visibility="private"
                                    />
                                    <TextField
                                        name={`documents.${index}.notes`}
                                        label="Notes"
                                        visibility="private"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </WizardSection>
            */}
        </div>
    );
}

function PhotoPreviewCard({
    photo,
    aspectClass,
    onRemove,
    onRetry,
}: {
    photo: DraftPhoto;
    aspectClass: string;
    onRemove: () => void;
    onRetry: () => void;
}) {
    return (
        <article
            className="
              overflow-hidden rounded-card border border-border-warm bg-surface
            "
        >
            <div className={cn("relative bg-surface-muted", aspectClass)}>
                {photo.url ? (
                    <AppImage
                        src={photo.url}
                        alt={photo.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                    />
                ) : (
                    <div
                        className="
                          flex flex-col items-center justify-center gap-2 px-4 text-center
                          block-full
                        "
                    >
                        <CircleAlert className="text-danger block-6 inline-6" aria-hidden />
                        <p className="line-clamp-2 text-xs font-semibold text-ink">{photo.name}</p>
                    </div>
                )}
                <span
                    className={cn(
                        `
                          absolute inset-e-3 inset-be-3 inline-flex items-center gap-1
                          rounded-control px-2.5 py-1.5 text-xs font-semibold
                        `,
                        photo.status === "error"
                            ? "bg-danger-soft text-danger"
                            : "bg-brand-ink text-surface",
                    )}
                >
                    {photo.status === "processing" ? (
                        <LoaderCircle
                            className="animate-spin block-3.5 inline-3.5"
                            aria-hidden
                        />
                    ) : photo.status === "error" ? (
                        <CircleAlert className="block-3.5 inline-3.5" aria-hidden />
                    ) : (
                        <Check className="block-3.5 inline-3.5" aria-hidden />
                    )}
                    {photo.status === "processing"
                        ? "Compressing"
                        : photo.status === "error"
                          ? "Needs attention"
                          : photo.status === "queued"
                            ? "Queued"
                            : "Ready"}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-md"
                    aria-label={`Remove ${photo.name}`}
                    onClick={onRemove}
                    className="
                      absolute inset-e-3 inset-bs-3 flex items-center justify-center rounded-full
                      bg-surface text-danger shadow-sm block-10 inline-10
                      focus-visible:ring-3 focus-visible:ring-danger/20
                    "
                >
                    <Trash2 className="block-4 inline-4" />
                </Button>
            </div>
            {photo.status === "error" ? (
                <div className="space-y-2 p-3">
                    <div
                        className="
                          rounded-control bg-danger-soft px-3 py-2 text-xs/5 text-danger
                        "
                    >
                        {photo.errorMessage ??
                            "This format could not be prepared. Retry or choose another file."}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        <RefreshCw aria-hidden /> Retry
                    </Button>
                </div>
            ) : null}
        </article>
    );
}
