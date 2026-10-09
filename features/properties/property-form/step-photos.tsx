"use client";

import { type MutableRefObject, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Camera, X } from "lucide-react";

import {
    MAX_LISTING_PHOTOS,
    MAX_PHOTO_SIZE_MB,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { AppImage } from "@/components/shared/app-image";
import { PhotoDropzone, type PhotoRejection } from "@/components/shared/photo-dropzone";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";

import { FormSection } from "@/features/properties/property-form/form-ui";

function rejectionMessage(rejections: PhotoRejection[]): string {
    const [first] = rejections;
    if (!first) return "";
    if (rejections.length === 1) return `${first.fileName} was skipped — ${first.reason}.`;
    return `${rejections.length} files were skipped — check the type, size, and how many slots are left.`;
}

export type StepPhotosProps = {
    /** Maps preview URL → File for newly picked photos (blob URLs). */
    photoFilesRef: MutableRefObject<Map<string, File>>;
};

export function StepPhotos({ photoFilesRef }: StepPhotosProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const [uploadNotice, setUploadNotice] = useState<string | null>(null);

    // Object URLs are created for local previews and must be released by hand.
    useEffect(() => {
        const files = photoFilesRef.current;
        return () => {
            files.forEach((_, src) => {
                if (src.startsWith("blob:")) URL.revokeObjectURL(src);
            });
        };
    }, [photoFilesRef]);

    return (
        <div className="flex flex-col gap-5">
            <FormSection
                title="Photos"
                icon={<Camera />}
                description="Add clear photos of the property. The first photo becomes the cover."
                className="min-block-0"
                hasError={errors.imageSrcs != null}
            >
                <FieldGroup className="gap-4">
                    <Field>
                        <Controller
                            name="imageSrcs"
                            control={control}
                            render={({ field }) => {
                                const remaining = MAX_LISTING_PHOTOS - field.value.length;

                                return (
                                    <div className="flex flex-col gap-4">
                                        <PhotoDropzone
                                            remaining={remaining}
                                            maxSizeMb={MAX_PHOTO_SIZE_MB}
                                            onFiles={(files) => {
                                                setUploadNotice(null);
                                                const urls = files.map((file) => {
                                                    const url = URL.createObjectURL(file);
                                                    photoFilesRef.current.set(url, file);
                                                    return url;
                                                });
                                                field.onChange([...field.value, ...urls]);
                                            }}
                                            onReject={(rejections) =>
                                                setUploadNotice(rejectionMessage(rejections))
                                            }
                                        />

                                        {uploadNotice ? (
                                            <p
                                                role="alert"
                                                className="body-xs font-medium text-danger"
                                            >
                                                {uploadNotice}
                                            </p>
                                        ) : null}

                                        {field.value.length > 0 ? (
                                            <div
                                                className="
                                                  grid grid-cols-2 gap-3
                                                  sm:grid-cols-3 sm:gap-4
                                                "
                                            >
                                                {field.value.map((src, index) => (
                                                    <button
                                                        key={src}
                                                        type="button"
                                                        aria-label={
                                                            index === 0
                                                                ? "Cover photo — click to remove"
                                                                : "Remove photo"
                                                        }
                                                        onClick={() => {
                                                            if (src.startsWith("blob:")) {
                                                                URL.revokeObjectURL(src);
                                                                photoFilesRef.current.delete(src);
                                                            }
                                                            field.onChange(
                                                                field.value.filter(
                                                                    (item) => item !== src,
                                                                ),
                                                            );
                                                        }}
                                                        className="
                                                          group/photo relative aspect-square
                                                          overflow-hidden rounded-card border-2
                                                          border-brand inline-full
                                                        "
                                                    >
                                                        <AppImage
                                                            src={src}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            sizes="(min-width: 640px) 30vw, 45vw"
                                                            unoptimized={src.startsWith("blob:")}
                                                        />
                                                        <span
                                                            aria-hidden
                                                            className="
                                                              absolute inset-e-2 inset-be-2 flex
                                                              items-center justify-center
                                                              rounded-control bg-ink/80 text-surface
                                                              opacity-0 transition-opacity
                                                              duration-160 block-7 inline-7
                                                              group-hover/photo:opacity-100
                                                            "
                                                        >
                                                            <X
                                                                className="block-4 inline-4"
                                                                strokeWidth={2.5}
                                                            />
                                                        </span>
                                                        {index === 0 ? (
                                                            <span
                                                                className="
                                                                  body-xs absolute inset-s-2
                                                                  inset-be-2 rounded-sm bg-ink/80
                                                                  px-1.5 py-0.5 font-semibold
                                                                  text-surface
                                                                "
                                                            >
                                                                Cover
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}

                                        <p className="body-xs text-ink-muted">
                                            {field.value.length} of {MAX_LISTING_PHOTOS} photos
                                            added
                                            {field.value.length < 3
                                                ? " — 3 or more gets noticeably more interest."
                                                : null}
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <FieldError>{errors.imageSrcs?.message as string | undefined}</FieldError>
                    </Field>
                </FieldGroup>
            </FormSection>
        </div>
    );
}
