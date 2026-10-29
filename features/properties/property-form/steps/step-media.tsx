"use client";

import { type MutableRefObject, type ReactNode, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { createClientId } from "@/lib/client-id";
import {
    hasNonEmptyUrl,
    type MediaEmbed,
    parseTourEmbed,
    parseVideoEmbed,
} from "@/lib/media/embed-url";
import { preparePhotoForUpload } from "@/lib/media/prepare-photo";
import {
    isUsablePropertyPhoto,
    MAX_PROPERTY_PHOTOS,
    PROPERTY_COVER_SIZE_GUIDANCE,
} from "@/lib/properties/form-media";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { FieldLabel } from "@/components/property/fields/field-label";
import { AppImage } from "@/components/shared/app-image";
import {
    Check,
    CircleAlert,
    ExternalLink,
    ImageIcon,
    ImagePlus,
    RefreshCw,
    Video,
    View,
    X,
} from "@/components/shared/icons";
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    type DraftPhoto,
    normalizePhotoOrder,
    replaceCoverPhoto,
} from "@/features/properties/property-form/cover-photo";
import {
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

const MAX_PHOTOS = MAX_PROPERTY_PHOTOS;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const COVER_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

function DropzoneIcon({ children }: { children: ReactNode }) {
    return (
        <span
            className="
              flex items-center justify-center rounded-full border-2 border-dashed border-brand/35
              bg-brand-soft/40 text-brand block-12 inline-12
            "
        >
            {children}
        </span>
    );
}

export function StepMedia({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue, formState } = useFormContext<PropertyDraftValues>();
    const photos = watch("media.photos");
    const videoUrl = watch("media.videoUrl") ?? "";
    const virtualTourUrl = watch("media.virtualTourUrl") ?? "";
    const videoEmbed = useMemo(() => parseVideoEmbed(videoUrl), [videoUrl]);
    const tourEmbed = useMemo(() => parseTourEmbed(virtualTourUrl), [virtualTourUrl]);
    const coverPhoto = photos.find((photo) => photo.isCover) ?? null;
    const galleryPhotos = photos.filter((photo) => !photo.isCover);
    const usableGalleryCount = galleryPhotos.filter(isUsablePropertyPhoto).length;
    const hasUsableCover = coverPhoto != null && isUsablePropertyPhoto(coverPhoto);
    const maxGallery = MAX_PHOTOS - (coverPhoto ? 1 : 0);
    const coverError =
        typeof formState.errors.media === "object" &&
        formState.errors.media &&
        "cover" in formState.errors.media
            ? String(
                  (formState.errors.media as { cover?: { message?: string } }).cover?.message ?? "",
              )
            : "";
    const photosError =
        formState.errors.media &&
        typeof formState.errors.media === "object" &&
        "photos" in formState.errors.media
            ? String(
                  (formState.errors.media as { photos?: { message?: string } }).photos?.message ??
                      "",
              )
            : "";

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
        await replaceCoverPhoto({
            file,
            photos,
            photoFilesRef,
            commitPhotos,
            patchPhoto: (photoId, patch) => updatePhoto(photoId, patch),
        });
    }

    function addGalleryPhotos(files: FileList | null) {
        if (!files) return;
        const accepted: DraftPhoto[] = [];
        const gallery = photos.filter((photo) => !photo.isCover);
        const cover = photos.find((photo) => photo.isCover);
        const galleryCap = MAX_PHOTOS - (cover ? 1 : 0);
        for (const file of Array.from(files)) {
            if (gallery.length + accepted.length >= galleryCap) {
                toast.error(`You can add up to ${galleryCap} property photos.`);
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

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={<>Property photos</>}
                description="Add one cover image and at least 3 property photos. Both are required to publish."
            >
                <div className={FORM_STACK_CLASS}>
                    <div
                        className="
                          grid gap-4
                          md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-stretch
                        "
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p
                                    className="
                                      flex items-center gap-2 text-sm font-semibold text-ink
                                    "
                                >
                                    <FieldLabel path="media.cover">Cover image</FieldLabel>
                                </p>
                            </div>

                            {coverPhoto ? (
                                <CoverPreview
                                    photo={coverPhoto}
                                    onReplace={(file) => void replaceCover(file)}
                                    onRemove={() => removePhotoById(coverPhoto.id)}
                                    onRetry={() => retryPhoto(coverPhoto.id)}
                                />
                            ) : (
                                <Label
                                    htmlFor="property-cover-upload"
                                    className="
                                      flex aspect-4/3 shrink-0 cursor-pointer flex-col items-center
                                      justify-center rounded-card border-2 border-dashed
                                      border-brand/35 bg-brand-soft/40 px-4 py-6 text-center
                                      focus-within:ring-3 focus-within:ring-ring/30
                                    "
                                >
                                    <DropzoneIcon>
                                        <ImageIcon className="block-5 inline-5" aria-hidden />
                                    </DropzoneIcon>
                                    <span className="mbs-3 text-base font-bold text-ink">
                                        Upload cover
                                    </span>
                                    <Input
                                        id="property-cover-upload"
                                        type="file"
                                        accept={COVER_ACCEPT}
                                        className="sr-only"
                                        onChange={(event) => {
                                            void replaceCover(event.target.files?.[0]);
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                </Label>
                            )}
                            {coverError ? (
                                <p role="alert" className="text-sm text-danger">
                                    {coverError}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-3 min-inline-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p
                                    className="
                                      flex items-center gap-2 text-sm font-semibold text-ink
                                    "
                                >
                                    <FieldLabel path="media.photos">Property photos</FieldLabel>
                                </p>
                            </div>
                            {!galleryPhotos.length ? (
                                <Label
                                    htmlFor="property-gallery-upload"
                                    className="
                                      flex flex-1 cursor-pointer flex-col items-center
                                      justify-center rounded-card border-2 border-dashed
                                      border-brand/35 bg-brand-soft/40 px-6 py-8 text-center
                                      min-block-36
                                      focus-within:ring-3 focus-within:ring-ring/30
                                    "
                                >
                                    <DropzoneIcon>
                                        <ImagePlus className="block-5 inline-5" aria-hidden />
                                    </DropzoneIcon>
                                    <span className="mbs-3 text-base font-bold text-ink">
                                        Add property photos
                                    </span>
                                    <span className="mbs-1 text-sm text-ink-muted">
                                        Multiple allowed · JPG, PNG, WebP or HEIC · up to 10 MB each
                                    </span>
                                </Label>
                            ) : null}
                            <Input
                                id="property-gallery-upload"
                                type="file"
                                aria-label="Add property photos"
                                wrapperClassName="sr-only"
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                className="sr-only"
                                disabled={galleryPhotos.length >= maxGallery}
                                onChange={(event) => {
                                    addGalleryPhotos(event.target.files);
                                    event.currentTarget.value = "";
                                }}
                            />
                            {galleryPhotos.length ? (
                                <div
                                    className="grid grid-cols-1 gap-3 lg:grid-cols-2"
                                    role="list"
                                    aria-label="Property photos"
                                >
                                    {galleryPhotos.map((photo) => (
                                        <PhotoAttachment
                                            key={photo.id}
                                            photo={photo}
                                            onRemove={() => removePhotoById(photo.id)}
                                            onRetry={() => retryPhoto(photo.id)}
                                        />
                                    ))}
                                </div>
                            ) : null}
                            {galleryPhotos.length ? (
                                <Button
                                    type="button"
                                    variant="link"
                                    size="md"
                                    className="self-start text-brand underline"
                                    disabled={galleryPhotos.length >= maxGallery}
                                    onClick={() =>
                                        document.getElementById("property-gallery-upload")?.click()
                                    }
                                >
                                    <ImagePlus aria-hidden />
                                    Add more photos
                                </Button>
                            ) : null}
                            {photosError ? (
                                <p role="alert" className="text-sm text-danger">
                                    {photosError}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div
                        className="
                      flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-xs/5
                      text-ink-muted
                    "
                    >
                        <p>
                            <span className="font-medium text-ink">
                                {PROPERTY_COVER_SIZE_GUIDANCE}
                            </span>
                            <span className="ms-2">Keep the property centered.</span>
                        </p>
                        <p>JPG, PNG, WebP, HEIC · Max 10 MB per photo</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3" role="status" aria-live="polite">
                        <div
                            className="
                              space-y-1 rounded-control border border-border-warm bg-surface p-4
                            "
                        >
                            <p className="text-xs text-ink-muted">Cover image · 1 required</p>
                            <p
                                className={cn(
                                    "flex items-center gap-1.5 text-sm font-medium",
                                    hasUsableCover ? "text-brand-text" : "text-ink",
                                )}
                            >
                                {hasUsableCover ? (
                                    <Check className="block-4 inline-4" aria-hidden />
                                ) : null}
                                {hasUsableCover
                                    ? "Done"
                                    : coverPhoto?.status === "processing"
                                      ? "Preparing image…"
                                      : "Add a cover image"}
                            </p>
                        </div>
                        <div
                            className="
                              space-y-1 rounded-control border border-border-warm bg-surface p-4
                            "
                        >
                            <p className="text-xs text-ink-muted">Property photos · minimum 3</p>
                            <p
                                className={cn(
                                    "flex items-center gap-1.5 text-sm font-medium",
                                    usableGalleryCount >= 3 ? "text-brand-text" : "text-ink",
                                )}
                            >
                                {usableGalleryCount >= 3 ? (
                                    <Check className="block-4 inline-4" aria-hidden />
                                ) : null}
                                {usableGalleryCount >= 3
                                    ? `Done · ${usableGalleryCount} added`
                                    : `${usableGalleryCount} added · ${3 - usableGalleryCount} more needed`}
                            </p>
                        </div>
                        <div
                            className="
                              space-y-1 rounded-control border border-border-warm bg-surface p-4
                            "
                        >
                            <p className="text-xs text-ink-muted">
                                Maximum {MAX_PHOTOS} images, including cover
                            </p>
                            <p className="text-sm font-medium text-ink">
                                {photos.length} of {MAX_PHOTOS} added
                            </p>
                        </div>
                    </div>
                </div>
            </WizardSection>

            <WizardSection
                title={<>Video and virtual tour</>}
                description="Optional links for buyers. Paste a hosted URL — no file upload here."
            >
                <div className={FORM_GRID_CLASS}>
                    <div className="flex flex-col gap-3 min-inline-0">
                        <TextField
                            name="media.videoUrl"
                            label="YouTube or Vimeo link"
                            type="url"
                            placeholder="https://youtube.com/… or https://vimeo.com/…"
                            startIcon={Video}
                        />
                        {videoEmbed ? (
                            <MediaEmbedPreview embed={videoEmbed} />
                        ) : hasNonEmptyUrl(videoUrl) ? (
                            <p className="text-sm text-ink-muted">
                                Paste a full YouTube or Vimeo link to see a preview.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-3 min-inline-0">
                        <TextField
                            name="media.virtualTourUrl"
                            label="Virtual tour link"
                            type="url"
                            placeholder="Matterport or 360° tour"
                            startIcon={View}
                        />
                        {tourEmbed ? (
                            <MediaEmbedPreview embed={tourEmbed} />
                        ) : hasNonEmptyUrl(virtualTourUrl) ? (
                            <p className="text-sm text-ink-muted">
                                Paste a full https link to preview the tour.
                            </p>
                        ) : null}
                    </div>
                </div>
            </WizardSection>
        </div>
    );
}

function MediaEmbedPreview({ embed }: { embed: MediaEmbed }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border-warm bg-surface">
            <div className="relative aspect-video bg-surface-muted">
                <iframe
                    title={embed.title}
                    src={embed.embedUrl}
                    className="absolute inset-0 border-0 block-full inline-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
            <div
                className="
                  flex items-center justify-between gap-3 border-bs border-border-warm px-5 py-1.5
                "
            >
                <p className="truncate text-sm font-medium text-ink-muted">{embed.title}</p>
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<a href={embed.sourceUrl} target="_blank" rel="noopener noreferrer" />}
                    className="px-0 text-xs"
                >
                    Open
                    <ExternalLink className="block-3.5 inline-3.5" aria-hidden />
                </Button>
            </div>
        </div>
    );
}

function CoverPreview({
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
    const inputId = "property-cover-replace";
    const hasImage = Boolean(photo.url);

    return (
        <div
            className="
              group relative aspect-4/3 shrink-0 overflow-hidden rounded-card bg-surface-muted
              min-block-0
            "
        >
            {hasImage ? (
                <AppImage
                    src={photo.url}
                    alt={photo.alt || photo.name || "Cover image"}
                    fill
                    sizes="(max-width: 767px) 100vw, 288px"
                    className="object-cover"
                    unoptimized={
                        photo.url.startsWith("blob:") ||
                        photo.url.startsWith("http://") ||
                        photo.url.startsWith("https://")
                    }
                />
            ) : (
                <div className="flex items-center justify-center px-4 text-center block-full">
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
                  md:opacity-0
                  md:group-focus-within:opacity-100
                  md:group-hover:opacity-100
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
                    Replace cover
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

            {photo.status === "processing" ? (
                <p
                    className="
                      inset-inline-2 absolute inset-be-2 rounded-control bg-ink/70 px-2 py-1
                      text-center text-[11px] font-medium text-surface
                    "
                >
                    Compressing…
                </p>
            ) : null}
        </div>
    );
}

function photoAttachmentState(status: DraftPhoto["status"]): "error" | "done" {
    // Keep visual state quiet — uploading/processing shimmer is too loud for this list.
    return status === "error" ? "error" : "done";
}

function photoStatusLabel(photo: DraftPhoto, badge?: string): string {
    const status =
        photo.status === "processing"
            ? "Compressing…"
            : photo.status === "error"
              ? (photo.errorMessage ?? "Upload failed. Try again.")
              : photo.status === "queued"
                ? "Queued · waiting for upload"
                : "Ready";
    return badge ? `${badge} · ${status}` : status;
}

function PhotoAttachment({
    photo,
    badge,
    onRemove,
    onRetry,
}: {
    photo: DraftPhoto;
    badge?: string;
    onRemove: () => void;
    onRetry: () => void;
}) {
    const state = photoAttachmentState(photo.status);

    return (
        <Attachment
            state={state}
            orientation="horizontal"
            className="
              gap-2.5 p-2.5 shadow-none inline-full max-inline-none min-inline-0
              focus-within:border-border-warm focus-within:ring-0
              hover:bg-surface
              has-[>a,>button]:hover:bg-surface
            "
            role="listitem"
        >
            <AttachmentMedia variant="image" className="shrink-0 opacity-100 block-11 inline-11">
                {photo.url ? (
                    <AppImage
                        src={photo.url}
                        alt={photo.name}
                        width={88}
                        height={88}
                        className="object-cover block-full inline-full"
                        sizes="44px"
                        unoptimized={
                            photo.url.startsWith("http://") || photo.url.startsWith("https://")
                        }
                    />
                ) : (
                    <CircleAlert className="text-danger block-5 inline-5" aria-hidden />
                )}
            </AttachmentMedia>
            <AttachmentContent className="min-inline-0">
                <AttachmentTitle className="text-sm [&.shimmer]:animate-none">
                    {photo.name}
                </AttachmentTitle>
                <AttachmentDescription>{photoStatusLabel(photo, badge)}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions className="gap-0.5">
                {photo.status === "error" ? (
                    <AttachmentAction
                        type="button"
                        aria-label={`Retry ${photo.name}`}
                        onClick={onRetry}
                    >
                        <RefreshCw aria-hidden strokeWidth={2} />
                    </AttachmentAction>
                ) : null}
                <AttachmentAction
                    type="button"
                    aria-label={`Remove ${photo.name}`}
                    onClick={onRemove}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                >
                    <X aria-hidden strokeWidth={2} />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    );
}
