import { pxToRem } from "@/lib/styles/rem";
import { cn } from "@/lib/utils";

import { LogoMark } from "@/components/shared/logo";

export function LogoAppIcon({
    className,
    fillClassName,
    size = 64,
}: {
    className?: string;
    fillClassName?: string;
    size?: number;
}) {
    return (
        <div
            className={cn("flex items-center justify-center rounded-card", className)}
            style={{ width: pxToRem(size), height: pxToRem(size) }}
        >
            <LogoMark size={size * 0.72} className={fillClassName} decorative />
        </div>
    );
}
