"use client";

import { useFieldRules } from "@/lib/visibility/use-field-rules";

import {
    APPROVED_BY_OPTIONS,
    BEDROOM_OPTIONS,
    FACING_OPTIONS,
    FLOOR_OPTIONS,
    FLOORING_TYPE_OPTIONS,
    OPEN_SIDE_OPTIONS,
    OVERLOOKING_OPTIONS,
    PANTRY_TYPE_OPTIONS,
    POWER_BACKUP_OPTIONS,
    PROPERTY_AGE_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    SOIL_TYPE_OPTIONS,
    SUITABLE_FOR_OPTIONS,
    WASHROOM_TYPE_OPTIONS,
    WATER_AVAILABILITY_OPTIONS,
    WATER_SOURCE_OPTIONS,
    ZONING_TYPE_OPTIONS,
} from "@/constants/property";
import {
    CounterField,
    FORM_GRID_CLASS,
    MultiChipField,
    NumberField,
    SelectField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepDetails() {
    const { isVisible } = useFieldRules();
    const roomDetails = isVisible("details.bedrooms") || isVisible("details.bathrooms");
    const commercial = isVisible("details.commercial.fireNoc");
    const land = isVisible("details.land.openSides");

    return (
        <div className="space-y-8">
            {roomDetails ? (
                <WizardSection
                    title="Rooms and layout"
                    description="Record the configuration people compare first."
                >
                    <div className="space-y-5">
                        <SelectField
                            name="details.bedrooms"
                            label="BHK"
                            options={BEDROOM_OPTIONS}
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <CounterField
                                name="details.bathrooms"
                                label="Bathrooms"
                                min={1}
                                max={10}
                            />
                            <CounterField name="details.balconies" label="Balconies" max={5} />
                            <CounterField
                                name="details.coveredParking"
                                label="Covered parking"
                                max={10}
                            />
                        </div>
                    </div>
                </WizardSection>
            ) : null}

            <WizardSection
                title="Building facts"
                description="These details help brokers qualify a visit before they call."
            >
                <div className={FORM_GRID_CLASS}>
                    <SelectField
                        name="details.floorNumber"
                        label="Floor number"
                        options={FLOOR_OPTIONS}
                    />
                    <NumberField name="details.totalFloors" label="Total floors" max={200} />
                    <SelectField
                        name="details.facing"
                        label="Facing"
                        options={FACING_OPTIONS}
                        placeholder="Optional"
                    />
                    <NumberField name="details.roadWidthFt" label="Road width (ft)" />
                    <SelectField
                        name="details.propertyAge"
                        label="Property age"
                        options={PROPERTY_AGE_OPTIONS}
                    />
                    <SelectField
                        name="details.propertyCondition"
                        label="Property condition"
                        options={PROPERTY_CONDITION_OPTIONS}
                    />
                    <CounterField name="details.openParking" label="Open parking" max={10} />
                    <SelectField
                        name="details.powerBackup"
                        label="Power backup"
                        options={POWER_BACKUP_OPTIONS}
                    />
                    <NumberField
                        name="details.electricityLoadKva"
                        label="Electricity load (kVA)"
                        step={0.1}
                    />
                    <SelectField
                        name="details.flooringType"
                        label="Flooring"
                        options={FLOORING_TYPE_OPTIONS}
                    />
                </div>
                <div className="mbs-5 space-y-5">
                    <MultiChipField
                        name="details.overlooking"
                        label="Overlooking"
                        options={OVERLOOKING_OPTIONS}
                    />
                    <MultiChipField
                        name="details.waterSource"
                        label="Water source"
                        options={WATER_SOURCE_OPTIONS}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <ToggleField name="details.cornerProperty" label="Corner property" />
                        <ToggleField name="details.vastuCompliant" label="Vastu compliant" />
                        <ToggleField
                            name="details.wheelchairFriendly"
                            label="Wheelchair friendly"
                        />
                    </div>
                </div>
            </WizardSection>

            {commercial ? (
                <WizardSection
                    title="Commercial setup"
                    description="Capture the details that determine business fit and operating cost."
                >
                    <div className={FORM_GRID_CLASS}>
                        <NumberField name="details.commercial.cabins" label="Cabins" />
                        <NumberField name="details.commercial.meetingRooms" label="Meeting rooms" />
                        <NumberField name="details.commercial.workstations" label="Workstations" />
                        <NumberField name="details.commercial.seats" label="Seats" />
                        <SelectField
                            name="details.commercial.washroomType"
                            label="Washrooms"
                            options={WASHROOM_TYPE_OPTIONS}
                        />
                        <SelectField
                            name="details.commercial.pantryType"
                            label="Pantry"
                            options={PANTRY_TYPE_OPTIONS}
                        />
                        <NumberField
                            name="details.commercial.ceilingHeightFt"
                            label="Ceiling height (ft)"
                            step={0.1}
                        />
                        <NumberField
                            name="details.commercial.shutterWidthFt"
                            label="Shutter width (ft)"
                            step={0.1}
                        />
                        <NumberField
                            name="details.commercial.frontageFt"
                            label="Frontage (ft)"
                            step={0.1}
                        />
                    </div>
                    <div className="mbs-5 grid gap-3 sm:grid-cols-3">
                        <ToggleField name="details.commercial.centralAc" label="Central AC" />
                        <ToggleField name="details.commercial.fireNoc" label="Fire NOC" />
                        <ToggleField
                            name="details.commercial.occupancyCertificate"
                            label="Occupancy certificate"
                        />
                    </div>
                    <div className="mbs-5 space-y-5">
                        <MultiChipField
                            name="details.commercial.suitableFor"
                            label="Suitable for"
                            options={SUITABLE_FOR_OPTIONS}
                        />
                        <ToggleField
                            name="details.commercial.currentlyLeased"
                            label="Currently leased"
                            description="Record the existing tenant for a pre-leased property."
                        />
                        <div className={FORM_GRID_CLASS}>
                            <TextField
                                name="details.commercial.existingTenantName"
                                label="Existing tenant"
                                visibility="private"
                            />
                            <TextField
                                name="details.commercial.existingLeaseEndDate"
                                label="Lease ends"
                                type="date"
                                visibility="private"
                            />
                        </div>
                    </div>
                </WizardSection>
            ) : null}

            {land ? (
                <WizardSection
                    title="Plot and land facts"
                    description="Measurements and approvals are the main decision points for land."
                >
                    <div className={FORM_GRID_CLASS}>
                        <NumberField
                            name="details.land.plotLengthFt"
                            label="Plot length (ft)"
                            step={0.1}
                        />
                        <NumberField
                            name="details.land.plotWidthFt"
                            label="Plot width (ft)"
                            step={0.1}
                        />
                        <SelectField
                            name="details.land.openSides"
                            label="Open sides"
                            options={OPEN_SIDE_OPTIONS}
                        />
                        <NumberField
                            name="details.land.constructionAllowedFloors"
                            label="Allowed floors"
                        />
                        <SelectField
                            name="details.land.zoningType"
                            label="Zoning"
                            options={ZONING_TYPE_OPTIONS}
                        />
                        <SelectField
                            name="details.land.soilType"
                            label="Soil type"
                            options={SOIL_TYPE_OPTIONS}
                        />
                        <SelectField
                            name="details.land.waterAvailability"
                            label="Water availability"
                            options={WATER_AVAILABILITY_OPTIONS}
                        />
                    </div>
                    <div className="mbs-5 space-y-5">
                        <MultiChipField
                            name="details.land.approvedBy"
                            label="Approved by"
                            options={APPROVED_BY_OPTIONS}
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <ToggleField name="details.land.boundaryWall" label="Boundary wall" />
                            <ToggleField name="details.land.gatedSociety" label="Gated society" />
                            <ToggleField
                                name="details.land.naOrderAvailable"
                                label="NA order available"
                            />
                        </div>
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}
