"use client";

import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { BadgeCheck, CircleAlert, TriangleAlert } from "lucide-react";

import type { PropertyDraftValues } from "@/lib/schemas/property";

import { Button } from "@/components/ui/button";

import {
    CONTACT_DISPLAY_OPTIONS,
    CONTACT_TIME_OPTIONS,
    LANGUAGE_OPTIONS,
    LISTER_TYPE_OPTIONS,
    LISTING_STATUS_OPTIONS,
    VISIBILITY_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    MultiChipField,
    SelectField,
    TagInputField,
    TextAreaField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepPublish() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const ownerPhone = watch("owner.phone");
    const verified = watch("owner.phoneVerified");
    const isNri = watch("owner.isNri");
    const values = watch();
    const photoTags = new Set(values.media.photos.map((photo) => photo.tag));
    const softWarnings = [
        values.basics.listingFor === "sell" &&
        values.commission.sale.mode === "percent" &&
        (values.commission.sale.value < 1 || values.commission.sale.value > 4)
            ? "Commission is outside the usual 1%–4% review range."
            : null,
        !photoTags.has("kitchen") || !photoTags.has("bathroom")
            ? "Add both a kitchen and bathroom photo when they apply."
            : null,
        values.documents.length === 0 ? "No property documents have been added yet." : null,
        values.basics.description.trim().length < 100
            ? "A description of 100+ characters helps people qualify the property."
            : null,
    ].filter((warning): warning is string => Boolean(warning));

    function verifyPhone() {
        if (!/^[6-9]\d{9}$/.test(ownerPhone)) {
            toast.error("Enter a valid mobile number first.");
            return;
        }
        setValue("owner.phoneVerified", true, { shouldDirty: true });
        toast.success("Phone marked as verified for this draft.");
    }

    return (
        <div className="space-y-8">
            {softWarnings.length ? (
                <div
                    role="status"
                    className="rounded-card border border-urgent/30 bg-urgent-soft p-4 text-urgent"
                >
                    <div className="flex items-center gap-2">
                        <TriangleAlert className="block-4 inline-4" aria-hidden />
                        <p className="text-sm font-bold">Review before publishing</p>
                    </div>
                    <ul className="mbs-3 list-disc space-y-1 ps-5 text-sm/6">
                        {softWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-urgent/75">
                        These are helpful checks, not blockers. Locality price comparison will
                        appear when market data is connected.
                    </p>
                </div>
            ) : null}
            <WizardSection
                title="Owner record"
                description="Contact details stay private and are used only to work the listing."
                tone="private"
            >
                <div className="space-y-5">
                    <ChoiceField
                        name="owner.listerType"
                        label="Listed by"
                        options={LISTER_TYPE_OPTIONS}
                        columns={3}
                        visibility="private"
                    />
                    <div className={FORM_GRID_CLASS}>
                        <TextField
                            name="owner.name"
                            label="Owner name"
                            placeholder="Full name"
                            visibility="private"
                        />
                        <div className="space-y-2">
                            <TextField
                                name="owner.phone"
                                label="Mobile number"
                                inputMode="tel"
                                maxLength={10}
                                placeholder="9876543210"
                                visibility="private"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={verifyPhone}
                                disabled={verified}
                            >
                                <BadgeCheck aria-hidden />{" "}
                                {verified ? "Phone verified" : "Verify phone"}
                            </Button>
                        </div>
                        <TextField
                            name="owner.altPhone"
                            label="Alternate phone"
                            inputMode="tel"
                            visibility="private"
                        />
                        <TextField
                            name="owner.email"
                            label="Email"
                            type="email"
                            visibility="private"
                        />
                        <SelectField
                            name="owner.preferredContactTime"
                            label="Best time to call"
                            options={CONTACT_TIME_OPTIONS}
                            visibility="private"
                        />
                        <TextField name="owner.city" label="Owner's city" visibility="private" />
                    </div>
                    <MultiChipField
                        name="owner.preferredLanguage"
                        label="Preferred language"
                        options={LANGUAGE_OPTIONS}
                        visibility="private"
                    />
                    <ToggleField
                        name="owner.whatsappSameAsPhone"
                        label="WhatsApp is the same number"
                        visibility="private"
                    />
                    <TextField
                        name="owner.whatsappNumber"
                        label="WhatsApp number"
                        inputMode="tel"
                        visibility="private"
                    />
                    <ToggleField
                        name="owner.isNri"
                        label="NRI owner"
                        description="Keep this as a review flag; property-sale tax rules are not calculated here."
                        visibility="private"
                    />
                    {isNri ? (
                        <div
                            className="
                              flex gap-3 rounded-control border border-urgent/30 bg-urgent-soft px-4
                              py-3 text-sm text-urgent
                            "
                        >
                            <CircleAlert
                                className="mbs-0.5 shrink-0 block-4 inline-4"
                                aria-hidden
                            />
                            Confirm NRI tax and document requirements with a qualified advisor
                            before closing the deal.
                        </div>
                    ) : null}
                    <TextAreaField
                        name="owner.notes"
                        label="Owner notes"
                        placeholder="Contact preferences, decision makers, or follow-up context"
                        visibility="private"
                    />
                </div>
            </WizardSection>

            <WizardSection
                title="Publish settings"
                description="Choose who can see the property and whether it is ready to go live."
            >
                <div className="space-y-5">
                    <SelectField
                        name="publish.status"
                        label="Listing status"
                        options={LISTING_STATUS_OPTIONS}
                    />
                    <ChoiceField
                        name="publish.visibility"
                        label="Who can see it?"
                        options={VISIBILITY_OPTIONS}
                        columns={3}
                    />
                    <ChoiceField
                        name="publish.contactDisplay"
                        label="Contact shown on the listing"
                        options={CONTACT_DISPLAY_OPTIONS}
                        columns={2}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <TextField
                            name="publish.expiryDate"
                            label="Listing expiry date"
                            type="date"
                        />
                        <ToggleField
                            name="publish.autoRenew"
                            label="Auto-renew listing"
                            description="Keep the listing active after its expiry date."
                        />
                    </div>
                    <TagInputField
                        name="publish.internalTags"
                        label="Internal tags"
                        placeholder="e.g. investor lead"
                        visibility="private"
                        hint="Private tags help you find the listing later."
                    />
                </div>
            </WizardSection>
        </div>
    );
}
