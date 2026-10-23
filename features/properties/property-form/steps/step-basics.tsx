"use client";

import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";

import { Home, LayoutGrid, Tag } from "@/components/shared/icons";

import {
    LISTING_FOR_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    propertyTypeOptions,
} from "@/constants/property";
import {
    FORM_GRID_3_CLASS,
    FORM_SECTIONS_CLASS,
    SelectField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepBasics() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const dealSwitchNotified = useRef(false);

    const category = watch("basics.category");

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={<>Listing type</>}
                description="Start with the property and the kind of deal the owner wants."
            >
                <div className={FORM_GRID_3_CLASS}>
                    <SelectField
                        name="basics.listingFor"
                        label="Listing for"
                        startIcon={Tag}
                        options={LISTING_FOR_OPTIONS}
                        onValueChange={() => {
                            if (dealSwitchNotified.current) return;
                            dealSwitchNotified.current = true;
                            toast("Sale and rent details are kept if you switch back.");
                        }}
                    />
                    <SelectField
                        name="basics.category"
                        label="Category"
                        startIcon={LayoutGrid}
                        options={PROPERTY_CATEGORY_OPTIONS}
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
                        startIcon={Home}
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
                </div>
            </WizardSection>
        </div>
    );
}
