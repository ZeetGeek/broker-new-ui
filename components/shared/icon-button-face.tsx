import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import type { IconButtonProps } from "@/components/shared/icon-button";

import styles from "./icon-button.module.css";

/** Decorative shared icon-button face inside an existing interactive trigger. */
export function IconButtonFace({
    size = "sm",
    appearance = "outline",
    tone = "neutral",
    color,
    className,
    style,
    ...props
}: Omit<ComponentProps<"span">, "color"> &
    Pick<IconButtonProps, "size" | "appearance" | "tone" | "color">) {
    return (
        <span
            {...props}
            aria-hidden
            data-icon-button=""
            data-icon-size={size}
            data-icon-appearance={appearance}
            data-tone={tone}
            data-custom-color={color ? "" : undefined}
            className={cn(styles.button, "shrink-0", className)}
            style={
                { ...style, ...(color ? { "--icon-button-color": color } : {}) } as CSSProperties
            }
        />
    );
}
