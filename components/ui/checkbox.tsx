"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                `
                  peer relative flex shrink-0 items-center justify-center rounded-control border-2
                  border-border-warm bg-surface text-surface outline-none block-5 inline-5
                  after:absolute after:-inset-2
                  hover:border-ink-subtle
                  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                  disabled:cursor-not-allowed disabled:opacity-50
                  aria-invalid:border-danger-mid
                  aria-invalid:focus-visible:ring-danger/20
                  data-checked:border-brand data-checked:bg-brand data-checked:text-surface
                  data-checked:hover:border-brand
                `,
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="grid place-content-center text-current transition-none"
            >
                <Check className="block-3.5 inline-3.5" strokeWidth={2} aria-hidden="true" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
