"use client";

import { useMemo } from "react";

import { isUsablePropertyPhoto } from "@/lib/properties/form-media";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { isVisible } from "@/lib/visibility/rules";

export type ListingScoreTip = {
    label: string;
    step: "basics" | "details" | "furnishing" | "media";
    points: number;
};

export function useListingScore(values: PropertyDraftValues): {
    score: number;
    tips: ListingScoreTip[];
} {
    return useMemo(() => calculateListingScore(values), [values]);
}

export function calculateListingScore(values: PropertyDraftValues): {
    score: number;
    tips: ListingScoreTip[];
} {
    const checks: {
        done: boolean;
        points: number;
        label: string;
        step: ListingScoreTip["step"];
    }[] = [
        {
            done: Boolean(
                values.basics.title && values.basics.propertyType && values.area.areaSqft,
            ),
            points: 35,
            label: "Add a title and property area",
            step: "details",
        },
        {
            done: values.media.photos.filter(isUsablePropertyPhoto).length >= 6,
            points: 20,
            label: "Add 6 or more photos",
            step: "media",
        },
        {
            done: values.basics.description.trim().length >= 150,
            points: 10,
            label: "Write a detailed description",
            step: "details",
        },
        {
            done:
                Object.entries(values.amenities)
                    .filter(([bucket]) => isVisible(`amenities.${bucket}`, values))
                    .flatMap(([, amenities]) => amenities).length >= 5,
            points: 10,
            label: "Choose at least 5 amenities",
            step: "furnishing",
        },
        {
            // Map pin section is commented out in the form; landmark is all that is reachable.
            done: Boolean(values.location.landmark),
            points: 10,
            label: "Add a landmark",
            step: "basics",
        },
        {
            done: Boolean(values.furnishing.status),
            points: 5,
            label: "Add furnishing details",
            step: "furnishing",
        },
        {
            done: Boolean(values.media.videoUrl || values.media.virtualTourUrl),
            points: 10,
            label: "Add a video or virtual tour",
            step: "media",
        },
        // Private documents UI temporarily commented out
        // {
        //     done: values.documents.length > 0,
        //     points: 5,
        //     label: "Add a property document",
        //     step: "media",
        // },
    ];

    const applicable = checks.filter((check) => {
        if (check.label === "Add furnishing details") return isVisible("furnishing.status", values);
        if (check.label === "Choose at least 5 amenities") {
            return Object.keys(values.amenities).some((bucket) =>
                isVisible(`amenities.${bucket}`, values),
            );
        }
        return true;
    });
    const total = applicable.reduce((sum, check) => sum + check.points, 0);
    return {
        score: Math.round(
            (applicable.reduce((sum, check) => sum + (check.done ? check.points : 0), 0) / total) *
                100,
        ),
        tips: applicable
            .filter((check) => !check.done)
            .slice(0, 3)
            .map(({ label, step, points }) => ({ label, step, points })),
    };
}
