"use client";

import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";

import { myListingsApi } from "@/lib/api/my-listings";
import {
    brokerPropertyDetailHref,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import {
    DEFAULT_PROPERTY_FORM_VALUES,
    PROPERTY_FORM_STEP_FIELDS,
    PROPERTY_FORM_STEP_LABELS,
    PROPERTY_FORM_STEPS,
    propertyFormSchema,
    type PropertyFormStep,
    type PropertyFormValues,
} from "@/lib/validation/property";

import { Button } from "@/components/ui/button";

import { StepBasics } from "@/features/properties/property-form/step-basics";
import { StepExtras } from "@/features/properties/property-form/step-extras";
import { StepPricePhotos } from "@/features/properties/property-form/step-price-photos";
import type { MyListingItem } from "@/features/properties/your-listings/types";

function listingToFormValues(listing: MyListingItem): PropertyFormValues {
    return {
        transactionType: listing.transactionType,
        propertyType: listing.propertyType,
        bhk: listing.bhk,
        locality: listing.locality,
        city: listing.city,
        address: listing.address,
        pinCode: listing.pinCode,
        saleAmountInr: listing.saleAmountInr,
        rentAmountInr: listing.rentAmountInr,
        areaSqft: listing.areaSqft,
        furnishing: listing.furnishing,
        imageSrcs: listing.imageSrcs,
        availableFrom: listing.availableFrom,
        description: listing.description,
        amenities: listing.amenities,
        publish: listing.status === "published",
    };
}

function stepHasErrors(
    step: PropertyFormStep,
    errors: Partial<Record<keyof PropertyFormValues, unknown>>,
): boolean {
    return PROPERTY_FORM_STEP_FIELDS[step].some((field) => errors[field] != null);
}

export type PropertyFormProps = {
    mode: "create" | "edit";
    propertyId?: string;
    initialListing?: MyListingItem | null;
};

export function PropertyForm({ mode, propertyId, initialListing }: PropertyFormProps) {
    const router = useRouter();
    const [step, setStep] = useState<PropertyFormStep>("basics");
    const [formBanner, setFormBanner] = useState<string | null>(null);

    const defaultValues = useMemo(
        () =>
            initialListing ? listingToFormValues(initialListing) : DEFAULT_PROPERTY_FORM_VALUES,
        [initialListing],
    );

    const methods = useForm<PropertyFormValues>({
        resolver: zodResolver(propertyFormSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues,
    });

    const {
        handleSubmit,
        trigger,
        formState: { isSubmitting, errors },
    } = methods;

    const stepIndex = PROPERTY_FORM_STEPS.indexOf(step);

    async function goNext() {
        setFormBanner(null);
        const fields = PROPERTY_FORM_STEP_FIELDS[step];
        const ok = await trigger(fields);
        if (!ok) {
            const problemSteps = PROPERTY_FORM_STEPS.filter((item) =>
                stepHasErrors(item, errors),
            );
            const count = fields.filter((field) => methods.formState.errors[field]).length;
            setFormBanner(
                count > 0
                    ? `${count} field${count === 1 ? "" : "s"} need attention`
                    : "Please check the highlighted fields.",
            );
            if (problemSteps[0] && problemSteps[0] !== step) {
                setStep(problemSteps[0]);
            }
            return;
        }
        const next = PROPERTY_FORM_STEPS[stepIndex + 1];
        if (next) setStep(next);
    }

    function goBack() {
        setFormBanner(null);
        const prev = PROPERTY_FORM_STEPS[stepIndex - 1];
        if (prev) setStep(prev);
    }

    async function onSubmit(values: PropertyFormValues) {
        setFormBanner(null);
        try {
            if (mode === "edit" && propertyId) {
                const updated = await myListingsApi.update(propertyId, {
                    ...values,
                    status: values.publish
                        ? "published"
                        : initialListing?.status === "unpublished"
                          ? "unpublished"
                          : "draft",
                });
                if (!updated) {
                    setFormBanner("Couldn't find that property.");
                    return;
                }
                toast.success(
                    values.publish
                        ? "Property published. Brokers can now see it."
                        : "Property saved",
                );
                router.push(brokerPropertyDetailHref(updated.id));
                return;
            }

            const created = await myListingsApi.create(values);
            toast.success(
                values.publish ? "Property published. Brokers can now see it." : "Property added",
            );
            router.push(brokerPropertyDetailHref(created.id));
        } catch {
            setFormBanner("Something went wrong on our side. Try again in a moment.");
        }
    }

    async function onInvalid() {
        const problemSteps = PROPERTY_FORM_STEPS.filter((item) =>
            stepHasErrors(item, methods.formState.errors),
        );
        const total = Object.keys(methods.formState.errors).length;
        setFormBanner(
            total > 0
                ? `${total} field${total === 1 ? "" : "s"} need attention`
                : "Please check the highlighted fields.",
        );
        if (problemSteps[0]) setStep(problemSteps[0]);
    }

    return (
        <FormProvider {...methods}>
            <form
                className="mx-auto flex w-full max-w-2xl flex-col gap-6"
                onSubmit={handleSubmit(onSubmit, onInvalid)}
                noValidate
            >
                <div className="flex flex-col gap-2">
                    <h1 className="display-md">
                        {mode === "edit" ? "Edit property" : "Add property"}
                    </h1>
                    <p className="body text-ink-muted">
                        Step {stepIndex + 1} of {PROPERTY_FORM_STEPS.length} —{" "}
                        {PROPERTY_FORM_STEP_LABELS[step]}
                    </p>
                </div>

                <ol className="flex flex-wrap gap-2">
                    {PROPERTY_FORM_STEPS.map((item, index) => {
                        const active = item === step;
                        const hasError = stepHasErrors(item, errors);
                        return (
                            <li key={item}>
                                <button
                                    type="button"
                                    onClick={() => setStep(item)}
                                    className={cn(
                                        "body-sm rounded-full px-3 py-1.5 transition-colors duration-160",
                                        active
                                            ? "bg-ink font-semibold text-surface"
                                            : hasError
                                              ? "bg-danger-soft font-medium text-danger"
                                              : "bg-surface text-ink-muted hover:text-ink",
                                    )}
                                >
                                    {index + 1}. {PROPERTY_FORM_STEP_LABELS[item]}
                                </button>
                            </li>
                        );
                    })}
                </ol>

                {formBanner ? (
                    <div
                        role="alert"
                        className="rounded-card border border-danger/30 bg-danger-soft px-4 py-3"
                    >
                        <p className="body-sm font-medium text-danger">{formBanner}</p>
                    </div>
                ) : null}

                <div className="rounded-card border border-border-warm bg-surface p-4 sm:p-6">
                    {step === "basics" ? <StepBasics /> : null}
                    {step === "price_photos" ? <StepPricePhotos /> : null}
                    {step === "extras" ? <StepExtras /> : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-border-warm"
                        render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                    >
                        Cancel
                    </Button>

                    <div className="flex gap-2">
                        {stepIndex > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-border-warm"
                                onClick={goBack}
                            >
                                Back
                            </Button>
                        ) : null}

                        {stepIndex < PROPERTY_FORM_STEPS.length - 1 ? (
                            <Button
                                type="button"
                                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                                onClick={() => void goNext()}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                            >
                                {isSubmitting
                                    ? "Saving…"
                                    : mode === "edit"
                                      ? "Save property"
                                      : "Save property"}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
