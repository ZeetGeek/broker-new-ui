"use client";

import { useMemo, useState } from "react";

import {
    ArrowDown,
    ArrowUp,
    FileText,
    ImagePlus,
    LocateFixed,
    Lock,
    Star,
    Trash2,
    Upload,
} from "lucide-react";

import { contactsApi } from "@/lib/api/contacts";
import { myListingsApi } from "@/lib/api/my-listings";
import { formatIndianPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";

import {
    AMENITIES,
    BHK_OPTIONS,
    emptyOwnerForm,
    moneyToRupees,
    type OwnerContactForm,
    PROPERTY_TYPES,
    serializableOwnerDraft,
    showOwnerBhk,
    SURAT_LOCALITIES,
    validateOwnerStep,
} from "@/features/contacts/contact-form-model";
import {
    ChipPicker,
    ContactFormDrawer,
    DraftRestoreBar,
    FormField,
    nativeControlClass,
    NotesField,
    Segmented,
    SelectField,
    TagPicker,
    TextField,
    ToggleRow,
    useContactDraft,
} from "@/features/contacts/contact-form-ui";
import type { OwnerRow } from "@/features/contacts/types";

const STEPS = ["Owner details", "Property", "Price", "Deal terms", "Tracking"];
const DRAFT_KEY = "yb.contacts.owner.draft.v2";
const option = (value: string, label = value) => ({ value, label });

function TwoColumns({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function ownerValues(owner: OwnerRow | null): OwnerContactForm {
    if (!owner) return emptyOwnerForm();
    if (owner.details)
        return { ...emptyOwnerForm(), ...owner.details, idProof: null, photos: [], documents: [] };
    return {
        ...emptyOwnerForm(),
        name: owner.name,
        phone: owner.phoneDigits ?? "",
        intent: owner.propertyIntent ?? (owner.isAllRent ? "rent" : "sell"),
        propertyType: owner.propertyType ?? "Apartment",
        configuration: owner.configuration ?? "",
        locality: owner.localities[0] ?? "",
        societyName: owner.propertyTitles[0] ?? "",
        expectedPrice: owner.isAllRent ? "" : String(owner.totalValueInr / 100_000),
        expectedRent: owner.isAllRent ? String(owner.totalValueInr) : "",
        lastSpokeAt: owner.lastSpokeAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        status: owner.status ?? "active",
        tags: owner.tags ?? [],
        notes: owner.notes ?? "",
        createPrivateListing: false,
    };
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

function FileDropField({
    label,
    files,
    onChange,
    accept,
    multiple,
    maxFiles,
    error,
}: {
    label: string;
    files: File[];
    onChange: (files: File[]) => void;
    accept: string;
    multiple?: boolean;
    maxFiles?: number;
    error?: string;
}) {
    const add = (incoming: File[]) =>
        onChange([...(multiple ? files : []), ...incoming].slice(0, maxFiles ?? 1));
    const move = (index: number, delta: number) => {
        const next = [...files];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target]!, next[index]!];
        onChange(next);
    };
    return (
        <FormField
            label={label}
            error={error}
            hint={multiple ? `${files.length} of ${maxFiles ?? 10}` : "JPG, PNG or PDF"}
        >
            <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault();
                    add(Array.from(event.dataTransfer.files));
                }}
                className="
                  flex cursor-pointer flex-col items-center justify-center gap-2 rounded-inner
                  border border-dashed border-border-warm bg-surface-muted px-4 py-5 text-center
                  hover:border-brand/50
                "
            >
                {multiple ? (
                    <ImagePlus aria-hidden className="text-brand block-5 inline-5" />
                ) : (
                    <Upload aria-hidden className="text-brand block-5 inline-5" />
                )}
                <span className="body-sm font-medium text-ink">Drop files here or browse</span>
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    className="sr-only"
                    onChange={(event) => add(Array.from(event.target.files ?? []))}
                />
            </label>
            {files.length ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {files.map((file, index) => {
                        const image = file.type.startsWith("image/");
                        const preview = image ? URL.createObjectURL(file) : "";
                        return (
                            <li
                                key={`${file.name}-${file.lastModified}`}
                                className="
                                  flex items-center gap-2 rounded-inner border border-border-warm
                                  p-2 min-inline-0
                                "
                            >
                                {image ? (
                                    <AppImage
                                        src={preview}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="rounded-sm object-cover block-10 inline-10"
                                        onLoad={() => URL.revokeObjectURL(preview)}
                                    />
                                ) : (
                                    <FileText
                                        aria-hidden
                                        className="text-ink-muted block-5 inline-5"
                                    />
                                )}
                                <span className="body-xs flex-1 truncate text-ink">
                                    {file.name}
                                </span>
                                {multiple ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => move(index, -1)}
                                            disabled={index === 0}
                                            aria-label="Move earlier"
                                            className="text-ink-muted disabled:opacity-30"
                                        >
                                            <ArrowUp className="block-3.5 inline-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(index, 1)}
                                            disabled={index === files.length - 1}
                                            aria-label="Move later"
                                            className="text-ink-muted disabled:opacity-30"
                                        >
                                            <ArrowDown className="block-3.5 inline-3.5" />
                                        </button>
                                    </>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() =>
                                        onChange(
                                            files.filter((_, fileIndex) => fileIndex !== index),
                                        )
                                    }
                                    aria-label={`Remove ${file.name}`}
                                    className="text-danger"
                                >
                                    <Trash2 className="block-3.5 inline-3.5" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
            {multiple && files.length ? (
                <p className="body-xs flex items-center gap-1 text-ink-muted">
                    <Star aria-hidden className="block-3 inline-3" /> First photo is the cover. Use
                    arrows to reorder.
                </p>
            ) : null}
        </FormField>
    );
}

export function AddOwnerModal({
    open,
    onOpenChange,
    onSaved,
    owner = null,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (name: string, mode: "created" | "updated") => void;
    owner?: OwnerRow | null;
}) {
    const isEdit = Boolean(owner);
    const locked = owner?.origin === "platform";
    const [values, setValues] = useState<OwnerContactForm>(() => ownerValues(owner));
    const [step, setStep] = useState(locked ? 4 : 0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [duplicate, setDuplicate] = useState<{
        id: string;
        name: string;
        type: "buyer" | "owner";
    } | null>(null);
    const [locating, setLocating] = useState(false);

    const draftValue = useMemo(() => serializableOwnerDraft(values), [values]);
    const draftState = useContactDraft<ReturnType<typeof serializableOwnerDraft>>(
        DRAFT_KEY,
        open,
        draftValue,
        dirty && !isEdit,
    );
    const set = <K extends keyof OwnerContactForm>(key: K, value: OwnerContactForm[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
        setDirty(true);
    };

    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setValues(ownerValues(owner));
            setStep(owner?.origin === "platform" ? 4 : 0);
            setErrors({});
            setDirty(false);
            setSubmitError("");
            setDuplicate(null);
        }
    }

    const checkDuplicate = async () => {
        const match = await contactsApi.checkDuplicate(values.phone);
        if (match && match.id !== owner?.id) setDuplicate(match);
    };
    const locate = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                set("lat", position.coords.latitude.toFixed(6));
                set("lng", position.coords.longitude.toFixed(6));
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: false, timeout: 8000 },
        );
    };

    const save = async (addAnother: boolean) => {
        const nextErrors = locked ? {} : validateOwnerStep(values, 4);
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }
        setBusy(true);
        setSubmitError("");
        try {
            const saved = await contactsApi.saveOwner(values, owner?.id, owner?.origin);
            if (!isEdit && values.createPrivateListing) {
                const listing = await myListingsApi.createPrivateFromOwner(
                    values,
                    saved.id,
                    saved.name,
                );
                contactsApi.linkMockOwnerListing(saved.id, listing.id, listing.title);
            }
            draftState.clear();
            onSaved(saved.name, isEdit ? "updated" : "created");
            if (addAnother) {
                setValues(emptyOwnerForm());
                setStep(0);
                setDirty(false);
            } else {
                setDirty(false);
                onOpenChange(false);
            }
        } catch (error) {
            setSubmitError(
                error instanceof Error ? error.message : "Could not save this owner. Try again.",
            );
        } finally {
            setBusy(false);
        }
    };
    const next = () => {
        const nextErrors = locked ? {} : validateOwnerStep(values, step);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        if (step < 4) setStep((current) => current + 1);
        else void save(false);
    };

    const priceHint =
        values.intent === "sell"
            ? formatIndianPrice(moneyToRupees(values.expectedPrice, values.priceUnit), "sell")
            : formatIndianPrice(moneyToRupees(values.expectedRent), values.intent);
    const plotFields = ["Plot", "Villa", "Bungalow"].includes(values.propertyType);
    const hideFloor = values.propertyType === "Plot";

    return (
        <ContactFormDrawer
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? "Edit owner" : "Add owner"}
            description={
                locked
                    ? "Platform details are protected. You can update your tracking notes."
                    : "Save the owner and the private property they asked you to handle."
            }
            step={step}
            steps={STEPS}
            isDirty={dirty}
            busy={busy}
            onBack={() => setStep((current) => Math.max(0, current - 1))}
            onNext={next}
            onSaveAnother={isEdit ? undefined : () => void save(true)}
            header={
                locked ? (
                    <div
                        className="
                          body-xs flex items-center gap-2 rounded-inner bg-surface-muted px-3 py-2
                          text-ink-muted
                        "
                    >
                        <Lock aria-hidden className="block-3.5 inline-3.5" /> Owner details come
                        from the platform
                    </div>
                ) : !isEdit && draftState.draft ? (
                    <DraftRestoreBar
                        onRestore={() => {
                            setValues({ ...emptyOwnerForm(), ...draftState.draft });
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
                                disabled={locked}
                            />
                            <TextField
                                label="Phone number"
                                required
                                value={values.phone}
                                onChange={(event) => set("phone", event.target.value)}
                                onBlur={() => void checkDuplicate()}
                                error={errors.phone}
                                inputMode="tel"
                                helperText="+91"
                                disabled={locked}
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
                            onChange={(checked) => !locked && set("whatsappSame", checked)}
                            label="WhatsApp is the same as phone"
                        />
                        {!values.whatsappSame ? (
                            <TextField
                                label="WhatsApp number"
                                value={values.whatsapp}
                                onChange={(event) => set("whatsapp", event.target.value)}
                                error={errors.whatsapp}
                                disabled={locked}
                            />
                        ) : null}
                        <TwoColumns>
                            <TextField
                                label="Alternate phone"
                                value={values.altPhone}
                                onChange={(event) => set("altPhone", event.target.value)}
                                error={errors.altPhone}
                                disabled={locked}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={values.email}
                                onChange={(event) => set("email", event.target.value)}
                                error={errors.email}
                                disabled={locked}
                            />
                        </TwoColumns>
                        <SelectField
                            label="Owner type"
                            required
                            value={values.ownerType}
                            onChange={(value) => set("ownerType", value)}
                            error={errors.ownerType}
                            disabled={locked}
                            options={[
                                option("individual", "Individual owner"),
                                option("co_owner", "Co-owner"),
                                option("builder", "Builder / Developer"),
                                option("investor", "Investor"),
                                option("poa", "Power of Attorney holder"),
                                option("company", "Company"),
                            ]}
                        />
                        <FormField label="Owner's address" htmlFor="owner-address">
                            <textarea
                                id="owner-address"
                                className={cn(nativeControlClass, "py-3 min-block-24")}
                                value={values.address}
                                onChange={(event) => set("address", event.target.value)}
                                disabled={locked}
                            />
                        </FormField>
                        {!locked ? (
                            <FileDropField
                                label="ID proof"
                                files={values.idProof ? [values.idProof] : []}
                                onChange={(files) => set("idProof", files[0] ?? null)}
                                accept="image/jpeg,image/png,application/pdf"
                                error={errors.idProof}
                            />
                        ) : null}
                    </>
                ) : null}

                {step === 1 ? (
                    <>
                        <Segmented
                            label="Listing intent"
                            value={values.intent}
                            onChange={(value) =>
                                !locked && set("intent", value as OwnerContactForm["intent"])
                            }
                            options={[
                                option("sell", "Sell"),
                                option("rent", "Rent"),
                                option("lease", "Lease"),
                            ]}
                        />
                        <TwoColumns>
                            <SelectField
                                label="Property type"
                                required
                                value={values.propertyType}
                                onChange={(value) => set("propertyType", value)}
                                error={errors.propertyType}
                                disabled={locked}
                                options={PROPERTY_TYPES.map((value) => option(value))}
                            />
                            {showOwnerBhk(values) ? (
                                <SelectField
                                    label="Configuration (BHK)"
                                    required
                                    value={values.configuration}
                                    onChange={(value) => set("configuration", value)}
                                    error={errors.configuration}
                                    disabled={locked}
                                    options={BHK_OPTIONS.map((value) => option(value))}
                                />
                            ) : (
                                <div />
                            )}
                        </TwoColumns>
                        <TextField
                            label="Society / Project / Building name"
                            required
                            value={values.societyName}
                            onChange={(event) => set("societyName", event.target.value)}
                            error={errors.societyName}
                            disabled={locked}
                        />
                        <TwoColumns>
                            <FormField label="Locality / Area" required error={errors.locality}>
                                <input
                                    list="surat-owner-localities"
                                    className={nativeControlClass}
                                    value={values.locality}
                                    onChange={(event) => set("locality", event.target.value)}
                                    placeholder="Search or type an area"
                                    disabled={locked}
                                />
                                <datalist id="surat-owner-localities">
                                    {SURAT_LOCALITIES.map((value) => (
                                        <option key={value} value={value} />
                                    ))}
                                </datalist>
                            </FormField>
                            <TextField
                                label="City"
                                value={values.city}
                                onChange={(event) => set("city", event.target.value)}
                                disabled={locked}
                            />
                        </TwoColumns>
                        <FormField label="Full address" htmlFor="property-address">
                            <textarea
                                id="property-address"
                                className={cn(nativeControlClass, "py-3 min-block-24")}
                                value={values.fullAddress}
                                onChange={(event) => set("fullAddress", event.target.value)}
                                disabled={locked}
                            />
                        </FormField>
                        <TextField
                            label="Pincode"
                            value={values.pincode}
                            onChange={(event) =>
                                set("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            error={errors.pincode}
                            inputMode="numeric"
                            disabled={locked}
                        />
                        <FormField
                            label="Map location"
                            hint="Optional coordinates are kept private to your listing."
                        >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                <input
                                    aria-label="Latitude"
                                    className={nativeControlClass}
                                    value={values.lat}
                                    onChange={(event) => set("lat", event.target.value)}
                                    placeholder="Latitude"
                                    disabled={locked}
                                />
                                <input
                                    aria-label="Longitude"
                                    className={nativeControlClass}
                                    value={values.lng}
                                    onChange={(event) => set("lng", event.target.value)}
                                    placeholder="Longitude"
                                    disabled={locked}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={locate}
                                    loading={locating}
                                    disabled={locked}
                                >
                                    <LocateFixed aria-hidden /> Use my location
                                </Button>
                            </div>
                        </FormField>
                        <FormField label="Areas" required error={errors.carpetArea}>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                    aria-label="Carpet area"
                                    className={nativeControlClass}
                                    type="number"
                                    min="0"
                                    value={values.carpetArea}
                                    onChange={(event) => set("carpetArea", event.target.value)}
                                    placeholder="Carpet area *"
                                    disabled={locked}
                                />
                                <select
                                    aria-label="Area unit"
                                    className={nativeControlClass}
                                    value={values.areaUnit}
                                    onChange={(event) => set("areaUnit", event.target.value)}
                                    disabled={locked}
                                >
                                    <option>sq ft</option>
                                    <option>sq yd</option>
                                    <option>sq m</option>
                                </select>
                                <input
                                    aria-label="Built-up area"
                                    className={nativeControlClass}
                                    type="number"
                                    min="0"
                                    value={values.builtUpArea}
                                    onChange={(event) => set("builtUpArea", event.target.value)}
                                    placeholder="Built-up area"
                                    disabled={locked}
                                />
                                <input
                                    aria-label="Super built-up area"
                                    className={nativeControlClass}
                                    type="number"
                                    min="0"
                                    value={values.superBuiltUpArea}
                                    onChange={(event) =>
                                        set("superBuiltUpArea", event.target.value)
                                    }
                                    placeholder="Super built-up area"
                                    disabled={locked}
                                />
                                {plotFields ? (
                                    <input
                                        aria-label="Plot area"
                                        className={nativeControlClass}
                                        type="number"
                                        min="0"
                                        value={values.plotArea}
                                        onChange={(event) => set("plotArea", event.target.value)}
                                        placeholder="Plot area"
                                        disabled={locked}
                                    />
                                ) : null}
                            </div>
                        </FormField>
                        <TwoColumns>
                            {!hideFloor ? (
                                <>
                                    <TextField
                                        label="Floor number"
                                        type="number"
                                        value={values.floorNumber}
                                        onChange={(event) => set("floorNumber", event.target.value)}
                                        disabled={locked}
                                    />
                                    <TextField
                                        label="Total floors"
                                        type="number"
                                        value={values.totalFloors}
                                        onChange={(event) => set("totalFloors", event.target.value)}
                                        disabled={locked}
                                    />
                                </>
                            ) : null}
                            <TextField
                                label="Bathrooms"
                                type="number"
                                min="0"
                                value={values.bathrooms}
                                onChange={(event) => set("bathrooms", event.target.value)}
                                disabled={locked}
                            />
                            <TextField
                                label="Balconies"
                                type="number"
                                min="0"
                                value={values.balconies}
                                onChange={(event) => set("balconies", event.target.value)}
                                disabled={locked}
                            />
                        </TwoColumns>
                        <TwoColumns>
                            <SelectField
                                label="Parking"
                                value={values.parkingType}
                                onChange={(value) => set("parkingType", value)}
                                disabled={locked}
                                options={[
                                    option("covered", "Covered"),
                                    option("open", "Open"),
                                    option("none", "None"),
                                ]}
                            />
                            {values.parkingType !== "none" ? (
                                <TextField
                                    label="Parking count"
                                    type="number"
                                    min="1"
                                    value={values.parkingCount}
                                    onChange={(event) => set("parkingCount", event.target.value)}
                                    disabled={locked}
                                />
                            ) : (
                                <div />
                            )}
                            <SelectField
                                label="Facing"
                                value={values.facing}
                                onChange={(value) => set("facing", value)}
                                disabled={locked}
                                options={[
                                    "East",
                                    "West",
                                    "North",
                                    "South",
                                    "NE",
                                    "NW",
                                    "SE",
                                    "SW",
                                ].map((value) => option(value))}
                            />
                            <SelectField
                                label="Property age"
                                value={values.propertyAge}
                                onChange={(value) => set("propertyAge", value)}
                                disabled={locked}
                                options={[
                                    "Under construction",
                                    "New / ready to move",
                                    "1–5 years",
                                    "5–10 years",
                                    "10+ years",
                                ].map((value) => option(value))}
                            />
                            <TextField
                                label="Available from"
                                type="date"
                                value={values.availableFrom}
                                onChange={(event) => set("availableFrom", event.target.value)}
                                disabled={locked}
                            />
                            <SelectField
                                label="Furnishing"
                                value={values.furnishing}
                                onChange={(value) => set("furnishing", value)}
                                disabled={locked}
                                options={["Unfurnished", "Semi-furnished", "Fully furnished"].map(
                                    (value) => option(value),
                                )}
                            />
                        </TwoColumns>
                        <ChipPicker
                            label="Amenities"
                            values={values.amenities}
                            options={AMENITIES}
                            onChange={(next) => !locked && set("amenities", next)}
                        />
                        <TextField
                            label="RERA number"
                            value={values.reraNumber}
                            onChange={(event) => set("reraNumber", event.target.value)}
                            disabled={locked}
                        />
                        {!locked ? (
                            <>
                                <FileDropField
                                    label="Property photos"
                                    files={values.photos}
                                    onChange={(files) => set("photos", files)}
                                    accept="image/jpeg,image/png"
                                    multiple
                                    maxFiles={10}
                                    error={errors.photos}
                                />
                                <FileDropField
                                    label="Documents"
                                    files={values.documents}
                                    onChange={(files) => set("documents", files)}
                                    accept="image/jpeg,image/png,application/pdf"
                                    multiple
                                    maxFiles={10}
                                />
                            </>
                        ) : null}
                    </>
                ) : null}

                {step === 2 ? (
                    <>
                        {values.intent === "sell" ? (
                            <FormField
                                label="Expected price"
                                required
                                error={errors.expectedPrice}
                                hint={values.expectedPrice ? priceHint : undefined}
                            >
                                <div className="grid grid-cols-[1fr_9rem] gap-2">
                                    <input
                                        aria-label="Expected price"
                                        className={nativeControlClass}
                                        inputMode="decimal"
                                        value={values.expectedPrice}
                                        onChange={(event) =>
                                            set("expectedPrice", event.target.value)
                                        }
                                        disabled={locked}
                                    />
                                    <select
                                        aria-label="Price unit"
                                        className={nativeControlClass}
                                        value={values.priceUnit}
                                        onChange={(event) =>
                                            set("priceUnit", event.target.value as "lakh" | "crore")
                                        }
                                        disabled={locked}
                                    >
                                        <option value="lakh">Lakh</option>
                                        <option value="crore">Crore</option>
                                    </select>
                                </div>
                            </FormField>
                        ) : (
                            <>
                                <TextField
                                    label="Expected rent per month"
                                    required
                                    type="number"
                                    min="0"
                                    value={values.expectedRent}
                                    onChange={(event) => set("expectedRent", event.target.value)}
                                    error={errors.expectedRent}
                                    hint={values.expectedRent ? priceHint : undefined}
                                    disabled={locked}
                                />
                                <TextField
                                    label="Security deposit"
                                    type="number"
                                    min="0"
                                    value={values.deposit}
                                    onChange={(event) => set("deposit", event.target.value)}
                                    disabled={locked}
                                />
                            </>
                        )}
                        <TextField
                            label="Maintenance per month"
                            type="number"
                            min="0"
                            value={values.maintenance}
                            onChange={(event) => set("maintenance", event.target.value)}
                            disabled={locked}
                        />
                        <ToggleRow
                            checked={values.negotiable}
                            onChange={(checked) => !locked && set("negotiable", checked)}
                            label="Price is negotiable"
                        />
                    </>
                ) : null}

                {step === 3 ? (
                    <>
                        <ToggleRow
                            checked={values.exclusive}
                            onChange={(checked) => !locked && set("exclusive", checked)}
                            label="Exclusive with me"
                        />
                        {values.exclusive ? (
                            <TextField
                                label="Agreement valid till"
                                required
                                type="date"
                                value={values.agreementValidTill}
                                onChange={(event) => set("agreementValidTill", event.target.value)}
                                error={errors.agreementValidTill}
                                disabled={locked}
                            />
                        ) : null}
                        <Segmented
                            label="Brokerage type"
                            value={values.brokerageType}
                            onChange={(value) =>
                                !locked &&
                                set("brokerageType", value as OwnerContactForm["brokerageType"])
                            }
                            options={[
                                option("percentage", "Percentage"),
                                option("flat", "Flat amount"),
                            ]}
                        />
                        <TwoColumns>
                            <TextField
                                label="Brokerage value"
                                type="number"
                                min="0"
                                value={values.brokerageValue}
                                onChange={(event) => set("brokerageValue", event.target.value)}
                                hint={values.brokerageType === "percentage" ? "%" : "₹"}
                                disabled={locked}
                            />
                            <SelectField
                                label="Brokerage paid by"
                                value={values.brokeragePaidBy}
                                onChange={(value) => set("brokeragePaidBy", value)}
                                disabled={locked}
                                options={[
                                    option("owner", "Owner"),
                                    option("buyer", "Buyer"),
                                    option("both", "Both"),
                                ]}
                            />
                        </TwoColumns>
                        <ChipPicker
                            label="Site visit availability"
                            values={values.visitDays}
                            options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                            onChange={(next) => !locked && set("visitDays", next)}
                        />
                        <TwoColumns>
                            <TextField
                                label="From"
                                type="time"
                                value={values.visitFrom}
                                onChange={(event) => set("visitFrom", event.target.value)}
                                disabled={locked}
                            />
                            <TextField
                                label="To"
                                type="time"
                                value={values.visitTo}
                                onChange={(event) => set("visitTo", event.target.value)}
                                disabled={locked}
                            />
                        </TwoColumns>
                    </>
                ) : null}

                {step === 4 ? (
                    <>
                        <TwoColumns>
                            {!locked ? (
                                <SelectField
                                    label="Source"
                                    required
                                    value={values.source}
                                    onChange={(value) => set("source", value)}
                                    error={errors.source}
                                    options={[
                                        "Direct",
                                        "Reference",
                                        "Cold call",
                                        "Society visit",
                                        "Facebook",
                                        "Instagram",
                                        "99acres",
                                        "Old client",
                                        "Other",
                                    ].map((label) =>
                                        option(label.toLowerCase().replace(/\s+/g, "_"), label),
                                    )}
                                />
                            ) : null}
                            <SelectField
                                label="Status"
                                required
                                value={values.status}
                                onChange={(value) => set("status", value)}
                                options={[
                                    option("active", "Active"),
                                    option("on_hold", "On hold"),
                                    option("under_negotiation", "Under negotiation"),
                                    option("sold", "Sold"),
                                    option("rented", "Rented out"),
                                    option("withdrawn", "Withdrawn"),
                                ]}
                            />
                            <TextField
                                label="Last spoke on"
                                type="date"
                                value={values.lastSpokeAt}
                                onChange={(event) => set("lastSpokeAt", event.target.value)}
                            />
                            <TextField
                                label="Next follow-up"
                                type="datetime-local"
                                value={values.nextFollowUpAt}
                                onChange={(event) => set("nextFollowUpAt", event.target.value)}
                            />
                        </TwoColumns>
                        <TagPicker
                            label="Tags"
                            values={values.tags}
                            onChange={(next) => set("tags", next)}
                            placeholder="Type a tag and press Enter"
                        />
                        <NotesField
                            value={values.notes}
                            onChange={(value) => set("notes", value)}
                        />
                        {!isEdit ? (
                            <ToggleRow
                                checked={values.createPrivateListing}
                                onChange={(checked) => set("createPrivateListing", checked)}
                                label="Create private listing from this owner"
                                description="This listing stays private to you and will not appear in the marketplace."
                            />
                        ) : null}
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
