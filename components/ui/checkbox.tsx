"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                `
                  t-check group/checkbox peer relative flex shrink-0 items-center justify-center
                  rounded-sm border-2 border-border-warm bg-surface text-surface outline-none
                  block-5 inline-5
                  after:absolute after:-inset-2
                  hover:border-ink-subtle
                  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                  disabled:cursor-not-allowed disabled:opacity-50
                  aria-invalid:border-danger-mid
                  aria-invalid:focus-visible:ring-danger/20
                  data-checked:border-brand data-checked:bg-brand data-checked:text-surface
                  data-checked:hover:border-brand
                  data-indeterminate:border-brand data-indeterminate:bg-brand
                  data-indeterminate:text-surface data-indeterminate:hover:border-brand
                `,
                className,
            )}
            {...props}
        >
            {/*
              keepMounted: path stays in the DOM so stroke-dashoffset can
              transition both ways (transitions.dev 25 — mid-draw uncheck reverses).
            */}
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                keepMounted
                className="relative grid place-content-center text-current block-3 inline-3"
            >
                <svg
                    viewBox="0 0 10.1668 10.1668"
                    className="
                      t-check-mark absolute inset-0
                      group-data-indeterminate/checkbox:invisible
                    "
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        className="t-check-path"
                        d="M1 5.52L3.92 9.17L9.17 1"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <svg
                    viewBox="0 0 12 12"
                    className="
                      t-check-dash invisible absolute inset-0
                      group-data-indeterminate/checkbox:visible
                    "
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M3 6H9"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                </svg>
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
