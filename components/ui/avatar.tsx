"use client";

import * as React from "react";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "cn";

function Avatar({
    className,
    size = "default",
    ...props
}: AvatarPrimitive.Root.Props & {
    size?: "default" | "sm" | "lg";
}) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            data-size={size}
            className={cn(
                `
                  group/avatar relative flex shrink-0 rounded-full bg-surface shadow-xs ring-1
                  ring-border-warm select-none block-10 inline-10
                  data-[size=lg]:block-12 data-[size=lg]:inline-12
                  data-[size=sm]:block-8 data-[size=sm]:inline-8
                `,
                className,
            )}
            {...props}
        />
    );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn(
                "aspect-square rounded-full object-cover block-full inline-full",
                className,
            )}
            {...props}
        />
    );
}

function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                `
                  flex items-center justify-center rounded-full bg-surface-muted font-sans text-sm
                  font-semibold text-muted-foreground block-full inline-full
                  group-data-[size=lg]/avatar:text-base
                  group-data-[size=sm]/avatar:text-xs
                `,
                className,
            )}
            {...props}
        />
    );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="avatar-badge"
            className={cn(
                `
                  absolute inset-e-0 inset-be-0 z-10 inline-flex items-center justify-center
                  rounded-full bg-primary text-primary-foreground bg-blend-color shadow-xs ring-2
                  ring-surface select-none
                `,
                `
                  group-data-[size=sm]/avatar:block-2.5 group-data-[size=sm]/avatar:inline-2.5
                  group-data-[size=sm]/avatar:[&>svg]:hidden
                `,
                `
                  group-data-[size=default]/avatar:block-3 group-data-[size=default]/avatar:inline-3
                  group-data-[size=default]/avatar:[&>svg]:block-2
                  group-data-[size=default]/avatar:[&>svg]:inline-2
                `,
                `
                  group-data-[size=lg]/avatar:block-3.5 group-data-[size=lg]/avatar:inline-3.5
                  group-data-[size=lg]/avatar:[&>svg]:block-2.5
                  group-data-[size=lg]/avatar:[&>svg]:inline-2.5
                `,
                className,
            )}
            {...props}
        />
    );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="avatar-group"
            className={cn(
                `
                  group/avatar-group flex -space-x-2.5
                  *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-surface
                `,
                className,
            )}
            {...props}
        />
    );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="avatar-group-count"
            className={cn(
                `
                  relative flex shrink-0 items-center justify-center rounded-full bg-surface-muted
                  font-sans text-sm font-semibold text-muted-foreground shadow-xs ring-2
                  ring-surface block-10 inline-10
                  group-has-data-[size=lg]/avatar-group:block-12
                  group-has-data-[size=lg]/avatar-group:inline-12
                  group-has-data-[size=sm]/avatar-group:block-8
                  group-has-data-[size=sm]/avatar-group:inline-8
                  [&>svg]:block-4 [&>svg]:inline-4
                  group-has-data-[size=lg]/avatar-group:[&>svg]:block-5
                  group-has-data-[size=lg]/avatar-group:[&>svg]:inline-5
                  group-has-data-[size=sm]/avatar-group:[&>svg]:block-3.5
                  group-has-data-[size=sm]/avatar-group:[&>svg]:inline-3.5
                `,
                className,
            )}
            {...props}
        />
    );
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
