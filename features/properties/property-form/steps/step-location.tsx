"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";
import Link from "next/link";

import { Crosshair, MapPin, Plus, Search, Trash2 } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { createClientId } from "@/lib/client-id";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import type { PropertyDraftValues } from "@/lib/schemas/property";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";
import { Button } from "@/components/ui/button";

import {
    ADDRESS_VISIBILITY_OPTIONS,
    CITY_OPTIONS,
    INDIAN_STATE_OPTIONS,
    NEARBY_PLACE_TYPE_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import type { MyListingItem } from "@/features/properties/your-listings/types";

type LocationIdentity = {
    city: string;
    locality: string;
    subLocality: string;
    pincode: string;
    project: string;
    tower: string;
    unit: string;
    street: string;
    fullAddress: string;
};

type DuplicateMatch = {
    id: string;
    title: string;
    confidence: "likely" | "similar";
    matchedFields: string[];
    score: number;
};

const IDENTITY_FIELDS: ReadonlyArray<{
    key: keyof LocationIdentity;
    label: string;
    weight: number;
}> = [
    { key: "city", label: "city", weight: 1 },
    { key: "locality", label: "locality", weight: 3 },
    { key: "subLocality", label: "sub-locality", weight: 2 },
    { key: "pincode", label: "PIN code", weight: 3 },
    { key: "project", label: "project or society", weight: 4 },
    { key: "tower", label: "tower or block", weight: 3 },
    { key: "unit", label: "unit number", weight: 5 },
    { key: "street", label: "street or road", weight: 2 },
    { key: "fullAddress", label: "full address", weight: 5 },
];

function normalizeIdentity(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function containsIdentity(value: string, sources: string[]): boolean {
    const needle = normalizeIdentity(value);
    if (!needle) return false;
    const haystack = normalizeIdentity(sources.join(" "));
    if (!haystack) return false;
    if (needle.length <= 3) return haystack.split(" ").includes(needle);
    return haystack.includes(needle);
}

function addressIsSimilar(value: string, address: string): boolean {
    const needle = normalizeIdentity(value);
    const haystack = normalizeIdentity(address);
    if (!needle || !haystack) return false;
    if (needle.includes(haystack) || haystack.includes(needle)) return true;
    const words = needle.split(" ").filter((word) => word.length > 2);
    if (words.length < 3) return false;
    const haystackWords = new Set(haystack.split(" "));
    return words.filter((word) => haystackWords.has(word)).length / words.length >= 0.7;
}

function scoreDuplicateCandidate(
    item: MyListingItem,
    identity: LocationIdentity,
): DuplicateMatch | null {
    const sourceByField: Record<keyof LocationIdentity, string[]> = {
        city: [item.city],
        locality: [item.locality, item.address, item.title],
        subLocality: [item.locality, item.address, item.title],
        pincode: [item.pinCode, item.address],
        project: [item.title, item.address],
        tower: [item.title, item.address],
        unit: [item.title, item.address],
        street: [item.address],
        fullAddress: [item.address],
    };
    const entered = IDENTITY_FIELDS.filter(({ key }) => identity[key].trim());
    const matched = entered.filter(({ key }) =>
        key === "fullAddress"
            ? addressIsSimilar(identity[key], item.address)
            : containsIdentity(identity[key], sourceByField[key]),
    );
    const totalWeight = entered.reduce((total, field) => total + field.weight, 0);
    const matchedWeight = matched.reduce((total, field) => total + field.weight, 0);
    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
    const matchedKeys = new Set(matched.map(({ key }) => key));
    const hasContext = ["city", "locality", "subLocality", "pincode", "project"].some((key) =>
        matchedKeys.has(key as keyof LocationIdentity),
    );
    const likely =
        matchedKeys.has("fullAddress") ||
        (matchedKeys.has("unit") && hasContext) ||
        (matchedKeys.has("project") &&
            (matchedKeys.has("tower") ||
                matchedKeys.has("pincode") ||
                matchedKeys.has("locality")));
    if (!likely && (matched.length < 2 || score < 0.45)) return null;
    return {
        id: item.id,
        title: item.title,
        confidence: likely ? "likely" : "similar",
        matchedFields: matched.map(({ label }) => label),
        score,
    };
}

export function StepLocation({ currentPropertyId }: { currentPropertyId?: string }) {
    const {
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const [checking, setChecking] = useState(false);
    const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
    const checkRequestRef = useRef(0);
    const pincode = watch("location.pincode");
    const nearbyPlaces = watch("location.nearbyPlaces");
    const lat = watch("location.lat");
    const lng = watch("location.lng");

    useEffect(() => {
        if (/^395\d{3}$/.test(pincode)) {
            setValue("location.city", "Surat", { shouldDirty: true });
            setValue("location.state", "Gujarat", { shouldDirty: true });
        }
    }, [pincode, setValue]);

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            toast.error("Location is not available on this device.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setValue("location.lat", Number(position.coords.latitude.toFixed(6)), {
                    shouldDirty: true,
                });
                setValue("location.lng", Number(position.coords.longitude.toFixed(6)), {
                    shouldDirty: true,
                });
                setValue("location.mapPinPlaced", true, {
                    shouldDirty: true,
                    shouldValidate: true,
                });
                toast.success("Map pin moved to your location.");
            },
            () => toast.error("Location permission was not granted."),
        );
    }

    async function checkDuplicate(announceEmpty = true) {
        const location = watch("location");
        const identity: LocationIdentity = {
            city: location.city,
            locality: location.locality,
            subLocality: location.subLocality,
            pincode: location.pincode,
            project: location.projectOrSociety,
            tower: location.towerOrBlock,
            unit: location.unitNumber,
            street: location.streetOrRoad,
            fullAddress: location.fullAddress,
        };
        const meaningfulValues = [
            identity.locality,
            identity.subLocality,
            identity.pincode,
            identity.project,
            identity.tower,
            identity.unit,
            identity.street,
            identity.fullAddress,
        ].filter((value) => value.trim());
        if (!meaningfulValues.length) {
            setDuplicate(null);
            if (announceEmpty)
                toast("Add a locality, society, tower, unit, PIN code, or address first.");
            return;
        }
        const requestId = ++checkRequestRef.current;
        setChecking(true);
        setDuplicate(null);
        try {
            const queries = Array.from(
                new Set(
                    [
                        identity.project,
                        identity.unit,
                        identity.tower,
                        identity.locality,
                        identity.pincode,
                        identity.fullAddress,
                    ]
                        .map((value) => value.trim())
                        .filter(Boolean),
                ),
            ).slice(0, 5);
            const pages = await Promise.allSettled(
                queries.map((q) => myListingsApi.list({ q, page: 1 })),
            );
            if (requestId !== checkRequestRef.current) return;
            const fulfilled = pages.filter(
                (
                    page,
                ): page is PromiseFulfilledResult<Awaited<ReturnType<typeof myListingsApi.list>>> =>
                    page.status === "fulfilled",
            );
            if (!fulfilled.length) throw new Error("All duplicate searches failed");
            const candidates = new Map<string, MyListingItem>();
            for (const page of fulfilled) {
                for (const item of page.value.items) {
                    if (item.id !== currentPropertyId) candidates.set(item.id, item);
                }
            }
            const match = [...candidates.values()]
                .map((item) => scoreDuplicateCandidate(item, identity))
                .filter((item): item is DuplicateMatch => Boolean(item))
                .sort(
                    (a, b) =>
                        Number(b.confidence === "likely") - Number(a.confidence === "likely") ||
                        b.score - a.score,
                )[0];
            if (match) setDuplicate(match);
            else {
                setDuplicate(null);
                if (announceEmpty) toast("No matching or similar listing was found.");
            }
        } catch {
            toast.error("Couldn't check for a duplicate right now.");
        } finally {
            if (requestId === checkRequestRef.current) setChecking(false);
        }
    }

    function confirmMapPin() {
        if (lat == null || lng == null) {
            toast.error("Enter coordinates or use your current location first.");
            return;
        }
        setValue("location.mapPinPlaced", true, {
            shouldDirty: true,
            shouldValidate: true,
        });
        toast.success("Map pin confirmed.");
    }

    function addNearbyPlace() {
        setValue(
            "location.nearbyPlaces",
            [
                ...nearbyPlaces,
                { id: createClientId("nearby"), type: "school", name: "", distanceKm: null },
            ],
            { shouldDirty: true },
        );
    }

    return (
        <div className="space-y-8">
            <WizardSection
                title="Where is the property?"
                description="Start broad, then add the details people use to find it."
            >
                <div className={FORM_GRID_CLASS}>
                    <TextField name="location.country" label="Country" disabled />
                    <SelectField
                        name="location.state"
                        label="State"
                        options={INDIAN_STATE_OPTIONS}
                    />
                    <SelectField
                        name="location.city"
                        label="City"
                        options={CITY_OPTIONS}
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.locality"
                        label="Locality"
                        placeholder="e.g. Vesu"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.subLocality"
                        label="Sub-locality"
                        placeholder="Optional"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.pincode"
                        label="PIN code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="395007"
                        hint="Surat PIN codes fill the city and state automatically."
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.projectOrSociety"
                        label="Project or society"
                        placeholder="e.g. Happy Glorious"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.towerOrBlock"
                        label="Tower or block"
                        placeholder="e.g. Tower B"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.unitNumber"
                        label="Unit number"
                        placeholder="Flat, shop, or plot number"
                        visibility="private"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.streetOrRoad"
                        label="Street or road"
                        placeholder="Road name"
                        onBlur={() => void checkDuplicate(false)}
                    />
                    <TextField
                        name="location.landmark"
                        label="Nearby landmark"
                        placeholder="Near D-Mart, opposite VR Mall"
                        className="md:col-span-2"
                    />
                    <TextAreaField
                        name="location.fullAddress"
                        label="Full address"
                        placeholder="Complete address for the broker file"
                        visibility="private"
                        className="md:col-span-2"
                        onBlur={() => void checkDuplicate(false)}
                    />
                </div>
                <div className="mbs-5 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        loading={checking}
                        onClick={() => void checkDuplicate(true)}
                    >
                        <Search aria-hidden />
                        Check for duplicate
                    </Button>
                </div>
                {duplicate ? (
                    <div
                        role="status"
                        className="
                          mbs-4 rounded-control border border-urgent/30 bg-urgent-soft px-4 py-3
                          text-sm text-urgent
                          sm:flex sm:items-center sm:justify-between sm:gap-4
                        "
                    >
                        <div>
                            <p className="font-bold">
                                {duplicate.confidence === "likely"
                                    ? "This may be a duplicate property"
                                    : "A similar listing is worth reviewing"}
                            </p>
                            <p className="mbs-1 text-urgent/80">{duplicate.title}</p>
                            <p className="mbs-1 text-xs text-urgent/75">
                                Matched {duplicate.matchedFields.join(", ")}.
                            </p>
                        </div>
                        <div className="mbs-3 flex gap-2 sm:mbs-0">
                            <Link
                                href={brokerPropertyDetailHref(duplicate.id)}
                                target="_blank"
                                className="
                                  inline-flex items-center justify-center rounded-control border
                                  border-border-warm bg-surface px-3 text-sm font-semibold text-ink
                                  min-block-9
                                  hover:bg-surface-muted
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                "
                            >
                                Open it
                            </Link>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setDuplicate(null)}
                            >
                                Continue anyway
                            </Button>
                        </div>
                    </div>
                ) : null}
            </WizardSection>

            <WizardSection
                title="What should the listing reveal?"
                description="The exact unit stays protected unless the owner wants it shown."
            >
                <ChoiceField
                    name="location.addressVisibility"
                    label="Address visibility"
                    options={ADDRESS_VISIBILITY_OPTIONS}
                    columns={3}
                />
            </WizardSection>

            <WizardSection
                title="Map pin"
                description="Move the pin to the property entrance so directions and nearby distances stay accurate."
            >
                <div
                    className="
                      overflow-hidden rounded-card border border-border-warm bg-surface-muted
                    "
                >
                    <div
                        className="
                          relative flex items-center justify-center bg-brand-soft/35 p-6 text-center
                          min-block-52
                        "
                    >
                        {lat != null && lng != null ? (
                            <div
                                className="
                                  absolute inset-s-[42%] inset-bs-[38%] rounded-full bg-brand
                                  shadow-sm ring-4 ring-surface block-3 inline-3
                                "
                            />
                        ) : null}
                        <div>
                            <MapPin className="mx-auto text-brand block-8 inline-8" aria-hidden />
                            <p className="mbs-3 text-sm font-semibold text-ink">
                                {lat != null && lng != null
                                    ? "Pin ready to confirm"
                                    : "No map pin yet"}
                            </p>
                            <p className="mbs-1 text-xs text-ink-muted">
                                {lat != null && lng != null
                                    ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                                    : "Enter coordinates or use your current location."}
                            </p>
                        </div>
                    </div>
                    <div
                        className="
                          grid gap-4 border-bs border-border-warm bg-surface p-4
                          md:grid-cols-[1fr_1fr_auto_auto]
                        "
                    >
                        <NumberField
                            name="location.lat"
                            label="Latitude"
                            min={-90}
                            max={90}
                            step={0.000001}
                            visibility="public"
                        />
                        <NumberField
                            name="location.lng"
                            label="Longitude"
                            min={-180}
                            max={180}
                            step={0.000001}
                            visibility="public"
                        />
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            onClick={useCurrentLocation}
                            className="self-end"
                        >
                            <Crosshair aria-hidden />
                            Use my location
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            onClick={confirmMapPin}
                            className="self-end bg-brand-ink text-surface"
                        >
                            <MapPin aria-hidden />
                            Confirm pin
                        </Button>
                    </div>
                </div>
                {errors.location?.mapPinPlaced?.message ? (
                    <p role="alert" className="mbs-3 text-sm text-danger">
                        {String(errors.location.mapPinPlaced.message)}
                    </p>
                ) : null}
                <div className="mbs-5 max-inline-xs">
                    <NumberField
                        name="location.mapZoomHint"
                        label="Map zoom"
                        min={1}
                        max={22}
                        visibility="private"
                    />
                </div>
            </WizardSection>

            <ConditionalField path="location.nearbyPlaces">
                <WizardSection
                    title={<FieldLabel path="location.nearbyPlaces">Nearby places</FieldLabel>}
                    description="Add useful places and the distance from the property."
                >
                    <div className="space-y-3">
                        {nearbyPlaces.map((place, index) => (
                            <div
                                key={place.id}
                                className="
                                  grid items-end gap-3 rounded-control border border-border-warm
                                  bg-surface p-3
                                  md:grid-cols-[0.8fr_1.3fr_0.6fr_auto]
                                "
                            >
                                <SelectField
                                    name={`location.nearbyPlaces.${index}.type`}
                                    label="Place type"
                                    options={NEARBY_PLACE_TYPE_OPTIONS}
                                />
                                <TextField
                                    name={`location.nearbyPlaces.${index}.name`}
                                    label="Name"
                                    placeholder="e.g. Fountainhead School"
                                />
                                <NumberField
                                    name={`location.nearbyPlaces.${index}.distanceKm`}
                                    label="Distance (km)"
                                    step={0.1}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-lg"
                                    aria-label="Remove nearby place"
                                    onClick={() =>
                                        setValue(
                                            "location.nearbyPlaces",
                                            nearbyPlaces.filter(
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
                                    <Trash2 className="block-4 inline-4" aria-hidden />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="md" onClick={addNearbyPlace}>
                            <Plus aria-hidden />
                            Add nearby place
                        </Button>
                    </div>
                </WizardSection>
            </ConditionalField>
        </div>
    );
}
