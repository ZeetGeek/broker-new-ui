"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import {
    Bath,
    BedDouble,
    Briefcase,
    Building2,
    CalendarClock,
    Compass,
    DoorClosed,
    Layers,
    LayoutGrid,
    Monitor,
    MoveVertical,
    ShieldCheck,
    Sparkles,
    SquareParking,
    Type,
    Users,
    Wind,
    Zap,
} from "lucide-react";

import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";

import {
    FACING_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
    SUITABLE_FOR_OPTIONS,
} from "@/constants/property";
import {
    CounterField,
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    MultiChipField,
    NumberField,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepDetails() {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const { isVisible } = useFieldRules();
    const roomDetails = isVisible("details.bedrooms") || isVisible("details.bathrooms");
    const commercial =
        isVisible("details.commercial.suitableFor") ||
        isVisible("details.commercial.cabins") ||
        isVisible("details.commercial.meetingRooms") ||
        isVisible("details.commercial.ceilingHeightFt");
    const [titleTouched, setTitleTouched] = useState(() =>
        Boolean(getValues("basics.title")?.trim()),
    );

    const propertyType = watch("basics.propertyType");
    const bedrooms = watch("details.bedrooms");
    const locality = watch("location.locality");
    const city = watch("location.city");

    const suggestedTitle = useMemo(
        () =>
            buildBasicsSuggestedTitle({
                bedrooms,
                propertyType,
                locality,
                city,
            }),
        [bedrooms, city, locality, propertyType],
    );

    // Keep the title in sync until the user edits it.
    useEffect(() => {
        if (titleTouched || !suggestedTitle) return;
        setValue("basics.title", suggestedTitle, { shouldDirty: true, shouldValidate: true });
    }, [setValue, suggestedTitle, titleTouched]);

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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <CounterField
                            name="details.bedrooms"
                            label="BHK"
                            min={1}
                            max={10}
                            storeAsString
                            startIcon={BedDouble}
                        />
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
                            label="No. of parking"
                            max={10}
                            startIcon={SquareParking}
                        />
                    </div>
                </WizardSection>
            ) : null}

            <WizardSection
                title={
                    <>
                        <Type
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Title & description
                    </>
                }
                description="What buyers and tenants see on the listing."
            >
                <div className={FORM_STACK_CLASS}>
                    <TextField
                        name="basics.title"
                        label="Listing title"
                        placeholder={suggestedTitle || "e.g. 2 BHK Apartment in Vesu, Surat"}
                        hint="Auto-filled from BHK, type, locality, and city. You can edit it anytime."
                        startIcon={Type}
                        onChange={() => setTitleTouched(true)}
                        endAction={
                            suggestedTitle ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setValue("basics.title", suggestedTitle, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        });
                                        setTitleTouched(false);
                                    }}
                                    className="
                                      gap-1.5 rounded-control px-2.5 font-semibold text-brand-text
                                      hover:bg-brand-soft hover:text-brand-text
                                    "
                                >
                                    <Sparkles className="block-3.5 inline-3.5" aria-hidden />
                                    <span className="hidden sm:inline">Use suggested title</span>
                                    <span className="sm:hidden">Suggest</span>
                                </Button>
                            ) : null
                        }
                    />
                    <TextAreaField
                        name="basics.description"
                        label="Description"
                        placeholder="Describe the layout, condition, surroundings, and what makes this property worth a visit."
                        hint="50–3,000 characters. This is shown on the listing."
                        rows={5}
                    />
                </div>
            </WizardSection>

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
                        <NumberField
                            name="details.commercial.ceilingHeightFt"
                            label="Ceiling height (ft)"
                            step={0.1}
                            placeholder="e.g. 10"
                            startIcon={MoveVertical}
                        />
                    </div>
                    <div className={`mbs-4 ${FORM_STACK_CLASS}`}>
                        <MultiChipField
                            name="details.commercial.suitableFor"
                            label="Suitable for"
                            options={SUITABLE_FOR_OPTIONS}
                            allowCustom
                            customPlaceholder="e.g. cafe, tutoring centre…"
                            hint="Pick from the list or add your own use."
                        />
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}
