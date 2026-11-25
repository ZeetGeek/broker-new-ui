"use client";

import type { AppIcon } from "@/components/shared/icons";
import { WorkflowLink } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

export type EmptyStateActionProps = {
    label: string;
    icon: AppIcon;
    disabled?: boolean;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Empty-state actions share a compact button and a leading semantic icon. */
export function EmptyStateAction({
    label,
    icon: Icon,
    disabled,
    href,
    onClick,
    tone = "default",
}: EmptyStateActionProps & { tone?: "default" | "inverse" }) {
    return href !== undefined ? (
        <Button
            variant={tone === "inverse" ? "highlight" : "outline"}
            size="sm"
            disabled={disabled}
            nativeButton={false}
            render={<WorkflowLink href={href} />}
        >
            <Icon aria-hidden />
            {label}
        </Button>
    ) : (
        <Button
            type="button"
            variant={tone === "inverse" ? "highlight" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={onClick}
        >
            <Icon aria-hidden />
            {label}
        </Button>
    );
}
