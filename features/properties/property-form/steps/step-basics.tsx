"use client";

import { useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Copy, Sparkles } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";

import { Button } from "@/components/ui/button";

import {
    LISTING_FOR_OPTIONS,
    LISTING_SOURCE_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_SUBTYPE_OPTIONS,
    propertyTypeOptions,
    toLabel,
    TRANSACTION_TYPE_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepBasics() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const [copying, setCopying] = useState(false);
    const dealSwitchNotified = useRef(false);
    const category = watch("basics.category");
    const listingFor = watch("basics.listingFor");
    const propertyType = watch("basics.propertyType");
    const bedrooms = watch("details.bedrooms");
    const locality = watch("location.locality");
    const city = watch("location.city");
    const suggestedTitle = useMemo(() => {
        const configuration =
            category === "residential" && bedrooms
                ? bedrooms === "1rk"
                    ? "1 RK"
                    : `${bedrooms} BHK`
                : "";
        const purpose = listingFor === "sell" ? "Sale" : listingFor === "pg" ? "PG" : "Rent";
        const place = [locality, city].filter(Boolean).join(", ") || "Surat";
        return [configuration, toLabel(propertyType), `for ${purpose}`, `in ${place}`]
            .filter(Boolean)
            .join(" ");
    }, [bedrooms, category, city, listingFor, locality, propertyType]);

    async function copyFromExisting() {
        setCopying(true);
        try {
            const result = await myListingsApi.list({ page: 1 });
            const listing = result.items[0];
            if (!listing) {
                toast("No existing property is available to copy.");
                return;
            }
            setValue("basics.category", listing.category, { shouldDirty: true });
            setValue(
                "basics.propertyType",
                listing.propertyType === "flat"
                    ? "apartment"
                    : listing.propertyType === "farmhouse"
                      ? "farm_house"
                      : listing.propertyType === "office"
                        ? "office_space"
                        : listing.propertyType === "plot"
                          ? "residential_plot"
                          : listing.propertyType === "agricultural"
                            ? "agricultural_land"
                            : listing.propertyType,
                { shouldDirty: true },
            );
            setValue("basics.description", listing.description, { shouldDirty: true });
            setValue("location.city", listing.city, { shouldDirty: true });
            setValue("location.locality", listing.locality, { shouldDirty: true });
            setValue("location.pincode", listing.pinCode, { shouldDirty: true });
            setValue("location.streetOrRoad", listing.address, { shouldDirty: true });
            setValue("area.carpetArea", listing.areaSqft, { shouldDirty: true });
            setValue("area.areaSqft", listing.areaSqft, { shouldDirty: true });
            setValue("details.bedrooms", String(listing.bhk || 2), { shouldDirty: true });
            setValue("details.bathrooms", listing.bathrooms, { shouldDirty: true });
            setValue("details.balconies", listing.balconies, { shouldDirty: true });
            toast.success(
                "Property details copied. Price, media, and owner details were left blank.",
            );
        } catch {
            toast.error("Couldn't load an existing property.");
        } finally {
            setCopying(false);
        }
    }

    return (
        <div className="space-y-8">
            <WizardSection
                title="What are you listing?"
                description="Start with the property and the kind of deal the owner wants."
            >
                <div className="space-y-6">
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={4}
                        onValueChange={() => {
                            if (dealSwitchNotified.current) return;
                            dealSwitchNotified.current = true;
                            toast("Sale and rent details are kept if you switch back.");
                        }}
                    />
                    <ChoiceField
                        name="basics.category"
                        label="Category"
                        options={PROPERTY_CATEGORY_OPTIONS}
                        columns={3}
                        onValueChange={(nextCategory) => {
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
                                setValue(
                                    "area.unit",
                                    nextCategory === "agricultural" ? "bigha" : "sqft",
                                    { shouldDirty: true },
                                );
                            }
                        }}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="basics.propertyType"
                            label="Property type"
                            options={propertyTypeOptions(category)}
                            onValueChange={() => {
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
                        <SelectField
                            name="basics.propertySubType"
                            label="Property subtype"
                            options={PROPERTY_SUBTYPE_OPTIONS}
                            placeholder="Optional"
                        />
                    </div>
                    <ChoiceField
                        name="basics.transactionType"
                        label="Transaction"
                        options={TRANSACTION_TYPE_OPTIONS}
                        columns={2}
                    />
                </div>
            </WizardSection>

            <WizardSection
                title="Listing story"
                description="Use plain details an owner or broker can scan quickly."
            >
                <div className="space-y-5">
                    <TextField
                        name="basics.title"
                        label="Listing title"
                        placeholder={suggestedTitle}
                    />
                    <Button
                        type="button"
                        variant="link"
                        size="md"
                        onClick={() =>
                            setValue("basics.title", suggestedTitle, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        className="
                          inline-flex items-center gap-2 rounded-control text-sm font-semibold
                          text-brand-text min-block-10
                          hover:underline
                          focus-visible:ring-3 focus-visible:ring-ring/30
                        "
                    >
                        <Sparkles className="block-4 inline-4" aria-hidden />
                        Use suggested title
                    </Button>
                    <TextAreaField
                        name="basics.description"
                        label="Description"
                        placeholder="Describe the layout, condition, surroundings, and what makes this property worth a visit."
                        hint="50–3,000 characters. This is shown on the listing."
                        rows={6}
                    />
                </div>
            </WizardSection>

            <WizardSection
                title="Lead source"
                description="Keep the origin of this listing in the broker record."
                tone="private"
            >
                <div className={FORM_GRID_CLASS}>
                    <SelectField
                        name="basics.listingSource"
                        label="How did this listing reach you?"
                        options={LISTING_SOURCE_OPTIONS}
                        visibility="private"
                    />
                    <TextField
                        name="basics.referredBy"
                        label="Referred by"
                        placeholder="Person or company name"
                        visibility="private"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="md"
                    loading={copying}
                    onClick={() => void copyFromExisting()}
                    className="mbs-5"
                >
                    <Copy aria-hidden />
                    Copy from another property
                </Button>
            </WizardSection>
        </div>
    );
}
