"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Crosshair, MapPin, Plus, Search, Trash2 } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";

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

export function StepLocation() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const [checking, setChecking] = useState(false);
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
                toast.success("Map pin moved to your location.");
            },
            () => toast.error("Location permission was not granted."),
        );
    }

    async function checkDuplicate() {
        const locality = watch("location.locality").trim();
        const project = watch("location.projectOrSociety").trim();
        const unit = watch("location.unitNumber").trim();
        if (!locality && !project && !unit) {
            toast("Add the locality, society, or unit number first.");
            return;
        }
        setChecking(true);
        try {
            const result = await myListingsApi.list({
                q: [project, unit, locality].filter(Boolean).join(" "),
                page: 1,
            });
            toast(
                result.items.length
                    ? "A similar listing may already exist. Check Your listings before continuing."
                    : "No similar listing was found.",
            );
        } catch {
            toast.error("Couldn't check for a duplicate right now.");
        } finally {
            setChecking(false);
        }
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
                    <TextField name="location.locality" label="Locality" placeholder="e.g. Vesu" />
                    <TextField
                        name="location.subLocality"
                        label="Sub-locality"
                        placeholder="Optional"
                    />
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
                    <TextField
                        name="location.towerOrBlock"
                        label="Tower or block"
                        placeholder="e.g. Tower B"
                    />
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
                <div className="mbs-5 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        loading={checking}
                        onClick={() => void checkDuplicate()}
                    >
                        <Search aria-hidden />
                        Check for duplicate
                    </Button>
                </div>
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
                        <div
                            className="
                              absolute inset-s-[42%] inset-bs-[38%] rounded-full bg-brand shadow-sm
                              ring-4 ring-surface block-3 inline-3
                            "
                        />
                        <div>
                            <MapPin className="mx-auto text-brand block-8 inline-8" aria-hidden />
                            <p className="mbs-3 text-sm font-semibold text-ink">
                                Pin set near Surat
                            </p>
                            <p className="mbs-1 text-xs text-ink-muted">
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                    </div>
                    <div
                        className="
                          grid gap-4 border-bs border-border-warm bg-surface p-4
                          md:grid-cols-[1fr_1fr_auto]
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
                    </div>
                </div>
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

            <WizardSection
                title="Nearby places"
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
                            <button
                                type="button"
                                aria-label="Remove nearby place"
                                onClick={() =>
                                    setValue(
                                        "location.nearbyPlaces",
                                        nearbyPlaces.filter((_, itemIndex) => itemIndex !== index),
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
                            </button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="md" onClick={addNearbyPlace}>
                        <Plus aria-hidden />
                        Add nearby place
                    </Button>
                </div>
            </WizardSection>
        </div>
    );
}
