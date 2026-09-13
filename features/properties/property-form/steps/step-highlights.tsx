"use client";

import { useFormContext } from "react-hook-form";

import { Clock3, Plus, Trash2 } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";

import {
    CONSTRUCTION_STAGE_OPTIONS,
    KEY_HELD_BY_OPTIONS,
    PAYMENT_PLAN_OPTIONS,
    POSSESSION_TYPE_OPTIONS,
    SHOWING_CONTACT_OPTIONS,
    VISIT_DAY_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    MultiChipField,
    NumberField,
    SelectField,
    TagInputField,
    TextAreaField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepHighlights() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const { isVisible } = useFieldRules();
    const values = watch();
    const highlights = values.highlights.chips;
    const schedule = values.construction.paymentSchedule;
    const visitSlots = values.availability.visitTimeSlots;
    const suggestions = [
        values.details.cornerProperty ? "Corner property" : null,
        values.details.vastuCompliant ? "Vastu compliant" : null,
        values.details.overlooking.includes("garden") ? "Garden facing" : null,
        values.details.coveredParking ? "Covered parking" : null,
        values.location.landmark ? `Near ${values.location.landmark}`.slice(0, 40) : null,
        values.furnishing.status === "fully_furnished" ? "Fully furnished" : null,
    ].filter((item): item is string => Boolean(item));

    function addSuggestion(suggestion: string) {
        if (highlights.length >= 8 || highlights.includes(suggestion)) return;
        setValue("highlights.chips", [...highlights, suggestion], { shouldDirty: true });
    }

    return (
        <div className="space-y-8">
            <WizardSection
                title="Why should someone visit?"
                description="Use short, factual highlights that can be understood on a listing card."
            >
                {suggestions.length ? (
                    <div className="mbe-5">
                        <p className="mbe-2 text-sm font-semibold text-ink">
                            Suggested from your details
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                                <Button
                                    key={suggestion}
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => addSuggestion(suggestion)}
                                    disabled={
                                        highlights.includes(suggestion) || highlights.length >= 8
                                    }
                                    className="
                                      rounded-control border border-brand/25 bg-brand-soft px-3 py-2
                                      text-sm font-medium text-brand-text min-block-10
                                      hover:bg-brand-soft-hover
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                      disabled:opacity-40
                                    "
                                >
                                    <Plus
                                        className="me-1 inline block-3.5 inline-3.5"
                                        aria-hidden
                                    />{" "}
                                    {suggestion}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
                <div className="space-y-5">
                    <TagInputField
                        name="highlights.chips"
                        label="Highlights"
                        max={8}
                        placeholder="e.g. Quiet corner unit"
                        hint={`${highlights.length}/8 highlights`}
                    />
                    <TextField
                        name="highlights.uniqueSellingPoint"
                        label="One-line selling point"
                        placeholder="The clearest reason to consider this property"
                    />
                    <TextAreaField
                        name="highlights.whyBuyThis"
                        label={
                            values.basics.listingFor === "sell"
                                ? "Why buy this property?"
                                : "Why rent this property?"
                        }
                        placeholder="Share the owner's strongest practical reason."
                        rows={5}
                    />
                </div>
            </WizardSection>

            {isVisible("construction.possessionType") ||
            isVisible("construction.builderName") ||
            isVisible("construction.reraId") ? (
                <WizardSection
                    title="Construction and possession"
                    description="Show the official timeline beside the builder's working promise."
                >
                    <div className="space-y-5">
                        <ChoiceField
                            name="construction.possessionType"
                            label="Possession"
                            options={POSSESSION_TYPE_OPTIONS}
                            columns={3}
                        />
                        {isVisible("construction.possessionDate") ? (
                            <TextField
                                name="construction.possessionDate"
                                label="Possession month"
                                type="month"
                                min={new Date().toISOString().slice(0, 7)}
                            />
                        ) : null}
                        <div className={FORM_GRID_CLASS}>
                            <SelectField
                                name="construction.stage"
                                label="Construction stage"
                                options={CONSTRUCTION_STAGE_OPTIONS}
                            />
                            <NumberField
                                name="construction.progressPercent"
                                label="Progress (%)"
                                max={100}
                            />
                            <NumberField name="construction.slabsDone" label="Slabs complete" />
                            <NumberField name="construction.totalSlabs" label="Total slabs" />
                            <TextField name="construction.builderName" label="Builder name" />
                            <TextField name="construction.projectName" label="Project name" />
                        </div>
                        {isVisible("construction.reraId") ? (
                            <div className={FORM_GRID_CLASS}>
                                <TextField
                                    name="construction.reraId"
                                    label="RERA ID"
                                    placeholder="e.g. PR/GJ/SURAT/..."
                                    hint="Use the complete Gujarat RERA registration ID."
                                />
                                <TextField
                                    name="construction.reraPossessionDate"
                                    label="RERA possession date"
                                    type="date"
                                />
                                <TextField
                                    name="construction.builderPromisedDate"
                                    label="Builder promised date"
                                    type="date"
                                />
                                <TextField
                                    name="construction.ocCcExpectedDate"
                                    label="OC / CC expected"
                                    type="date"
                                />
                            </div>
                        ) : null}
                        <div className={FORM_GRID_CLASS}>
                            <SelectField
                                name="construction.paymentPlan"
                                label="Payment plan"
                                options={PAYMENT_PLAN_OPTIONS}
                            />
                            <ToggleField name="construction.bookingOpen" label="Booking open" />
                        </div>
                        {isVisible("construction.paymentSchedule") ? (
                            <div className="space-y-3">
                                {schedule.map((row, index) => (
                                    <div
                                        key={row.id}
                                        className="
                                          grid items-end gap-3 rounded-control border
                                          border-border-warm bg-surface p-3
                                          md:grid-cols-[1fr_0.35fr_0.6fr_auto]
                                        "
                                    >
                                        <TextField
                                            name={`construction.paymentSchedule.${index}.milestone`}
                                            label="Payment milestone"
                                        />
                                        <NumberField
                                            name={`construction.paymentSchedule.${index}.percent`}
                                            label="Percent"
                                            max={100}
                                        />
                                        <TextField
                                            name={`construction.paymentSchedule.${index}.dueOn`}
                                            label="Due on"
                                            type="date"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-lg"
                                            aria-label="Remove payment milestone"
                                            onClick={() =>
                                                setValue(
                                                    "construction.paymentSchedule",
                                                    schedule.filter(
                                                        (_, itemIndex) => itemIndex !== index,
                                                    ),
                                                    { shouldDirty: true },
                                                )
                                            }
                                            className="
                                              flex items-center justify-center rounded-control
                                              border border-border-warm text-danger block-12
                                              inline-12
                                              hover:bg-danger-soft
                                              focus-visible:ring-3 focus-visible:ring-danger/20
                                            "
                                        >
                                            <Trash2 className="block-4 inline-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() =>
                                        setValue(
                                            "construction.paymentSchedule",
                                            [
                                                ...schedule,
                                                {
                                                    id: createClientId("payment"),
                                                    milestone: "",
                                                    percent: 0,
                                                    dueOn: "",
                                                },
                                            ],
                                            { shouldDirty: true },
                                        )
                                    }
                                >
                                    <Plus aria-hidden /> Add payment milestone
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </WizardSection>
            ) : null}

            <WizardSection
                title="Visits and availability"
                description="Make it clear when the property can be shown and who has access."
            >
                <div className="space-y-5">
                    <MultiChipField
                        name="availability.visitDays"
                        label="Visit days"
                        options={VISIT_DAY_OPTIONS}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <NumberField
                            name="availability.advanceNoticeHours"
                            label="Advance notice (hours)"
                        />
                        <SelectField
                            name="availability.keyHeldBy"
                            label="Key held by"
                            options={KEY_HELD_BY_OPTIONS}
                        />
                        <SelectField
                            name="availability.showingContactPerson"
                            label="Showing contact"
                            options={SHOWING_CONTACT_OPTIONS}
                        />
                    </div>
                    {isVisible("availability.caretakerName") ? (
                        <div className={FORM_GRID_CLASS}>
                            <TextField
                                name="availability.caretakerName"
                                label="Caretaker name"
                                visibility="private"
                            />
                            <TextField
                                name="availability.caretakerPhone"
                                label="Caretaker phone"
                                inputMode="tel"
                                visibility="private"
                            />
                        </div>
                    ) : null}
                    <div className="space-y-3">
                        {visitSlots.map((slot, index) => (
                            <div
                                key={slot.id}
                                className="
                                  grid items-end gap-3 rounded-control border border-border-warm
                                  bg-surface p-3
                                  sm:grid-cols-[1fr_1fr_auto]
                                "
                            >
                                <TextField
                                    name={`availability.visitTimeSlots.${index}.from`}
                                    label="From"
                                    type="time"
                                />
                                <TextField
                                    name={`availability.visitTimeSlots.${index}.to`}
                                    label="To"
                                    type="time"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-lg"
                                    aria-label="Remove visit time"
                                    onClick={() =>
                                        setValue(
                                            "availability.visitTimeSlots",
                                            visitSlots.filter(
                                                (_, itemIndex) => itemIndex !== index,
                                            ),
                                            { shouldDirty: true },
                                        )
                                    }
                                    className="
                                      flex items-center justify-center rounded-control border
                                      border-border-warm text-danger block-12 inline-12
                                      hover:bg-danger-soft
                                      focus-visible:ring-3 focus-visible:ring-danger/20
                                    "
                                >
                                    <Trash2 className="block-4 inline-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() =>
                                setValue(
                                    "availability.visitTimeSlots",
                                    [
                                        ...visitSlots,
                                        { id: createClientId("visit"), from: "10:00", to: "13:00" },
                                    ],
                                    { shouldDirty: true },
                                )
                            }
                        >
                            <Clock3 aria-hidden /> Add visit time
                        </Button>
                    </div>
                </div>
            </WizardSection>
        </div>
    );
}
