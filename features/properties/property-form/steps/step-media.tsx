"use client";

import { type MutableRefObject, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Check, FileText, ImagePlus, ShieldCheck, Star, Trash2, Upload } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";

import { DOCUMENT_TYPE_OPTIONS, PHOTO_TAG_OPTIONS } from "@/constants/property";
import {
    FORM_GRID_CLASS,
    SelectField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

const MAX_PHOTOS = 30;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function StepMedia({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const photos = watch("media.photos");
    const documents = watch("documents");
    const [documentType, setDocumentType] = useState(
        DOCUMENT_TYPE_OPTIONS[0]?.value ?? "sale_deed",
    );

    function addPhotos(files: FileList | null) {
        if (!files) return;
        const accepted: PropertyDraftValues["media"]["photos"] = [];
        for (const file of Array.from(files)) {
            if (file.size > MAX_PHOTO_BYTES) {
                toast.error(`${file.name} is larger than 10 MB.`);
                continue;
            }
            if (photos.length + accepted.length >= MAX_PHOTOS) break;
            const url = URL.createObjectURL(file);
            photoFilesRef.current.set(url, file);
            accepted.push({
                id: createClientId("photo"),
                url,
                name: file.name,
                tag: "other",
                isCover: photos.length === 0 && accepted.length === 0,
                order: photos.length + accepted.length,
                alt: "",
                status: "ready",
            });
        }
        setValue("media.photos", [...photos, ...accepted], {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    function removePhoto(index: number) {
        const removed = photos[index];
        if (removed?.url.startsWith("blob:")) {
            URL.revokeObjectURL(removed.url);
            photoFilesRef.current.delete(removed.url);
        }
        const next = photos
            .filter((_, itemIndex) => itemIndex !== index)
            .map((photo, order) => ({ ...photo, order }));
        if (next.length && !next.some((photo) => photo.isCover))
            next[0] = { ...next[0]!, isCover: true };
        setValue("media.photos", next, { shouldDirty: true, shouldValidate: true });
    }

    function makeCover(index: number) {
        setValue(
            "media.photos",
            photos.map((photo, itemIndex) => ({ ...photo, isCover: itemIndex === index })),
            { shouldDirty: true },
        );
    }

    function addDocument(file: File | undefined) {
        if (!file) return;
        setValue(
            "documents",
            [
                ...documents,
                {
                    id: createClientId("document"),
                    type: documentType,
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

    return (
        <div className="space-y-8">
            <WizardSection
                title="Property photos"
                description="Add at least 3 clear photos to publish. The first photo becomes the cover unless you choose another."
            >
                <label
                    className="
                      flex cursor-pointer flex-col items-center justify-center rounded-card border-2
                      border-dashed border-brand/35 bg-brand-soft/30 px-6 py-8 text-center
                      min-block-44
                      focus-within:ring-3 focus-within:ring-ring/30
                    "
                >
                    <span
                        className="
                          flex items-center justify-center rounded-full bg-brand text-surface
                          block-12 inline-12
                        "
                    >
                        <ImagePlus className="block-5 inline-5" aria-hidden />
                    </span>
                    <span className="mbs-4 text-base font-bold text-ink">Add property photos</span>
                    <span className="mbs-1 text-sm text-ink-muted">
                        JPG, PNG, WebP or HEIC · up to 10 MB each · maximum 30
                    </span>
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        className="sr-only"
                        onChange={(event) => addPhotos(event.target.files)}
                    />
                </label>
                <div className="mbs-4 flex items-center justify-between gap-4">
                    <p
                        className={`text-sm font-semibold ${
                            photos.length >= 3
                                ? "text-brand-text"
                                : `text-ink-muted`
                        }`}
                    >
                        {photos.length >= 3 ? (
                            <Check className="me-1.5 inline block-4 inline-4" aria-hidden />
                        ) : null}
                        {photos.length}/3 minimum · {photos.length}/{MAX_PHOTOS} total
                    </p>
                    <p className="text-xs text-ink-muted">
                        Photos stay queued locally until the current API upload runs.
                    </p>
                </div>

                {photos.length ? (
                    <div className="mbs-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {photos.map((photo, index) => (
                            <article
                                key={photo.id}
                                className="
                                  overflow-hidden rounded-card border border-border-warm bg-surface
                                "
                            >
                                <div className="relative aspect-4/3 bg-surface-muted">
                                    <AppImage
                                        src={photo.url}
                                        alt={photo.alt || `Property photo ${index + 1}`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                    />
                                    {photo.isCover ? (
                                        <span
                                            className="
                                              absolute inset-s-3 inset-bs-3 inline-flex items-center
                                              gap-1 rounded-control bg-brand-ink px-2.5 py-1.5
                                              text-xs font-semibold text-surface
                                            "
                                        >
                                            <Star className="block-3.5 inline-3.5" aria-hidden />{" "}
                                            Cover
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        aria-label={`Remove ${photo.name}`}
                                        onClick={() => removePhoto(index)}
                                        className="
                                          absolute inset-e-3 inset-bs-3 flex items-center
                                          justify-center rounded-full bg-surface text-danger
                                          shadow-sm block-10 inline-10
                                          focus-visible:ring-3 focus-visible:ring-danger/20
                                        "
                                    >
                                        <Trash2 className="block-4 inline-4" />
                                    </button>
                                </div>
                                <div className="space-y-3 p-3">
                                    <SelectField
                                        name={`media.photos.${index}.tag`}
                                        label="Photo tag"
                                        options={PHOTO_TAG_OPTIONS}
                                    />
                                    <TextField
                                        name={`media.photos.${index}.alt`}
                                        label="Alt text"
                                        placeholder="Describe this view"
                                    />
                                    {!photo.isCover ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => makeCover(index)}
                                        >
                                            <Star aria-hidden /> Make cover
                                        </Button>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
                <div className="mbs-5 grid gap-3 sm:grid-cols-2">
                    <ToggleField
                        name="media.agencyWatermark"
                        label="Agency watermark"
                        description="Apply when image processing is connected."
                    />
                    <ToggleField
                        name="media.autoBlurSensitiveDetails"
                        label="Blur faces and number plates"
                        description="Protect private details before publishing."
                    />
                </div>
            </WizardSection>

            <WizardSection
                title="Video, tour, and plans"
                description="These fields are ready in the form and remain local until the API supports them."
            >
                <div className={FORM_GRID_CLASS}>
                    <TextField
                        name="media.videoUrl"
                        label="Video link"
                        type="url"
                        placeholder="YouTube or Vimeo"
                    />
                    <TextField
                        name="media.virtualTourUrl"
                        label="Virtual tour link"
                        type="url"
                        placeholder="Matterport or 360° tour"
                    />
                </div>
                <div className="mbs-5 grid gap-3 sm:grid-cols-3">
                    <FilePicker
                        label="Upload video"
                        accept="video/*"
                        value={watch("media.videoUploadName")}
                        onFile={(file) =>
                            setValue("media.videoUploadName", file?.name ?? "", {
                                shouldDirty: true,
                            })
                        }
                    />
                    <FilePicker
                        label="Add floor plan"
                        accept="image/*,.pdf"
                        value={watch("media.floorPlanFiles").at(-1) ?? ""}
                        onFile={(file) =>
                            file &&
                            setValue(
                                "media.floorPlanFiles",
                                [...watch("media.floorPlanFiles"), file.name],
                                { shouldDirty: true },
                            )
                        }
                    />
                    <FilePicker
                        label="Add brochure"
                        accept=".pdf"
                        value={watch("media.brochureFileName")}
                        onFile={(file) =>
                            setValue("media.brochureFileName", file?.name ?? "", {
                                shouldDirty: true,
                            })
                        }
                    />
                </div>
            </WizardSection>

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
                <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr]">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="document-type" className="text-sm font-semibold text-ink">
                            Document type
                        </label>
                        <select
                            id="document-type"
                            value={documentType}
                            onChange={(event) => setDocumentType(event.target.value)}
                            className="
                              rounded-control border-2 border-border-warm bg-surface px-4
                              text-[15px] text-ink outline-none block-control-xl inline-full
                              focus-visible:border-ring focus-visible:ring-3
                              focus-visible:ring-ring/30
                            "
                        >
                            {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <label
                        className="
                          flex cursor-pointer items-center justify-center gap-2 rounded-control
                          border border-dashed border-brand/35 bg-surface px-4 text-sm font-semibold
                          text-brand-text block-control-xl
                          focus-within:ring-3 focus-within:ring-ring/30
                        "
                    >
                        <Upload className="block-4 inline-4" aria-hidden /> Upload document
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={(event) => addDocument(event.target.files?.[0])}
                        />
                    </label>
                </div>
                {documents.length ? (
                    <div className="mbs-5 space-y-3">
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
                                            <p
                                                className="truncate text-sm font-bold text-ink"
                                            >
                                                {document.fileName}
                                            </p>
                                            <p
                                                className="text-xs text-ink-muted"
                                            >
                                                {
                                                    DOCUMENT_TYPE_OPTIONS.find(
                                                        (option) => option.value === document.type,
                                                    )?.label
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
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
                                    </button>
                                </div>
                                <div className="mbs-4 grid gap-3 sm:grid-cols-2">
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
        </div>
    );
}

function FilePicker({
    label,
    accept,
    value,
    onFile,
}: {
    label: string;
    accept: string;
    value: string;
    onFile: (file: File | undefined) => void;
}) {
    return (
        <label
            className="
              flex cursor-pointer flex-col items-center justify-center rounded-control border
              border-dashed border-border-warm bg-surface px-4 py-3 text-center min-block-24
              focus-within:ring-3 focus-within:ring-ring/30
            "
        >
            <Upload className="text-brand block-5 inline-5" aria-hidden />
            <span className="mbs-2 text-sm font-semibold text-ink">{value || label}</span>
            <input
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0])}
            />
        </label>
    );
}
