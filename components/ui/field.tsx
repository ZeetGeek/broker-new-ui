"use client";

import { useMemo } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
    return (
        <fieldset
            data-slot="field-set"
            className={cn(
                `
                  flex flex-col gap-6
                  has-[>[data-slot=checkbox-group]]:gap-3
                  has-[>[data-slot=radio-group]]:gap-3
                `,
                className,
            )}
            {...props}
        />
    );
}

function FieldLegend({
    className,
    variant = "legend",
    ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
    return (
        <legend
            data-slot="field-legend"
            data-variant={variant}
            className={cn(
                "mbe-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
                className,
            )}
            {...props}
        />
    );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-group"
            className={cn(
                `
                  group/field-group @container/field-group flex flex-col gap-7 inline-full
                  data-[slot=checkbox-group]:gap-3
                  *:data-[slot=field-group]:gap-4
                `,
                className,
            )}
            {...props}
        />
    );
}

const fieldVariants = cva(
    "group/field flex gap-3 inline-full data-[invalid=true]:text-destructive",
    {
        variants: {
            orientation: {
                vertical: "flex-col *:inline-full [&>.sr-only]:inline-auto",
                horizontal: `
                  flex-row items-center
                  has-[>[data-slot=field-content]]:items-start
                  *:data-[slot=field-label]:flex-auto
                  has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mbs-px
                `,
                responsive: `
                  flex-col
                  *:inline-full
                  @md/field-group:flex-row @md/field-group:items-center
                  @md/field-group:*:inline-auto
                  @md/field-group:has-[>[data-slot=field-content]]:items-start
                  @md/field-group:*:data-[slot=field-label]:flex-auto
                  [&>.sr-only]:inline-auto
                  @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mbs-px
                `,
            },
        },
        defaultVariants: {
            orientation: "vertical",
        },
    },
);

function Field({
    className,
    orientation = "vertical",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
    return (
        <div
            role="group"
            data-slot="field"
            data-orientation={orientation}
            className={cn(fieldVariants({ orientation }), className)}
            {...props}
        />
    );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-content"
            className={cn("group/field-content flex flex-1 flex-col gap-1 leading-snug", className)}
            {...props}
        />
    );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
    return (
        <Label
            data-slot="field-label"
            className={cn(
                `
                  group/field-label peer/field-label flex gap-2 leading-snug inline-fit
                  group-data-[disabled=true]/field:opacity-50
                  has-data-checked:bg-input/30
                  has-[>[data-slot=field]]:rounded-inner has-[>[data-slot=field]]:border
                  has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40
                  has-[>[data-slot=field]]:has-focus-visible:border-ring
                  has-[>[data-slot=field]]:has-focus-visible:ring-3
                  has-[>[data-slot=field]]:has-focus-visible:ring-ring/50
                  *:data-[slot=field]:p-4
                `,
                "has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:inline-full",
                className,
            )}
            {...props}
        />
    );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="field-label"
            className={cn(
                `
                  flex items-center gap-2 text-sm font-medium inline-fit
                  group-data-[disabled=true]/field:opacity-50
                `,
                className,
            )}
            {...props}
        />
    );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="field-description"
            className={cn(
                `
                  text-start text-sm/normal font-normal text-muted-foreground
                  group-has-data-horizontal/field:text-balance
                  [[data-variant=legend]+&]:-mbs-1.5
                `,
                "last:mbs-0 nth-last-2:-mbs-1",
                "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
                className,
            )}
            {...props}
        />
    );
}

function FieldSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<"div"> & {
    children?: React.ReactNode;
}) {
    return (
        <div
            data-slot="field-separator"
            data-content={!!children}
            className={cn(
                "relative -my-2 text-sm block-5 group-data-[variant=outline]/field-group:-mbe-2",
                className,
            )}
            {...props}
        >
            <Separator className="absolute inset-0 inset-bs-1/2" />
            {children && (
                <span
                    className="
                      relative mx-auto block bg-background px-2 text-muted-foreground inline-fit
                    "
                    data-slot="field-separator-content"
                >
                    {children}
                </span>
            )}
        </div>
    );
}

function FieldError({
    className,
    children,
    errors,
    ...props
}: React.ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | undefined>;
}) {
    const content = useMemo(() => {
        if (children) {
            return children;
        }

        if (!errors?.length) {
            return null;
        }

        const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

        if (uniqueErrors?.length == 1) {
            return uniqueErrors[0]?.message;
        }

        return (
            <ul className="ms-4 flex list-disc flex-col gap-1">
                {uniqueErrors.map(
                    (error, index) => error?.message && <li key={index}>{error.message}</li>,
                )}
            </ul>
        );
    }, [children, errors]);

    if (!content) {
        return null;
    }

    return (
        <div
            role="alert"
            data-slot="field-error"
            className={cn("text-sm font-normal text-destructive", className)}
            {...props}
        >
            {content}
        </div>
    );
}

export {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
};
