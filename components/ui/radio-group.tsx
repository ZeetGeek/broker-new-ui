"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
    return (
        <RadioGroupPrimitive
            data-slot="radio-group"
            className={cn("grid gap-3 inline-full", className)}
            {...props}
        />
    );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
    return (
        <RadioPrimitive.Root
            data-slot="radio-group-item"
            className={cn(
                `
          group/radio-group-item peer relative flex aspect-square shrink-0 rounded-full border
          border-transparent bg-input/90 outline-none block-4 inline-4
          group-has-focus-visible/field-label:border-transparent
          group-has-focus-visible/field-label:ring-0
          after:absolute after:-inset-x-3 after:-inset-y-2
          focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20
          dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
          data-checked:bg-primary data-checked:text-primary-foreground
          dark:data-checked:bg-primary
        `,
                className,
            )}
            {...props}
        >
            <RadioPrimitive.Indicator
                data-slot="radio-group-indicator"
                className="flex items-center justify-center block-4 inline-4"
            >
                <span
                    className="
          absolute inset-s-1/2 inset-bs-1/2 -translate-1/2 rounded-full bg-primary-foreground
          block-2 inline-2
          rtl:translate-x-1/2
          dark:block-2.5 dark:inline-2.5
        "
                />
            </RadioPrimitive.Indicator>
        </RadioPrimitive.Root>
    );
}

export { RadioGroup, RadioGroupItem };
