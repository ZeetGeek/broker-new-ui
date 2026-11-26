import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import styles from "./icon-button.module.css";

export type IconButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size" | "color"> & {
    /** Face size: 24, 32, 36 or 44px. Both large sizes use 44px. */
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** Ghost inside grouped controls; inverse on dark surfaces; outline otherwise. */
    appearance?: "outline" | "ghost" | "inverse";
    tone?: "neutral" | "brand" | "danger" | "success" | "warning";
    /** Custom icon colour; the background, border and shadow derive from it. */
    color?: CSSProperties["color"];
};

const sizes = { xs: "icon-xs", sm: "icon-sm", md: "icon", lg: "icon-md", xl: "icon-lg" } as const;

/** Shared icon-only action. Supply an accessible name and a Tabler registry icon. */
export function IconButton({
    size = "sm",
    appearance = "outline",
    tone = "neutral",
    color,
    className,
    style,
    type = "button",
    loading = false,
    disabled,
    children,
    ...props
}: IconButtonProps) {
    return (
        <Button
            {...props}
            type={type}
            loading={loading}
            disabled={disabled || loading}
            variant="ghost"
            size={sizes[size]}
            data-icon-button=""
            data-icon-size={size}
            data-icon-appearance={appearance}
            data-tone={tone}
            data-custom-color={color ? "" : undefined}
            className={cn(styles.button, className)}
            style={
                { ...style, ...(color ? { "--icon-button-color": color } : {}) } as CSSProperties
            }
        >
            {loading ? null : children}
        </Button>
    );
}
