import { cn } from "@/lib/utils";

import styles from "./gradient-spinner.module.css";

/** Shared gradient loading ring. Pause it when it remains mounted in a hidden state. */
export function GradientSpinner({
    className,
    active = true,
    label = "Loading",
}: {
    className?: string;
    active?: boolean;
    label?: string;
}) {
    return (
        <span
            className={cn(styles.spinner, className)}
            role="status"
            aria-label={label}
            data-active={active}
        />
    );
}
