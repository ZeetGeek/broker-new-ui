"use client";

import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { ConditionalField } from "@/components/property/fields/conditional-field";

import {
    COMMERCIAL_AMENITIES,
    COMMERCIAL_FURNISHING_ITEMS,
    CONVENIENCE_AMENITIES,
    FLAT_FEATURES,
    FURNISHING_ITEM_OPTIONS,
    FURNISHING_OPTIONS,
    KITCHEN_TYPE_OPTIONS,
    optionList,
    RECREATION_AMENITIES,
    SOCIETY_AMENITIES,
} from "@/constants/property";
import {
    ChoiceField,
    CounterField,
    CurrencyField,
    FORM_GRID_CLASS,
    MultiChipField,
    SelectField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepFurnishing() {
    const { derived } = useFieldRules();
    const isCommercial = derived.isCommercial || derived.isIndustrial;
    const furnishingItems = isCommercial
        ? FURNISHING_ITEM_OPTIONS.filter((item) => COMMERCIAL_FURNISHING_ITEMS.has(item.value))
        : FURNISHING_ITEM_OPTIONS;

    return (
        <div className="space-y-8">
            <WizardSection
                title="Furnishing"
                description="Count what stays with the property so buyers and tenants know exactly what is included."
            >
                <div className="space-y-6">
                    <ChoiceField
                        name="furnishing.status"
                        label="Furnishing status"
                        options={FURNISHING_OPTIONS}
                        columns={3}
                    />
                    <ConditionalField path="furnishing.items">
                        <div>
                            <p className="mbe-3 text-sm font-semibold text-ink">Items included</p>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {furnishingItems.map((option) => (
                                    <CounterField
                                        key={option.value}
                                        name={`furnishing.items.${option.value}`}
                                        label={option.label}
                                        max={20}
                                    />
                                ))}
                            </div>
                        </div>
                    </ConditionalField>
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="furnishing.kitchenType"
                            label="Kitchen type"
                            options={KITCHEN_TYPE_OPTIONS}
                        />
                        <CurrencyField
                            name="furnishing.furnitureRentExtra"
                            label="Furniture rent extra"
                            hint="Use only when furniture has a separate monthly charge."
                        />
                    </div>
                    <ToggleField
                        name="furnishing.negotiable"
                        label="Furniture is negotiable"
                        description="Some items can be removed before handover."
                    />
                </div>
            </WizardSection>

            <WizardSection
                title="Amenities"
                description="Choose only what is present today. Groups change with the property category."
            >
                <div className="space-y-7">
                    {isCommercial ? (
                        <>
                            <MultiChipField
                                name="amenities.commercial"
                                label="Commercial facilities"
                                options={optionList(COMMERCIAL_AMENITIES)}
                            />
                            <MultiChipField
                                name="amenities.convenience"
                                label="Convenience"
                                options={optionList(CONVENIENCE_AMENITIES)}
                            />
                        </>
                    ) : (
                        <>
                            <MultiChipField
                                name="amenities.society"
                                label="Society essentials"
                                options={optionList(SOCIETY_AMENITIES)}
                            />
                            <MultiChipField
                                name="amenities.recreation"
                                label="Recreation"
                                options={optionList(RECREATION_AMENITIES)}
                            />
                            <MultiChipField
                                name="amenities.convenience"
                                label="Convenience"
                                options={optionList(CONVENIENCE_AMENITIES)}
                            />
                            <MultiChipField
                                name="amenities.flatFeatures"
                                label="Inside the property"
                                options={optionList(FLAT_FEATURES)}
                            />
                        </>
                    )}
                </div>
            </WizardSection>
        </div>
    );
}
