"use client";

import {
    Bath,
    BedDouble,
    Briefcase,
    Building2,
    CalendarClock,
    Car,
    Coffee,
    Compass,
    DoorClosed,
    LayoutGrid,
    Layers,
    Monitor,
    MoveVertical,
    Route,
    Ruler,
    ShieldCheck,
    SquareParking,
    UserRound,
    Users,
    Wind,
    Zap,
} from "lucide-react";

import { useFieldRules } from "@/lib/visibility/use-field-rules";
import { cn } from "@/lib/utils";

import {
    BEDROOM_OPTIONS,
    FACING_OPTIONS,
    PANTRY_TYPE_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    SUITABLE_FOR_OPTIONS,
    WASHROOM_TYPE_OPTIONS,
} from "@/constants/property";
import {
    CounterField,
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
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

    return (
        <div className={FORM_SECTIONS_CLASS}>
            {roomDetails ? (
                <WizardSection
                    title={
                        <>
                            <LayoutGrid
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Rooms and layout
                        </>
                    }
                    description="Record the configuration people compare first."
                >
                    <div className={FORM_STACK_CLASS}>
                        <SelectField
                            name="details.bedrooms"
                            label="BHK"
                            options={BEDROOM_OPTIONS}
                            placeholder="Select BHK"
                            startIcon={BedDouble}
                        />
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <CounterField
                                name="details.bathrooms"
                                label="Bathrooms"
                                min={1}
                                max={10}
                                startIcon={Bath}
                            />
                            <CounterField
                                name="details.balconies"
                                label="Balconies"
                                max={5}
                                startIcon={Wind}
                            />
                            <CounterField
                                name="details.coveredParking"
                                label="Covered parking"
                                max={10}
                                startIcon={SquareParking}
                            />
                            <CounterField
                                name="details.openParking"
                                label="Open parking"
                                max={10}
                                startIcon={Car}
                            />
                        </div>
                    </div>
                </WizardSection>
            ) : null}

            <WizardSection
                title={
                    <>
                        <Building2
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Building facts
                    </>
                }
                description="These details help brokers qualify a visit before they call."
            >
                <div className={FORM_GRID_CLASS}>
                    <NumberField
                        name="details.floorNumber"
                        label="Floor number"
                        min={0}
                        max={200}
                        placeholder="e.g. 3"
                        startIcon={Layers}
                    />
                    <NumberField
                        name="details.totalFloors"
                        label="Total floors"
                        max={200}
                        placeholder="e.g. 12"
                        startIcon={Building2}
                    />
                    <SelectField
                        name="details.facing"
                        label="Facing"
                        options={FACING_OPTIONS}
                        placeholder="Select facing"
                        startIcon={Compass}
                    />
                    <NumberField
                        name="details.roadWidthFt"
                        label="Road width (ft)"
                        placeholder="e.g. 40"
                        startIcon={Route}
                    />
                    <NumberField
                        name="details.propertyAge"
                        label="How many years old?"
                        min={0}
                        max={100}
                        placeholder="e.g. 5"
                        hint="Enter 0 for a new property"
                        startIcon={CalendarClock}
                    />
                    <SelectField
                        name="details.propertyCondition"
                        label="Property condition"
                        options={PROPERTY_CONDITION_OPTIONS}
                        placeholder="Select condition"
                        startIcon={ShieldCheck}
                        className={cn(
                            !isVisible("details.roadWidthFt") && "md:col-span-2",
                        )}
                    />
                    <NumberField
                        name="details.electricityLoadKva"
                        label="Electricity load (kVA)"
                        step={0.1}
                        placeholder="e.g. 5"
                        startIcon={Zap}
                        className="md:col-span-2"
                    />
                </div>
            </WizardSection>

            {commercial ? (
                <WizardSection
                    title={
                        <>
                            <Briefcase
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Commercial setup
                        </>
                    }
                    description="Capture the details that determine business fit and operating cost."
                >
                    <div className={FORM_GRID_CLASS}>
                        <NumberField
                            name="details.commercial.cabins"
                            label="Cabins"
                            placeholder="e.g. 4"
                            startIcon={DoorClosed}
                        />
                        <NumberField
                            name="details.commercial.meetingRooms"
                            label="Meeting rooms"
                            placeholder="e.g. 2"
                            startIcon={Users}
                        />
                        <NumberField
                            name="details.commercial.workstations"
                            label="Workstations"
                            placeholder="e.g. 20"
                            startIcon={Monitor}
                        />
                        <NumberField
                            name="details.commercial.seats"
                            label="Seats"
                            placeholder="e.g. 40"
                            startIcon={Users}
                        />
                        <SelectField
                            name="details.commercial.washroomType"
                            label="Washrooms"
                            options={WASHROOM_TYPE_OPTIONS}
                            placeholder="Select washroom type"
                            startIcon={Bath}
                        />
                        <SelectField
                            name="details.commercial.pantryType"
                            label="Pantry"
                            options={PANTRY_TYPE_OPTIONS}
                            placeholder="Select pantry type"
                            startIcon={Coffee}
                        />
                        <NumberField
                            name="details.commercial.ceilingHeightFt"
                            label="Ceiling height (ft)"
                            step={0.1}
                            placeholder="e.g. 10"
                            startIcon={MoveVertical}
                        />
                        <NumberField
                            name="details.commercial.shutterWidthFt"
                            label="Shutter width (ft)"
                            step={0.1}
                            placeholder="e.g. 12"
                            startIcon={Ruler}
                        />
                        <NumberField
                            name="details.commercial.frontageFt"
                            label="Frontage (ft)"
                            step={0.1}
                            placeholder="e.g. 25"
                            startIcon={Ruler}
                        />
                    </div>
                    <div className="mbs-4 grid gap-4 sm:grid-cols-3">
                        <ToggleField name="details.commercial.centralAc" label="Central AC" />
                        <ToggleField name="details.commercial.fireNoc" label="Fire NOC" />
                        <ToggleField
                            name="details.commercial.occupancyCertificate"
                            label="Occupancy certificate"
                        />
                    </div>
                    <div className={`mbs-4 ${FORM_STACK_CLASS}`}>
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
                                placeholder="Tenant or company name"
                                visibility="private"
                                startIcon={UserRound}
                            />
                            <TextField
                                name="details.commercial.existingLeaseEndDate"
                                label="Lease ends"
                                type="date"
                                visibility="private"
                                startIcon={CalendarClock}
                            />
                        </div>
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}
