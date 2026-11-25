"use client";

import { cn } from "@/lib/utils";

import { Check } from "@/components/shared/icons";

import type { FORM_STEPS, PropertyFormStep } from "@/constants/property";

import styles from "./property-form.module.css";

export function MobileFormStepper({
    steps,
    step,
    completed,
    onChange,
}: {
    steps: readonly (typeof FORM_STEPS)[number][];
    step: PropertyFormStep;
    completed: Set<PropertyFormStep>;
    onChange: (step: PropertyFormStep) => void;
}) {
    const index = steps.findIndex((item) => item.id === step);
    return (
        <nav aria-label="Property form steps" className={styles.stepper}>
            <div className={styles.stepCaption}>
                <span>{steps[index]?.label}</span>
                <span className="tabular">
                    Step {index + 1} of {steps.length}
                </span>
            </div>
            <ol className={styles.stepTrack}>
                {steps.map((item, i) => (
                    <li key={item.id} className={cn(styles.step, i <= index && styles.reachedStep)}>
                        <button
                            type="button"
                            aria-label={`Step ${i + 1}: ${item.label}${completed.has(item.id) ? ", complete" : ""}`}
                            aria-current={item.id === step ? "step" : undefined}
                            className={styles.stepButton}
                            onClick={() => onChange(item.id)}
                        >
                            <span
                                className={cn(
                                    styles.stepNumber,
                                    item.id === step && styles.activeNumber,
                                )}
                            >
                                {completed.has(item.id) && item.id !== step ? (
                                    <Check aria-hidden />
                                ) : (
                                    i + 1
                                )}
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
