"use client";

import { type MutableRefObject, useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import {
    ArrowLeft,
    ArrowRight,
    Check,
    CircleAlert,
    FileText,
    ImagePlus,
    LoaderCircle,
    RefreshCw,
    ShieldCheck,
    Star,
    Trash2,
    Upload,
} from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { preparePhotoForUpload } from "@/lib/media/prepare-photo";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";
import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function StepMedia({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const photos = watch("media.photos");
    const usablePhotoCount = photos.filter((photo) => photo.status !== "error").length;
    const documents = watch("documents");
    const [documentType, setDocumentType] = useState(
        DOCUMENT_TYPE_OPTIONS[0]?.value ?? "sale_deed",
    );
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const relevantDocumentTypes = new Set<string>();
    if (derived.isRentLike) {
        ["owner_id_proof", "property_ownership_proof", "society_noc"].forEach((type) =>
            relevantDocumentTypes.add(type),
        );
    } else if (derived.isNewBooking) {
        ["rera_certificate", "approved_plan", "allotment_letter", "builder_agreement"].forEach(
            (type) => relevantDocumentTypes.add(type),
        );
    } else if (derived.isAgricultural) {
        ["7_12_extract", "8a_extract", "mutation_entry"].forEach((type) =>
            relevantDocumentTypes.add(type),
        );
    } else if (derived.isPlot) {
        ["7_12_extract", "na_order", "property_card", "mutation_entry", "survey_map"].forEach(
            (type) => relevantDocumentTypes.add(type),
        );
    } else {
        ["sale_deed", "index_2", "property_tax_receipt", "society_noc", "share_certificate"].forEach(
            (type) => relevantDocumentTypes.add(type),
        );
    }
    if (derived.isCommercial || derived.isIndustrial) {
        ["occupancy_certificate", "fire_noc", "property_tax_receipt"].forEach((type) =>
            relevantDocumentTypes.add(type),
        );
    }
    const documentTypeOptions = DOCUMENT_TYPE_OPTIONS.filter((option) =>
        relevantDocumentTypes.has(option.value),
    );
    const resolvedDocumentType = documentTypeOptions.some((option) => option.value === documentType)
        ? documentType
        : (documentTypeOptions[0]?.value ?? "owner_id_proof");

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

    function addPhotos(files: FileList | null) {
        if (!files) return;
        const accepted: PropertyDraftValues["media"]["photos"] = [];
        for (const file of Array.from(files)) {
            if (photos.length + accepted.length >= MAX_PHOTOS) {
                toast.error(`You can add up to ${MAX_PHOTOS} photos.`);
                break;
            }
            const id = createClientId("photo");
            if (file.size > MAX_PHOTO_BYTES) {
                photoFilesRef.current.set(id, file);
                accepted.push({
                    id,
                    url: "",
                    name: file.name,
                    tag: "other",
                    isCover: false,
                    order: photos.length + accepted.length,
                    alt: "",
                    status: "error",
                    errorMessage: "File is larger than 10 MB. Choose a smaller copy.",
                });
                continue;
            }
            if (!PHOTO_TYPES.has(file.type)) {
                photoFilesRef.current.set(id, file);
                accepted.push({
                    id,
                    url: "",
                    name: file.name,
                    tag: "other",
                    isCover: false,
                    order: photos.length + accepted.length,
                    alt: "",
                    status: "error",
                    errorMessage: "Use a JPG, PNG, WebP, HEIC, or HEIF photo.",
                });
                continue;
            }
            const url = URL.createObjectURL(file);
            photoFilesRef.current.set(url, file);
            photoFilesRef.current.set(id, file);
            accepted.push({
                id,
                url,
                name: file.name,
                tag: "other",
                isCover: photos.length === 0 && accepted.length === 0,
                order: photos.length + accepted.length,
                alt: "",
                status: "processing",
            });
        }
        setValue("media.photos", [...photos, ...accepted], {
            shouldDirty: true,
            shouldValidate: true,
        });
        for (const photo of accepted) {
            const file = photoFilesRef.current.get(photo.id);
            if (file && photo.url) void processPhoto(photo.id, file, photo.url);
        }
    }

    function removePhoto(index: number) {
        const removed = photos[index];
        if (removed?.url.startsWith("blob:")) {
            URL.revokeObjectURL(removed.url);
            photoFilesRef.current.delete(removed.url);
        }
        if (removed) photoFilesRef.current.delete(removed.id);
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

    function movePhoto(from: number, to: number) {
        if (from === to || to < 0 || to >= photos.length) return;
        const next = [...photos];
        const [moved] = next.splice(from, 1);
        if (!moved) return;
        next.splice(to, 0, moved);
        setValue(
            "media.photos",
            next.map((photo, order) => ({ ...photo, order })),
            { shouldDirty: true, shouldValidate: true },
        );
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

    function addDocument(file: File | undefined) {
        if (!file) return;
        setValue(
            "documents",
            [
                ...documents,
                {
                    id: createClientId("document"),
                    type: resolvedDocumentType,
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
                <Label
                    htmlFor="property-photo-upload"
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
                    <span className="mbs-4 text-base font-bold text-ink">
                        <FieldLabel path="media.photos">Add property photos</FieldLabel>
                    </span>
                    <span className="mbs-1 text-sm text-ink-muted">
                        JPG, PNG, WebP or HEIC · up to 10 MB each · maximum 30
                    </span>
                    <Input
                        id="property-photo-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        className="sr-only"
                        onChange={(event) => {
                            addPhotos(event.target.files);
                            event.currentTarget.value = "";
                        }}
                    />
                </Label>
                <div className="mbs-4 flex items-center justify-between gap-4">
                    <p
                        className={`text-sm font-semibold ${
                            usablePhotoCount >= 3
                                ? "text-brand-text"
                                : `text-ink-muted`
                        }`}
                    >
                        {usablePhotoCount >= 3 ? (
                            <Check className="me-1.5 inline block-4 inline-4" aria-hidden />
                        ) : null}
                        {usablePhotoCount}/3 minimum ·{" "}
                        {photos.length}/{MAX_PHOTOS} total
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
                                draggable={photo.status !== "processing"}
                                onDragStart={() => setDragIndex(index)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                    if (dragIndex != null) movePhoto(dragIndex, index);
                                    setDragIndex(null);
                                }}
                                className="
                                  overflow-hidden rounded-card border border-border-warm bg-surface
                                "
                            >
                                <div className="relative aspect-4/3 bg-surface-muted">
                                    {photo.url ? (
                                        <AppImage
                                            src={photo.url}
                                            alt={photo.alt || `Property photo ${index + 1}`}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="
                                          flex flex-col items-center justify-center gap-2 px-4
                                          text-center block-full
                                        ">
                                            <CircleAlert className="text-danger block-6 inline-6" aria-hidden />
                                            <p className="
                                              line-clamp-2 text-xs font-semibold text-ink
                                            ">{photo.name}</p>
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            `
                                              absolute inset-e-3 inset-be-3 inline-flex items-center
                                              gap-1 rounded-control px-2.5 py-1.5 text-xs
                                              font-semibold
                                            `,
                                            photo.status === "error"
                                                ? "bg-danger-soft text-danger"
                                                : "bg-brand-ink text-surface",
                                        )}
                                    >
                                        {photo.status === "processing" ? (
                                            <LoaderCircle className="
                                              animate-spin block-3.5 inline-3.5
                                            " aria-hidden />
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-md"
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
                                    </Button>
                                </div>
                                <div className="space-y-3 p-3">
                                    {photo.status === "error" ? (
                                        <div className="
                                          rounded-control bg-danger-soft px-3 py-2 text-xs/5
                                          text-danger
                                        ">
                                            {photo.errorMessage ??
                                                "This format could not be prepared. Retry or choose another file."}
                                        </div>
                                    ) : null}
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
                                    <div className="flex flex-wrap gap-2">
                                        {!photo.isCover && photo.status !== "error" ? (
                                            <Button type="button" variant="outline" size="sm" onClick={() => makeCover(index)}>
                                                <Star aria-hidden /> Make cover
                                            </Button>
                                        ) : null}
                                        <Button type="button" variant="ghost" size="sm" aria-label={`Move ${photo.name} left`} disabled={index === 0} onClick={() => movePhoto(index, index - 1)}>
                                            <ArrowLeft aria-hidden />
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" aria-label={`Move ${photo.name} right`} disabled={index === photos.length - 1} onClick={() => movePhoto(index, index + 1)}>
                                            <ArrowRight aria-hidden />
                                        </Button>
                                        {photo.status === "error" ? (
                                            <Button type="button" variant="outline" size="sm" onClick={() => retryPhoto(photo.id)}>
                                                <RefreshCw aria-hidden /> Retry
                                            </Button>
                                        ) : null}
                                    </div>
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
                        path="media.videoUploadName"
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
                        path="media.floorPlanFiles"
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
                        path="media.brochureFileName"
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
                        <Label htmlFor="document-type" className="text-sm font-semibold text-ink">
                            Document type
                        </Label>
                        <Select
                            value={resolvedDocumentType}
                            onValueChange={(value) => setDocumentType(value ?? "sale_deed")}
                        >
                            <SelectTrigger
                                id="document-type"
                                className="
                                  border-2 border-border-warm bg-surface px-4 text-[15px] text-ink
                                  block-control-xl inline-full
                                "
                            >
                                <SelectValue>
                                    {(value) =>
                                        documentTypeOptions.find(
                                            (option) => option.value === value,
                                        )?.label ?? "Choose a document type"
                                    }
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="start">
                                {documentTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Label
                        htmlFor="property-document-upload"
                        className="
                          flex cursor-pointer items-center justify-center gap-2 rounded-control
                          border border-dashed border-brand/35 bg-surface px-4 text-sm font-semibold
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
                            onChange={(event) => addDocument(event.target.files?.[0])}
                        />
                    </Label>
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
    path,
    label,
    accept,
    value,
    onFile,
}: {
    path: string;
    label: string;
    accept: string;
    value: string;
    onFile: (file: File | undefined) => void;
}) {
    const inputId = useId();
    return (
        <ConditionalField path={path}>
            <Label
                htmlFor={inputId}
                className="
                  flex cursor-pointer flex-col items-center justify-center rounded-control border
                  border-dashed border-border-warm bg-surface px-4 py-3 text-center min-block-24
                  focus-within:ring-3 focus-within:ring-ring/30
                "
            >
                <Upload className="text-brand block-5 inline-5" aria-hidden />
                <span className="mbs-2 text-sm font-semibold text-ink">
                    {value || <FieldLabel path={path}>{label}</FieldLabel>}
                </span>
                <Input
                    id={inputId}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    onChange={(event) => onFile(event.target.files?.[0])}
                />
            </Label>
        </ConditionalField>
    );
}
