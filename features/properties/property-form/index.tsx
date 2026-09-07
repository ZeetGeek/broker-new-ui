"use client";

import { useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { buildPropertyTitle } from "@/lib/format/property-title";
import { duration, ease } from "@/lib/motion/tokens";
import { BROKER_YOUR_LISTINGS_HREF,brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import {
    categoryForPropertyType,
    DEFAULT_PROPERTY_FORM_VALUES,
    PROPERTY_FORM_STEP_FIELDS,
    PROPERTY_FORM_STEP_LABELS,
    PROPERTY_FORM_STEPS,
    propertyFormSchema,
    type PropertyFormStep,
    type PropertyFormValues,
    type PropertyType,
} from "@/lib/validation/property";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import { StepDetails } from "@/features/properties/property-form/step-details";
import { StepPhotos } from "@/features/properties/property-form/step-photos";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export function listingToFormValues(listing: MyListingItem): PropertyFormValues {
    return {
        transactionType: listing.transactionType,
        category: listing.category ?? categoryForPropertyType(listing.propertyType as PropertyType),
        propertyType: listing.propertyType as PropertyFormValues["propertyType"],
        bhk: listing.bhk,
        title:
            listing.title ||
            buildPropertyTitle({
                bhk: listing.bhk,
                propertyType: listing.propertyType as PropertyType,
                locality: listing.locality,
                city: listing.city,
            }),
        locality: listing.locality,
        city: listing.city,
        address: listing.address,
        pinCode: listing.pinCode,
        saleAmountInr: listing.saleAmountInr,
        rentAmountInr: listing.rentAmountInr,
        areaSqft: listing.areaSqft,
        furnishing: listing.furnishing,
        imageSrcs: listing.imageSrcs,
        bathrooms: listing.bathrooms,
        balconies: listing.balconies,
        floorNumber: listing.floorNumber,
        totalFloors: listing.totalFloors,
        facing: listing.facing,
        parking: listing.parking,
        maintenanceInr: listing.maintenanceInr,
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
    onCancel?: () => void;
    variant?: "dialog" | "page";
    className?: string;
    /** Required when variant is "dialog" */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export function PropertyForm({
    mode,
    propertyId,
    initialListing,
    onCancel,
    variant = "page",
    className,
    open = false,
    onOpenChange,
}: PropertyFormProps) {
    const router = useRouter();
    const isDialog = variant === "dialog";
    const [step, setStep] = useState<PropertyFormStep>("details");
    const [formBanner, setFormBanner] = useState<string | null>(null);
    const [titleTouched, setTitleTouched] = useState(mode === "edit");

    const defaultValues = useMemo(
        () => (initialListing ? listingToFormValues(initialListing) : DEFAULT_PROPERTY_FORM_VALUES),
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
        control,
        setValue,
        formState: { isSubmitting, errors },
    } = methods;

    const publish = useWatch({ control, name: "publish" });
    const stepIndex = PROPERTY_FORM_STEPS.indexOf(step);
    const heading = mode === "edit" ? "Edit property" : "Add property";

    async function goNext() {
        setFormBanner(null);
        const fields = PROPERTY_FORM_STEP_FIELDS[step];
        const ok = await trigger(fields);
        if (!ok) {
            const count = fields.filter((field) => methods.formState.errors[field]).length;
            setFormBanner(
                count > 0
                    ? `${count} field${count === 1 ? "" : "s"} need attention`
                    : "Please check the highlighted fields.",
            );
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
                onCancel?.();
                router.push(brokerPropertyDetailHref(updated.id));
                return;
            }

            const created = await myListingsApi.create(values);
            toast.success(
                values.publish ? "Property published. Brokers can now see it." : "Property added",
            );
            onCancel?.();
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

    function handleSkipForNow() {
        setValue("publish", false, { shouldDirty: true });
        void handleSubmit(onSubmit, onInvalid)();
    }

    function handleTabChange(next: string | number | null) {
        if (next !== "details" && next !== "photos") return;
        if (next === step) return;
        setFormBanner(null);
        setStep(next);
    }

    const footerLeft =
        stepIndex === 0 ? (
            onCancel ? (
                <Button
                    type="button"
                    variant="outline"
                    className="border-border-warm"
                    onClick={onCancel}
                >
                    <ArrowLeft aria-hidden className="block-4 inline-4" />
                    Cancel
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="border-border-warm"
                    render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                >
                    <ArrowLeft aria-hidden className="block-4 inline-4" />
                    Cancel
                </Button>
            )
        ) : (
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="border-border-warm"
                    onClick={goBack}
                >
                    <ArrowLeft aria-hidden className="block-4 inline-4" />
                    Back
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipForNow}
                    disabled={isSubmitting}
                >
                    Skip for now
                </Button>
            </div>
        );

    const footerRight =
        stepIndex < PROPERTY_FORM_STEPS.length - 1 ? (
            <Button
                type="button"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                onClick={() => void goNext()}
            >
                Continue
                <ArrowRight aria-hidden className="block-4 inline-4" />
            </Button>
        ) : (
            <Button
                type="submit"
                form={isDialog ? "property-form-dialog" : undefined}
                disabled={isSubmitting}
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
            >
                {isSubmitting
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save property"
                      : publish
                        ? "Publish listing"
                        : "Save draft"}
            </Button>
        );

    const stepBody = (
        <>
            {formBanner ? (
                <div
                    role="alert"
                    className="mbe-5 rounded-card border border-danger/30 bg-danger-soft px-4 py-3"
                >
                    <p className="body-sm font-medium text-danger">{formBanner}</p>
                </div>
            ) : null}
            {step === "details" ? (
                <StepDetails
                    titleTouched={titleTouched}
                    onTitleTouched={() => setTitleTouched(true)}
                />
            ) : null}
            {step === "photos" ? <StepPhotos /> : null}
        </>
    );

    const stepTabs = (
        <div
            role="tablist"
            aria-label="Property form steps"
            className="flex gap-1 rounded-full bg-surface-muted p-1 inline-full"
        >
            <AnimatedBackground
                defaultValue={step}
                onValueChange={(value) => handleTabChange(value)}
                className="rounded-full bg-surface shadow-xs"
                transition={{ duration: duration.tabs, ease: ease.smoothOut }}
            >
                {PROPERTY_FORM_STEPS.map((item) => {
                    const hasError = stepHasErrors(item, errors);
                    const isActive = item === step;
                    return (
                        <button
                            key={item}
                            type="button"
                            data-id={item}
                            role="tab"
                            aria-selected={isActive}
                            className={cn(
                                `
                                  body-sm flex-1 items-center justify-center rounded-full px-4
                                  font-medium transition-colors duration-160 block-10
                                  [&>div]:text-center [&>div]:inline-full
                                `,
                                isActive
                                    ? "text-foreground"
                                    : "text-foreground/60 hover:text-foreground",
                                hasError && !isActive ? "text-danger hover:text-danger" : undefined,
                            )}
                        >
                            {PROPERTY_FORM_STEP_LABELS[item]}
                        </button>
                    );
                })}
            </AnimatedBackground>
        </div>
    );

    const stepDescription =
        step === "details"
            ? "Tell us what you’re listing and where it is."
            : "Add photos, then choose publish or draft.";

    if (isDialog) {
        return (
            <FormProvider {...methods}>
                <AppModal
                    open={open}
                    onOpenChange={onOpenChange ?? (() => undefined)}
                    title={heading}
                    description={stepDescription}
                    size="xl"
                    padding="lg"
                    showCloseButton
                    header={stepTabs}
                    footer={
                        <>
                            {footerLeft}
                            {footerRight}
                        </>
                    }
                    className={className}
                >
                    <form
                        id="property-form-dialog"
                        onSubmit={handleSubmit(onSubmit, onInvalid)}
                        noValidate
                        className="flex flex-col"
                    >
                        {stepBody}
                    </form>
                </AppModal>
            </FormProvider>
        );
    }

    return (
        <FormProvider {...methods}>
            <form
                className={cn("mx-auto flex flex-col gap-6 inline-full max-inline-6xl", className)}
                onSubmit={handleSubmit(onSubmit, onInvalid)}
                noValidate
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="display-md">{heading}</h1>
                        <p className="body text-ink-muted">{stepDescription}</p>
                    </div>
                    {stepTabs}
                </div>

                {stepBody}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {footerLeft}
                    {footerRight}
                </div>
            </form>
        </FormProvider>
    );
}
