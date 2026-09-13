"use client";

import { useMemo, useState } from "react";

import { contactsApi } from "@/lib/api/contacts";
import { formatIndianPrice } from "@/lib/format/price";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import {
    AMENITIES,
    BHK_OPTIONS,
    type BuyerContactForm,
    emptyBuyerForm,
    moneyToRupees,
    normalizeIndianPhone,
    PROPERTY_TYPES,
    showBuyerBhk,
    validateBuyerStep,
} from "@/features/contacts/contact-form-model";
import {
    ChipPicker,
    ContactFormDrawer,
    DraftRestoreBar,
    FormField,
    LocalityPicker,
    nativeControlClass,
    NotesField,
    Segmented,
    SelectField,
    TagPicker,
    TextField,
    ToggleRow,
    useContactDraft,
} from "@/features/contacts/contact-form-ui";
import type { BuyerRow } from "@/features/contacts/types";

const STEPS = ["Basic details", "Requirement", "Finance", "Lead tracking"];
const DRAFT_KEY = "yb.contacts.buyer.draft.v2";

const option = (value: string, label = value) => ({ value, label });

function buyerValues(row: BuyerRow | null): BuyerContactForm {
    if (!row) return emptyBuyerForm();
    if (row.details) return { ...emptyBuyerForm(), ...row.details };
    return {
        ...emptyBuyerForm(),
        name: row.name,
        phone: row.phoneDigits,
        email: row.email ?? "",
        intent: row.lookingFor,
        propertyTypes: row.propertyKind === "any" ? [] : [row.propertyKind],
        configurations: row.bhk ? [`${row.bhk} BHK`] : [],
        budgetMin: row.budgetMinInr ? String(row.budgetMinInr / 100_000) : "",
        budgetMax: row.budgetMaxInr ? String(row.budgetMaxInr / 100_000) : "",
        localities: row.preferredLocalities,
        source: row.source === "referral" ? "reference" : (row.source ?? ""),
        notes: row.notes ?? "",
        lastSpokeAt: row.lastContactedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    };
}

function TwoColumns({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function DuplicateWarning({
    match,
    onContinue,
}: {
    match: { id: string; name: string; type: "buyer" | "owner" };
    onContinue: () => void;
}) {
    return (
        <div
            className="border-warning/40 bg-warning-soft rounded-inner border px-3.5 py-3"
            role="status"
        >
            <p className="body-sm text-ink">
                This number is already saved as <strong>{match.name}</strong> ({match.type}).
            </p>
            <div className="mbs-2 flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.assign(`/broker/contacts?open=${match.id}`)}
                >
                    Open existing
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onContinue}>
                    Continue anyway
                </Button>
            </div>
        </div>
    );
}

export function AddBuyerModal({
    open,
    onOpenChange,
    onCreated,
    buyer = null,
    onUpdated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (name: string) => void;
    buyer?: BuyerRow | null;
    onUpdated?: (name: string) => void;
}) {
    const isEdit = Boolean(buyer);
    const [values, setValues] = useState<BuyerContactForm>(() => buyerValues(buyer));
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [duplicate, setDuplicate] = useState<{
        id: string;
        name: string;
        type: "buyer" | "owner";
    } | null>(null);
    const [checkingPhone, setCheckingPhone] = useState(false);

    const draftState = useContactDraft(DRAFT_KEY, open, values, dirty && !isEdit);
    const set = <K extends keyof BuyerContactForm>(key: K, value: BuyerContactForm[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
        setDirty(true);
    };

    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setValues(buyerValues(buyer));
            setStep(0);
            setErrors({});
            setDirty(false);
            setSubmitError("");
            setDuplicate(null);
        }
    }

    const priceUnit = values.intent === "buy" ? values.budgetUnit : undefined;
    const budgetHint = useMemo(() => {
        const min = moneyToRupees(values.budgetMin, priceUnit);
        const max = moneyToRupees(values.budgetMax, priceUnit);
        if (!min && !max) return "";
        const suffixIntent = values.intent === "rent" ? "rent" : "buy";
        return [
            min ? formatIndianPrice(min, suffixIntent) : null,
            max ? formatIndianPrice(max, suffixIntent) : null,
        ]
            .filter(Boolean)
            .join(" – ");
    }, [priceUnit, values.budgetMax, values.budgetMin, values.intent]);

    const checkDuplicate = async () => {
        const phone = normalizeIndianPhone(values.phone);
        if (!/^[6-9]\d{9}$/.test(phone)) return;
        setCheckingPhone(true);
        try {
            const match = await contactsApi.checkDuplicate(phone);
            if (match && match.id !== buyer?.id) setDuplicate(match);
        } finally {
            setCheckingPhone(false);
        }
    };

    const save = async (addAnother: boolean) => {
        const nextErrors = validateBuyerStep(values, 3);
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }
        setBusy(true);
        setSubmitError("");
        try {
            await contactsApi.saveBuyer(values, buyer?.id);
            draftState.clear();
            if (buyer) onUpdated?.(values.name.trim());
            else onCreated(values.name.trim());
            if (addAnother) {
                setValues(emptyBuyerForm());
                setStep(0);
                setDirty(false);
            } else {
                setDirty(false);
                onOpenChange(false);
            }
        } catch (error) {
            setSubmitError(
                error instanceof Error ? error.message : "Could not save this buyer. Try again.",
            );
        } finally {
            setBusy(false);
        }
    };

    const next = () => {
        const nextErrors = validateBuyerStep(values, step);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        if (step < STEPS.length - 1) setStep((current) => current + 1);
        else void save(false);
    };

    return (
        <ContactFormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit buyer" : "Add buyer"}
            description="Capture their requirement once, then match them to your private listings."
            step={step}
            steps={STEPS}
            isDirty={dirty}
            busy={busy}
            onBack={() => setStep((current) => Math.max(0, current - 1))}
            onNext={next}
            onSaveAnother={isEdit ? undefined : () => void save(true)}
            header={
                !isEdit && draftState.draft ? (
                    <DraftRestoreBar
                        onRestore={() => {
                            setValues({ ...emptyBuyerForm(), ...draftState.draft });
                            draftState.dismiss();
                            setDirty(true);
                        }}
                        onDiscard={draftState.clear}
                    />
                ) : undefined
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    next();
                }}
                className="flex flex-col gap-5"
                noValidate
            >
                {step === 0 ? (
                    <>
                        <TwoColumns>
                            <TextField
                                label="Full name"
                                required
                                value={values.name}
                                onChange={(event) => set("name", event.target.value)}
                                error={errors.name}
                                placeholder="Ankit Shah"
                                autoComplete="name"
                            />
                            <TextField
                                label="Phone number"
                                required
                                value={values.phone}
                                onChange={(event) => set("phone", event.target.value)}
                                onBlur={() => void checkDuplicate()}
                                error={errors.phone}
                                loading={checkingPhone}
                                startIcon={undefined}
                                inputMode="tel"
                                placeholder="98765 43210"
                                helperText="+91"
                                autoComplete="tel"
                            />
                        </TwoColumns>
                        {duplicate ? (
                            <DuplicateWarning
                                match={duplicate}
                                onContinue={() => setDuplicate(null)}
                            />
                        ) : null}
                        <ToggleRow
                            checked={values.whatsappSame}
                            onChange={(checked) => set("whatsappSame", checked)}
                            label="WhatsApp is the same as phone"
                        />
                        {!values.whatsappSame ? (
                            <TextField
                                label="WhatsApp number"
                                value={values.whatsapp}
                                onChange={(event) => set("whatsapp", event.target.value)}
                                error={errors.whatsapp}
                                inputMode="tel"
                                helperText="+91"
                            />
                        ) : null}
                        <TwoColumns>
                            <TextField
                                label="Alternate phone"
                                value={values.altPhone}
                                onChange={(event) => set("altPhone", event.target.value)}
                                error={errors.altPhone}
                                inputMode="tel"
                                placeholder="Optional"
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={values.email}
                                onChange={(event) => set("email", event.target.value)}
                                error={errors.email}
                                placeholder="Optional"
                                autoComplete="email"
                            />
                        </TwoColumns>
                        <SelectField
                            label="Buyer type"
                            value={values.buyerType}
                            onChange={(value) => set("buyerType", value)}
                            options={[
                                option("individual", "Individual"),
                                option("family", "Family"),
                                option("investor", "Investor"),
                                option("nri", "NRI"),
                                option("company", "Company"),
                            ]}
                        />
                    </>
                ) : null}

                {step === 1 ? (
                    <>
                        <Segmented
                            label="Looking to"
                            value={values.intent}
                            onChange={(value) => set("intent", value as BuyerContactForm["intent"])}
                            options={[option("buy", "Buy"), option("rent", "Rent")]}
                        />
                        <ChipPicker
                            label="Property type"
                            required
                            values={values.propertyTypes}
                            options={PROPERTY_TYPES}
                            onChange={(next) => set("propertyTypes", next)}
                            error={errors.propertyTypes}
                        />
                        {showBuyerBhk(values) ? (
                            <ChipPicker
                                label="Configuration (BHK)"
                                required
                                values={values.configurations}
                                options={BHK_OPTIONS}
                                onChange={(next) => set("configurations", next)}
                                error={errors.configurations}
                            />
                        ) : null}
                        <FormField
                            label={values.intent === "rent" ? "Monthly rent" : "Budget"}
                            required
                            error={errors.budgetMin || errors.budgetMax}
                            hint={budgetHint}
                        >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                                <input
                                    className={nativeControlClass}
                                    inputMode="decimal"
                                    value={values.budgetMin}
                                    onChange={(event) => set("budgetMin", event.target.value)}
                                    placeholder="Minimum"
                                    aria-label="Minimum budget"
                                />
                                <input
                                    className={nativeControlClass}
                                    inputMode="decimal"
                                    value={values.budgetMax}
                                    onChange={(event) => set("budgetMax", event.target.value)}
                                    placeholder="Maximum"
                                    aria-label="Maximum budget"
                                />
                                {values.intent === "buy" ? (
                                    <select
                                        className={nativeControlClass}
                                        value={values.budgetUnit}
                                        onChange={(event) =>
                                            set(
                                                "budgetUnit",
                                                event.target.value as "lakh" | "crore",
                                            )
                                        }
                                        aria-label="Budget unit"
                                    >
                                        <option value="lakh">Lakh</option>
                                        <option value="crore">Crore</option>
                                    </select>
                                ) : (
                                    <span
                                        className="
                                      body-sm flex items-center rounded-control bg-surface-muted
                                      px-3.5 text-ink-muted
                                    "
                                    >
                                        ₹ per month
                                    </span>
                                )}
                            </div>
                        </FormField>
                        <FormField
                            label="Area size"
                            required={values.propertyTypes.includes("Plot")}
                            error={errors.areaMin}
                        >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_9rem]">
                                <input
                                    className={nativeControlClass}
                                    type="number"
                                    min="0"
                                    value={values.areaMin}
                                    onChange={(event) => set("areaMin", event.target.value)}
                                    placeholder="Minimum"
                                    aria-label="Minimum area"
                                />
                                <input
                                    className={nativeControlClass}
                                    type="number"
                                    min="0"
                                    value={values.areaMax}
                                    onChange={(event) => set("areaMax", event.target.value)}
                                    placeholder="Maximum"
                                    aria-label="Maximum area"
                                />
                                <select
                                    className={nativeControlClass}
                                    value={values.areaUnit}
                                    onChange={(event) => set("areaUnit", event.target.value)}
                                    aria-label="Area unit"
                                >
                                    <option>sq ft</option>
                                    <option>sq yd</option>
                                    <option>sq m</option>
                                </select>
                            </div>
                        </FormField>
                        <LocalityPicker
                            label="Preferred localities"
                            required
                            values={values.localities}
                            onChange={(next) => set("localities", next)}
                            placeholder="Search or type an area"
                            error={errors.localities}
                        />
                        <Accordion defaultValue={[]} className="border-border-warm">
                            <AccordionItem value="more" className="border-0">
                                <AccordionTrigger>
                                    More preferences{" "}
                                    <span className="font-normal text-ink-subtle">(optional)</span>
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-5">
                                    <ChipPicker
                                        label="Furnishing"
                                        values={values.furnishing}
                                        options={[
                                            "Unfurnished",
                                            "Semi-furnished",
                                            "Fully furnished",
                                        ]}
                                        onChange={(next) => set("furnishing", next)}
                                    />
                                    <TwoColumns>
                                        <SelectField
                                            label="Move-in timeline"
                                            value={values.timeline}
                                            onChange={(value) => set("timeline", value)}
                                            options={[
                                                "Immediate",
                                                "Within 1 month",
                                                "1–3 months",
                                                "3–6 months",
                                                "6+ months",
                                                "Flexible",
                                            ].map((value) => option(value))}
                                        />
                                        <SelectField
                                            label="Purpose"
                                            value={values.purpose}
                                            onChange={(value) => set("purpose", value)}
                                            options={[
                                                "Self use",
                                                "Investment",
                                                "Rental income",
                                            ].map((value) => option(value))}
                                        />
                                        <SelectField
                                            label="Parking needed"
                                            value={values.parking}
                                            onChange={(value) => set("parking", value)}
                                            options={["None", "1", "2", "2+"].map((value) =>
                                                option(value),
                                            )}
                                        />
                                        <SelectField
                                            label="Floor preference"
                                            value={values.floorPreference}
                                            onChange={(value) => set("floorPreference", value)}
                                            options={[
                                                "Ground",
                                                "Low (1–3)",
                                                "Mid (4–8)",
                                                "High (9+)",
                                                "No preference",
                                            ].map((value) => option(value))}
                                        />
                                    </TwoColumns>
                                    <ChipPicker
                                        label="Facing preference"
                                        values={values.facing}
                                        options={[
                                            "East",
                                            "West",
                                            "North",
                                            "South",
                                            "NE",
                                            "NW",
                                            "SE",
                                            "SW",
                                        ]}
                                        onChange={(next) => set("facing", next)}
                                    />
                                    <ToggleRow
                                        checked={values.vastu}
                                        onChange={(checked) => set("vastu", checked)}
                                        label="Vastu is important"
                                    />
                                    <ChipPicker
                                        label="Must-have amenities"
                                        values={values.amenities}
                                        options={AMENITIES}
                                        onChange={(next) => set("amenities", next)}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </>
                ) : null}

                {step === 2 ? (
                    <>
                        <SelectField
                            label="Home loan"
                            value={values.loanStatus}
                            onChange={(value) => set("loanStatus", value)}
                            options={[
                                option("not_required", "Not required"),
                                option("required", "Required"),
                                option("sanctioned", "Already sanctioned"),
                            ]}
                        />
                        {values.loanStatus === "required" ? (
                            <TextField
                                label="Loan amount needed"
                                required
                                type="number"
                                min="0"
                                value={values.loanAmount}
                                onChange={(event) => set("loanAmount", event.target.value)}
                                error={errors.loanAmount}
                                startIcon={undefined}
                            />
                        ) : null}
                        <ToggleRow
                            checked={values.tokenReady}
                            onChange={(checked) => set("tokenReady", checked)}
                            label="Token amount is ready"
                        />
                        <Segmented
                            label="Brokerage type"
                            value={values.brokerageType}
                            onChange={(value) =>
                                set("brokerageType", value as BuyerContactForm["brokerageType"])
                            }
                            options={[
                                option("percentage", "Percentage"),
                                option("flat", "Flat amount"),
                            ]}
                        />
                        <TextField
                            label="Brokerage value"
                            type="number"
                            min="0"
                            value={values.brokerageValue}
                            onChange={(event) => set("brokerageValue", event.target.value)}
                            hint={values.brokerageType === "percentage" ? "%" : "₹"}
                        />
                    </>
                ) : null}

                {step === 3 ? (
                    <>
                        <TwoColumns>
                            <SelectField
                                label="Lead source"
                                required
                                value={values.source}
                                onChange={(value) => set("source", value)}
                                error={errors.source}
                                options={[
                                    "Walk-in",
                                    "Reference",
                                    "Facebook",
                                    "Instagram",
                                    "WhatsApp",
                                    "99acres",
                                    "MagicBricks",
                                    "Housing.com",
                                    "Website",
                                    "Old client",
                                    "Other",
                                ].map((label) =>
                                    option(label.toLowerCase().replace(/[ .-]+/g, "_"), label),
                                )}
                            />
                            <SelectField
                                label="Lead stage"
                                required
                                value={values.stage}
                                onChange={(value) => set("stage", value)}
                                error={errors.stage}
                                options={[
                                    "New",
                                    "Contacted",
                                    "Requirement shared",
                                    "Site visit scheduled",
                                    "Site visit done",
                                    "Negotiation",
                                    "Closed – won",
                                    "Closed – lost",
                                    "Dropped",
                                ].map((label) =>
                                    option(label.toLowerCase().replace(/[ –]+/g, "_"), label),
                                )}
                            />
                        </TwoColumns>
                        {values.source === "reference" ? (
                            <TextField
                                label="Referred by"
                                required
                                value={values.referredBy}
                                onChange={(event) => set("referredBy", event.target.value)}
                                error={errors.referredBy}
                            />
                        ) : null}
                        <Segmented
                            label="Priority"
                            value={values.priority}
                            onChange={(value) =>
                                set("priority", value as BuyerContactForm["priority"])
                            }
                            options={[
                                option("hot", "Hot"),
                                option("warm", "Warm"),
                                option("cold", "Cold"),
                            ]}
                        />
                        <TwoColumns>
                            <SelectField
                                label="Assigned to"
                                value={values.assignedTo}
                                onChange={(value) => set("assignedTo", value)}
                                options={[option("me", "Me (logged-in broker)")]}
                            />
                            <TextField
                                label="Last spoke on"
                                type="date"
                                value={values.lastSpokeAt}
                                onChange={(event) => set("lastSpokeAt", event.target.value)}
                            />
                        </TwoColumns>
                        <TextField
                            label="Next follow-up"
                            type="datetime-local"
                            value={values.nextFollowUpAt}
                            onChange={(event) => set("nextFollowUpAt", event.target.value)}
                        />
                        <TagPicker
                            label="Tags"
                            values={values.tags}
                            onChange={(next) => set("tags", next)}
                            placeholder="Type a tag and press Enter"
                        />
                        <NotesField
                            value={values.notes}
                            onChange={(value) => set("notes", value)}
                            error={errors.notes}
                        />
                    </>
                ) : null}

                {submitError ? (
                    <p
                        role="alert"
                        className="body-sm rounded-inner bg-danger-soft px-3.5 py-3 text-danger"
                    >
                        {submitError}
                    </p>
                ) : null}
            </form>
        </ContactFormDrawer>
    );
}
