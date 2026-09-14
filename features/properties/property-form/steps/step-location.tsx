"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Crosshair, MapPin, Plus, Trash2 } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";
import { Button } from "@/components/ui/button";

import {
    CITY_OPTIONS,
    INDIAN_STATE_OPTIONS,
    NEARBY_PLACE_TYPE_OPTIONS,
} from "@/constants/property";
import {
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepLocation() {
    const {
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
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
                    <SelectField name="location.city" label="City" options={CITY_OPTIONS} />
                    <TextField
                        name="location.locality"
                        label="Locality"
                        placeholder="e.g. Vesu"
                    />
                    {/* <TextField
                        name="location.subLocality"
                        label="Sub-locality"
                        placeholder="Optional"
                    /> */}
                    <TextField
                        name="location.pincode"
                        label="PIN code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="395007"
                        hint="Surat PIN codes fill the city and state automatically."
                    />
                    <TextField
                        name="location.projectOrSociety"
                        label="Project or society"
                        placeholder="e.g. Happy Glorious"
                    />
                    {/* <TextField
                        name="location.towerOrBlock"
                        label="Tower or block"
                        placeholder="e.g. Tower B"
                    /> */}
                    <TextField
                        name="location.unitNumber"
                        label="Unit number"
                        placeholder="Flat, shop, or plot number"
                        visibility="private"
                    />
                    <TextField
                        name="location.streetOrRoad"
                        label="Street or road"
                        placeholder="Road name"
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
                    />
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
            </WizardSection> */}

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
