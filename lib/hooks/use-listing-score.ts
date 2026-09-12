"use client";

import { useMemo } from "react";

import type { PropertyDraftValues } from "@/lib/schemas/property";

export type ListingScoreTip = {
    label: string;
    step: "basics" | "location" | "furnishing" | "media";
    points: number;
};

export function useListingScore(values: PropertyDraftValues): {
    score: number;
    tips: ListingScoreTip[];
} {
    return useMemo(() => {
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
                points: 25,
                label: "Complete the required basics",
                step: "basics",
            },
            {
                done: values.media.photos.length >= 6,
                points: 20,
                label: "Add 6 or more photos",
                step: "media",
            },
            {
                done: values.basics.description.trim().length >= 150,
                points: 10,
                label: "Write a detailed description",
                step: "basics",
            },
            {
                done: Object.values(values.amenities).flat().length >= 5,
                points: 10,
                label: "Choose at least 5 amenities",
                step: "furnishing",
            },
            {
                done: Boolean(
                    values.location.landmark &&
                    values.location.mapPinPlaced &&
                    values.location.lat != null &&
                    values.location.lng != null,
                ),
                points: 10,
                label: "Add a landmark and map pin",
                step: "location",
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
            {
                done: values.media.floorPlanFiles.length > 0,
                points: 5,
                label: "Add a floor plan",
                step: "media",
            },
            {
                done: values.documents.length > 0,
                points: 5,
                label: "Add a property document",
                step: "media",
            },
        ];

        return {
            score: checks.reduce((sum, check) => sum + (check.done ? check.points : 0), 0),
            tips: checks
                .filter((check) => !check.done)
                .slice(0, 3)
                .map(({ label, step, points }) => ({ label, step, points })),
        };
    }, [values]);
}
