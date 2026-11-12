"use client";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { bathroomsForBhk } from "@/lib/properties/bhk";
import type { PropertyDraftValues } from "@/lib/schemas/property";

/**
 * Pre-fills bathrooms from BHK (2 BHK → 2 bathrooms). It keeps following BHK
 * until the user picks a different bathroom count, which is then left alone.
 */
export function useBathroomsFollowBhk() {
    const { control, getValues, setValue } = useFormContext<PropertyDraftValues>();
    const bedrooms = useWatch({ control, name: "details.bedrooms" });
    const previous = useRef<string | null>(null);

    useEffect(() => {
        const isFirstRun = previous.current === null;
        const before = previous.current;
        previous.current = bedrooms ?? "";
        if (!isFirstRun && before === bedrooms) return;

        const next = bathroomsForBhk(bedrooms);
        if (next == null) return;
        const current = getValues("details.bathrooms");
        // Blank, or still the value we filled for the previous BHK → follow the new BHK.
        const following = current == null || (!isFirstRun && current === bathroomsForBhk(before));
        if (!following || current === next) return;
        setValue("details.bathrooms", next, { shouldDirty: !isFirstRun });
    }, [bedrooms, getValues, setValue]);
}
