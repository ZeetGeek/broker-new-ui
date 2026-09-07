"use client";

import { Camera, Eye, EyeOff, UserRound } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import {
    PROPERTY_PHOTO_OPTIONS,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { AppImage } from "@/components/shared/app-image";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";

import { FormSection } from "@/features/properties/property-form/form-ui";

export function StepPhotos() {
    const {
        control,
        watch,
        formState: { errors },
    } = useFormContext<PropertyFormValues>();

    const publish = watch("publish");

    return (
        <div className="flex flex-col gap-5">
            <FormSection
                title="Photos"
                description="Add clear photos of the property. The first photo becomes the cover."
                className="min-block-0"
            >
                <FieldGroup className="gap-4">
                    <Field>
                        <FieldLabel className="body-sm text-ink">Property photos</FieldLabel>
                        <FieldDescription className="body-xs text-ink-muted">
                            Listings with photos get more interest — add at least 3 if you can. Tap a
                            photo to remove it.
                        </FieldDescription>
                        <Controller
                            name="imageSrcs"
                            control={control}
                            render={({ field }) => {
                                const unused = PROPERTY_PHOTO_OPTIONS.filter(
                                    (src) => !field.value.includes(src),
                                );
                                return (
                                    <div className="flex flex-wrap gap-3 pt-2 sm:gap-4">
                                        {field.value.map((src, index) => (
                                            <button
                                                key={src}
                                                type="button"
                                                aria-label={
                                                    index === 0
                                                        ? "Cover photo — click to remove"
                                                        : "Remove photo"
                                                }
                                                onClick={() =>
                                                    field.onChange(
                                                        field.value.filter((item) => item !== src),
                                                    )
                                                }
                                                className="
                                                  relative aspect-square overflow-hidden rounded-inner
                                                  border-2 border-brand block-28 inline-28
                                                  sm:block-36 sm:inline-36
                                                "
                                            >
                                                <AppImage
                                                    src={src}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    sizes="144px"
                                                />
                                                {index === 0 ? (
                                                    <span
                                                        className="
                                                          absolute inset-be-1 inset-s-1 rounded-sm
                                                          bg-ink/80 px-1.5 py-0.5 body-xs
                                                          font-semibold text-surface
                                                        "
                                                    >
                                                        Cover
                                                    </span>
                                                ) : null}
                                            </button>
                                        ))}

                                        {unused.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    field.onChange([...field.value, unused[0]!])
                                                }
                                                className="
                                                  flex aspect-square flex-col items-center
                                                  justify-center gap-1.5 rounded-inner border
                                                  border-dashed border-border-warm bg-surface
                                                  text-ink-muted transition-colors duration-160
                                                  block-28 inline-28
                                                  hover:border-brand hover:text-brand-text
                                                  sm:block-36 sm:inline-36
                                                "
                                            >
                                                <Camera
                                                    aria-hidden
                                                    className="block-6 inline-6"
                                                    strokeWidth={1.75}
                                                />
                                                <span className="body-xs font-medium">
                                                    Add photo
                                                </span>
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            }}
                        />
                        <FieldError>{errors.imageSrcs?.message as string | undefined}</FieldError>
                    </Field>
                </FieldGroup>
            </FormSection>

            <FormSection title="Ready to publish?" description="You can always change this later.">
                <div
                    className="
                      mb-4 flex items-start gap-3 rounded-card border border-border-warm
                      bg-surface px-4 py-3
                    "
                >
                    <UserRound
                        aria-hidden
                        className="mt-0.5 block-4.5 inline-4.5 shrink-0 text-ink-muted"
                        strokeWidth={1.75}
                    />
                    <p className="body-sm text-ink-muted">
                        This listing will be assigned to you. Your manager or the owner can move it
                        later.
                    </p>
                </div>

                <Controller
                    name="publish"
                    control={control}
                    render={({ field }) => (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => field.onChange(true)}
                                className={cn(
                                    `
                                      flex items-start gap-3 rounded-card border px-4 py-4 text-start
                                      transition-colors duration-160
                                    `,
                                    field.value
                                        ? "border-brand bg-brand-soft"
                                        : "border-border-warm bg-surface hover:border-brand/40",
                                )}
                            >
                                <Eye
                                    aria-hidden
                                    className={cn(
                                        "mt-0.5 block-5 inline-5 shrink-0",
                                        field.value ? "text-brand-text" : "text-ink-muted",
                                    )}
                                    strokeWidth={1.75}
                                />
                                <span className="flex flex-col gap-0.5">
                                    <span className="body-sm font-semibold text-ink">Publish</span>
                                    <span className="body-xs text-ink-muted">
                                        Live for brokers and buyers
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => field.onChange(false)}
                                className={cn(
                                    `
                                      flex items-start gap-3 rounded-card border px-4 py-4 text-start
                                      transition-colors duration-160
                                    `,
                                    !field.value
                                        ? "border-brand bg-brand-soft"
                                        : "border-border-warm bg-surface hover:border-brand/40",
                                )}
                            >
                                <EyeOff
                                    aria-hidden
                                    className={cn(
                                        "mt-0.5 block-5 inline-5 shrink-0",
                                        !field.value ? "text-brand-text" : "text-ink-muted",
                                    )}
                                    strokeWidth={1.75}
                                />
                                <span className="flex flex-col gap-0.5">
                                    <span className="body-sm font-semibold text-ink">
                                        Save as draft
                                    </span>
                                    <span className="body-xs text-ink-muted">
                                        Only your team can see it
                                    </span>
                                </span>
                            </button>
                        </div>
                    )}
                />
                <FieldDescription className="body-xs mt-3 text-ink-muted">
                    {publish
                        ? "Ready to publish when you save."
                        : "Saved as draft — publish later from your listings."}
                </FieldDescription>
            </FormSection>
        </div>
    );
}
