"use client";

import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Building2 } from "lucide-react";

import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";

import {
    LISTING_FOR_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    propertyTypeOptions,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    SelectField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import {
    CATEGORY_ICONS,
    LISTING_FOR_ICONS,
} from "@/features/properties/property-form/option-icons";

export function StepBasics() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const dealSwitchNotified = useRef(false);

    const category = watch("basics.category");

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        <Building2
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Listing type
                    </>
                }
                description="Start with the property and the kind of deal the owner wants."
            >
                <div className={FORM_STACK_CLASS}>
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={3}
                        icons={LISTING_FOR_ICONS}
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
                        columns={5}
                        icons={CATEGORY_ICONS}
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
                            // Listings are always measured in sq ft, including agricultural land.
                            if (!watch("area.carpetArea") && !watch("area.plotArea")) {
                                setValue("area.unit", "sqft", { shouldDirty: true });
                            }
                        }}
                    />
                    <SelectField
                        name="basics.propertyType"
                        label="Property type"
                        options={propertyTypeOptions(category)}
                        startIcon={Building2}
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
                </div>
            </WizardSection>
        </div>
    );
}
