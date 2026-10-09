"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { type FieldPath, useFormContext, useWatch } from "react-hook-form";

import type { PropertyDraftValues } from "@/lib/schemas/property";
import { derive } from "@/lib/visibility/derive";
import {
    isStepVisible,
    isVisible,
    labelOf,
    levelOf,
    missingRequiredFields,
    RULE_DRIVER_PATHS,
    STEP_FIELD_PATHS,
} from "@/lib/visibility/rules";

import type { PropertyFormStep } from "@/constants/property";

type FieldRulesApi = {
    values: PropertyDraftValues;
    derived: ReturnType<typeof derive>;
    showHidden: boolean;
    setShowHidden: (show: boolean) => void;
    isVisible: (path: string) => boolean;
    levelOf: (path: string) => ReturnType<typeof levelOf>;
    labelOf: (path: string, fallback?: string) => string;
    visibleFieldsInStep: (step: PropertyFormStep) => readonly string[];
    requiredLeftInStep: (step: PropertyFormStep) => ReturnType<typeof missingRequiredFields>;
    missingRequiredFields: () => ReturnType<typeof missingRequiredFields>;
    isStepVisible: (step: PropertyFormStep) => boolean;
};

const FieldRulesContext = createContext<FieldRulesApi | null>(null);

export function FieldRulesProvider({ children }: { children: ReactNode }) {
    const { control, getValues } = useFormContext<PropertyDraftValues>();
    const watchedDrivers = useWatch({
        control,
        name: RULE_DRIVER_PATHS as readonly FieldPath<PropertyDraftValues>[],
    });
    const watchedRequiredValues = useWatch({
        control,
        name: Object.values(STEP_FIELD_PATHS).flat() as FieldPath<PropertyDraftValues>[],
    });
    const [showHidden, setShowHidden] = useState(false);
    const values = useMemo(() => {
        void watchedDrivers;
        void watchedRequiredValues;
        return getValues();
    }, [getValues, watchedDrivers, watchedRequiredValues]);

    const api = useMemo<FieldRulesApi>(() => {
        const derived = derive(values);
        return {
            values,
            derived,
            showHidden,
            setShowHidden,
            isVisible: (path) => isVisible(path, values),
            levelOf: (path) => levelOf(path, values),
            labelOf: (path, fallback) => labelOf(path, values, fallback),
            visibleFieldsInStep: (step) =>
                STEP_FIELD_PATHS[step].filter((path) => isVisible(path, values)),
            requiredLeftInStep: (step) => missingRequiredFields(values, step),
            missingRequiredFields: () => missingRequiredFields(values),
            isStepVisible: (step) => isStepVisible(step, values),
        };
    }, [showHidden, values]);

    return <FieldRulesContext.Provider value={api}>{children}</FieldRulesContext.Provider>;
}

export function useFieldRules(): FieldRulesApi {
    const context = useContext(FieldRulesContext);
    if (!context) throw new Error("useFieldRules must be used inside FieldRulesProvider");
    return context;
}
