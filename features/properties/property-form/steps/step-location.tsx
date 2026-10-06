"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import {
    Building2,
    Check,
    Crosshair,
    Globe2,
    Hash,
    Landmark,
    Map,
    MapPin,
    MapPinned,
    Pencil,
    RotateCcw,
    Route,
} from "lucide-react";

import type { PropertyDraftValues } from "@/lib/schemas/property";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";
import { Button } from "@/components/ui/button";

import {
    FORM_GRID_CLASS,
    FORM_GRID_3_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
    NumberField,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import { NearbyPlacesField } from "@/features/properties/property-form/nearby-places-field";

import { useLocationOptions } from "@/hooks/use-locations";

function normalizeAddress(value: string): string {
    return value
        .replace(/\s*\n\s*/g, ", ")
        .replace(/,\s*,+/g, ",")
        .replace(/\s+,/g, ",")
        .replace(/,\s+/g, ", ")
        .trim();
}

function buildFullAddress(location: PropertyDraftValues["location"]): string {
    const unit = location.unitNumber.trim();
    const project = location.projectOrSociety.trim();
    const street = location.streetOrRoad.trim();
    const locality = location.locality.trim();
    const landmark = location.landmark.trim();
    const city = location.city.trim();
    const state = location.state.trim();
    const pincode = location.pincode.trim();
    const country = location.country.trim();

    const line1 = [unit, project].filter(Boolean).join(", ");
    const line2 = street;
    const line3 = locality;
    const line4 = landmark
        ? landmark.toLowerCase().startsWith("near ")
            ? landmark
            : `Near ${landmark}`
        : "";
    const cityState = [city, state].filter(Boolean).join(", ");
    const line5 = [cityState, pincode].filter(Boolean).join(" ");
    const line6 = country;

    return [line1, line2, line3, line4, line5, line6].filter(Boolean).join(", ");
}

export function StepLocation() {
    const {
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const location = watch("location");
    const {
        countryOptions,
        stateOptions,
        cityOptions,
        countriesLoading,
        statesLoading,
        citiesLoading,
        selectedCountry,
        selectedState,
    } = useLocationOptions({
        countryName: location.country,
        stateName: location.state,
    });
    const country = location.country;
    const pincode = location.pincode;
    const lat = location.lat;
    const lng = location.lng;
    const fullAddress = location.fullAddress;
    const lastAutoAddress = useRef("");
    const [editingAddress, setEditingAddress] = useState(false);
    const addressFieldId = "location-fullAddress";

    const generatedAddress = useMemo(
        () => buildFullAddress(location),
        // Explicit parts — avoid regenerating on unrelated location keys (lat/lng/etc).
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional field list
        [
            location.unitNumber,
            location.projectOrSociety,
            location.streetOrRoad,
            location.locality,
            location.landmark,
            location.city,
            location.state,
            location.pincode,
            location.country,
        ],
    );

    // Surat PIN shortcut for the launch city. Only valid while the country is
    // India — other countries reuse the same 6 digit range for other places.
    useEffect(() => {
        if (country !== "India") return;
        if (/^395\d{3}$/.test(pincode)) {
            setValue("location.city", "Surat", { shouldDirty: true });
            setValue("location.state", "Gujarat", { shouldDirty: true });
        }
    }, [country, pincode, setValue]);

    useEffect(() => {
        if (editingAddress) return;

        const currentRaw = fullAddress;
        const current = normalizeAddress(currentRaw);
        const auto = generatedAddress.trim();

        // Restored / multiline auto draft that already matches → keep managing + flatten.
        if (!lastAutoAddress.current && current && current === auto) {
            lastAutoAddress.current = auto;
            if (currentRaw !== auto) {
                setValue("location.fullAddress", auto, { shouldDirty: true });
            }
            return;
        }

        // Sync while empty or still equal to last auto value — stop after manual edit.
        const shouldSync = !current || current === lastAutoAddress.current;
        if (!shouldSync) return;
        if (current === auto && currentRaw === auto) {
            lastAutoAddress.current = auto;
            return;
        }
        lastAutoAddress.current = auto;
        setValue("location.fullAddress", auto, { shouldDirty: true });
    }, [editingAddress, fullAddress, generatedAddress, setValue]);

    function startEditingAddress() {
        setEditingAddress(true);
        requestAnimationFrame(() => {
            const field = document.getElementById(addressFieldId) as HTMLTextAreaElement | null;
            field?.focus();
            field?.setSelectionRange(field.value.length, field.value.length);
        });
    }

    function finishEditingAddress() {
        setEditingAddress(false);
        const current = normalizeAddress(watch("location.fullAddress"));
        if (current && current !== lastAutoAddress.current) {
            // Keep custom text as-is (normalized to one line for display consistency).
            if (watch("location.fullAddress") !== current) {
                setValue("location.fullAddress", current, { shouldDirty: true });
            }
        }
    }

    function resetToGeneratedAddress() {
        setEditingAddress(false);
        const auto = generatedAddress.trim();
        lastAutoAddress.current = auto;
        setValue("location.fullAddress", auto, { shouldDirty: true });
    }

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

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        <MapPin
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Where is the property?
                    </>
                }
                description="Start broad, then add the details people use to find it."
            >
                <div className={FORM_STACK_CLASS}>
                    <div className={FORM_GRID_3_CLASS}>
                        <SelectField
                            name="location.country"
                            label="Country"
                            options={countryOptions}
                            placeholder="Choose a country"
                            startIcon={Globe2}
                            loading={countriesLoading}
                            emptyText="No countries match"
                            limit={50}
                            onValueChange={() => {
                                // State and city belong to the old country.
                                setValue("location.state", "", { shouldDirty: true });
                                setValue("location.city", "", { shouldDirty: true });
                            }}
                        />
                        <SelectField
                            name="location.state"
                            label="State"
                            options={stateOptions}
                            placeholder={
                                selectedCountry ? "Choose a state" : "Choose a country first"
                            }
                            startIcon={Map}
                            loading={statesLoading}
                            disabled={!selectedCountry}
                            emptyText={statesLoading ? "Loading states…" : "No states match"}
                            limit={100}
                            onValueChange={() => {
                                setValue("location.city", "", { shouldDirty: true });
                            }}
                        />
                        <SelectField
                            name="location.city"
                            label="City"
                            options={cityOptions}
                            placeholder={selectedState ? "Choose a city" : "Choose a state first"}
                            startIcon={Building2}
                            loading={citiesLoading}
                            disabled={!selectedState}
                            emptyText={citiesLoading ? "Loading cities…" : "No cities match"}
                            limit={100}
                        />
                    </div>
                    <div className={FORM_GRID_CLASS}>
                        <TextField
                            name="location.locality"
                            label="Locality"
                            placeholder="e.g. Vesu"
                            startIcon={MapPinned}
                        />
                        <TextField
                            name="location.pincode"
                            label="PIN code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="395007"
                            hint="Surat PIN codes fill the city and state automatically."
                            startIcon={Hash}
                        />
                        <TextField
                            name="location.projectOrSociety"
                            label="Project or society"
                            placeholder="e.g. Happy Glorious"
                            startIcon={Building2}
                        />
                        <TextField
                            name="location.unitNumber"
                            label="Unit number"
                            placeholder="Flat, shop, or plot number"
                            visibility="private"
                            startIcon={Hash}
                        />
                        <TextField
                            name="location.streetOrRoad"
                            label="Street or road"
                            placeholder="Road name"
                            startIcon={Route}
                        />
                        <TextField
                            name="location.landmark"
                            label="Nearby landmark"
                            placeholder="Near D-Mart, opposite VR Mall"
                            startIcon={Landmark}
                        />
                        <TextAreaField
                            name="location.fullAddress"
                            label="Full address"
                            placeholder="Fills from the fields above — tap Edit to customize"
                            hint="Auto-built as one line. Edit to customize, Clear to restore the generated address."
                            visibility="private"
                            className="md:col-span-2"
                            rows={3}
                            readOnly={!editingAddress}
                            onBlur={() => {
                                if (editingAddress) finishEditingAddress();
                            }}
                            endAction={
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={resetToGeneratedAddress}
                                        className="
                                          gap-1.5 rounded-control bg-surface px-2.5 font-semibold
                                          text-ink-muted shadow-sm
                                          hover:bg-surface-muted hover:text-ink
                                        "
                                    >
                                        <RotateCcw className="block-3.5 inline-3.5" aria-hidden />
                                        Clear
                                    </Button>
                                    {editingAddress ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={finishEditingAddress}
                                            className="
                                              gap-1.5 rounded-control bg-surface px-2.5 font-semibold
                                              text-brand-text shadow-sm
                                              hover:bg-brand-soft hover:text-brand-text
                                            "
                                        >
                                            <Check className="block-3.5 inline-3.5" aria-hidden />
                                            Done
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={startEditingAddress}
                                            className="
                                              gap-1.5 rounded-control bg-surface px-2.5 font-semibold
                                              text-brand-text shadow-sm
                                              hover:bg-brand-soft hover:text-brand-text
                                            "
                                        >
                                            <Pencil className="block-3.5 inline-3.5" aria-hidden />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            }
                        />
                    </div>
                </div>
            </WizardSection>

            {/* <WizardSection
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
                            className="self-end bg-brand text-surface"
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
            </WizardSection> */}

            <ConditionalField path="location.nearbyPlaces">
                <WizardSection
                    title={
                        <>
                            <Landmark
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            <FieldLabel path="location.nearbyPlaces">Nearby places</FieldLabel>
                        </>
                    }
                    description="Search what’s nearby, or add your own. Keep it to places that actually help."
                >
                    <NearbyPlacesField />
                </WizardSection>
            </ConditionalField>
        </div>
    );
}
