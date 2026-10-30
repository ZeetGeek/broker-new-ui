import * as React from "react";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

const attachmentVariants = cva(
    `
      group/attachment relative flex shrink-0 flex-wrap rounded-card border border-border-warm
      bg-surface text-ink shadow-xs transition-[border-color,background-color,box-shadow]
      duration-160 inline-fit max-inline-full min-inline-0
      focus-within:border-brand/40 focus-within:ring-3 focus-within:ring-brand/15
      has-[>a,>button]:hover:bg-surface-muted
      data-[state=error]:border-danger/40 data-[state=error]:bg-danger-soft/40
      data-[state=idle]:border-dashed data-[state=idle]:bg-surface-muted/60
    `,
    {
        variants: {
            size: {
                default: `
                      gap-2 text-sm
                      has-data-[slot=attachment-content]:px-2.5
                      has-data-[slot=attachment-content]:py-2
                      has-data-[slot=attachment-media]:p-2
                    `,
                sm: `
                  gap-2.5 text-xs
                  has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5
                  has-data-[slot=attachment-media]:p-1.5
                `,
                xs: `
                  gap-1.5 rounded-inner text-xs
                  has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1
                  has-data-[slot=attachment-media]:p-1
                `,
            },
            orientation: {
                horizontal: "items-center min-inline-40",
                vertical: "flex-col inline-24 has-data-[slot=attachment-content]:inline-30",
            },
        },
        defaultVariants: {
            size: "default",
            orientation: "horizontal",
        },
    },
);

function Attachment({
    className,
    state = "done",
    size = "default",
    orientation = "horizontal",
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof attachmentVariants> & {
        state?: "idle" | "uploading" | "processing" | "error" | "done";
    }) {
    return (
        <div
            data-slot="attachment"
            data-state={state}
            data-size={size}
            data-orientation={orientation}
            className={cn(attachmentVariants({ size, orientation }), className)}
            {...props}
        />
    );
}

const attachmentMediaVariants = cva(
    `
      relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-inner
      bg-surface-muted text-ink inline-10
      group-data-[orientation=vertical]/attachment:inline-full
      group-data-[size=sm]/attachment:inline-8
      group-data-[size=xs]/attachment:rounded-control group-data-[size=xs]/attachment:inline-7
      group-data-[state=error]/attachment:bg-danger-soft
      group-data-[state=error]/attachment:text-danger
      group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:block-6!
      group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:inline-6!
      [&_svg]:pointer-events-none
      [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
      group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:block-6
      group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:inline-6
      group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:block-3.5
      group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:inline-3.5
    `,
    {
        variants: {
            variant: {
                icon: "",
                image: `
                  opacity-60
                  group-data-[state=done]/attachment:opacity-100
                  group-data-[state=idle]/attachment:opacity-100
                  *:[img]:aspect-square *:[img]:object-cover *:[img]:inline-full
                `,
            },
        },
        defaultVariants: {
            variant: "icon",
        },
    },
);

function AttachmentMedia({
    className,
    variant = "icon",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
    return (
        <div
            data-slot="attachment-media"
            data-variant={variant}
            className={cn(attachmentMediaVariants({ variant }), className)}
            {...props}
        />
    );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="attachment-content"
            className={cn(
                `
                  flex-1 leading-tight max-inline-full min-inline-0
                  group-data-[orientation=vertical]/attachment:px-1
                `,
                className,
            )}
            {...props}
        />
    );
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="attachment-title"
            className={cn(
                `
                  block truncate font-medium text-ink max-inline-full min-inline-0
                  group-data-[state=processing]/attachment:shimmer
                  group-data-[state=uploading]/attachment:shimmer
                `,
                className,
            )}
            {...props}
        />
    );
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="attachment-description"
            className={cn(
                `
                  mbs-0.5 block truncate text-xs text-ink-muted max-inline-full min-inline-0
                  group-data-[state=error]/attachment:text-danger
                `,
                className,
            )}
            {...props}
        />
    );
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="attachment-actions"
            className={cn(
                `
                  relative z-20 flex shrink-0 items-center
                  group-data-[orientation=vertical]/attachment:absolute
                  group-data-[orientation=vertical]/attachment:inset-e-3
                  group-data-[orientation=vertical]/attachment:inset-bs-3
                  group-data-[orientation=vertical]/attachment:gap-1
                `,
                className,
            )}
            {...props}
        />
    );
}

function AttachmentAction({
    className,
    variant,
    size = "icon-xs",
    ...props
}: React.ComponentProps<typeof Button>) {
    return (
        <Button
            data-slot="attachment-action"
            variant={variant ?? "ghost"}
            size={size}
            className={cn(className)}
            {...props}
        />
    );
}

function AttachmentTrigger({
    className,
    render,
    type,
    ...props
}: useRender.ComponentProps<"button">) {
    return useRender({
        defaultTagName: "button",
        props: mergeProps<"button">(
            {
                type: render ? type : (type ?? "button"),
                className: cn("absolute inset-0 z-10 outline-none", className),
            },
            props,
        ),
        render,
        state: {
            slot: "attachment-trigger",
        },
    });
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="attachment-group"
            className={cn(
                `
                  flex scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3
                  overflow-x-auto overscroll-x-contain py-1 min-inline-0
                  *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start
                  [&::-webkit-scrollbar]:hidden
                `,
                className,
            )}
            {...props}
        />
    );
}

export {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
};
