import { cn } from "@/lib/utils";

import { SITE_NAME } from "@/config/site";
import {
    LOGO_MARK_PATH,
    LOGO_VIEWBOX_HEIGHT,
    LOGO_VIEWBOX_WIDTH,
} from "@/features/design-system/theme/logo-tokens";

export function LogoMark({
    className,
    size = 48,
    title = SITE_NAME,
    decorative = false,
}: {
    className?: string;
    size?: number;
    title?: string;
    decorative?: boolean;
}) {
    const height = size * (LOGO_VIEWBOX_HEIGHT / LOGO_VIEWBOX_WIDTH);

    return (
        <svg
            width={size}
            height={height}
            viewBox={`0 0 ${LOGO_VIEWBOX_WIDTH} ${LOGO_VIEWBOX_HEIGHT}`}
            fill="currentColor"
            className={cn("shrink-0", className)}
            role={decorative ? undefined : "img"}
            aria-hidden={decorative || undefined}
            aria-label={decorative ? undefined : title}
        >
            {!decorative ? <title>{title}</title> : null}
            <path d={LOGO_MARK_PATH} />
        </svg>
    );
}

export function LogoLockup({
    className,
    markClassName,
    size = 32,
    decorative = false,
}: {
    className?: string;
    markClassName?: string;
    size?: number;
    decorative?: boolean;
}) {
    const wordPx = Math.round(size * 0.72);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <LogoMark size={size} className={markClassName} decorative={decorative} />
            <span
                className="font-display leading-none font-bold tracking-tight"
                style={{ fontSize: wordPx }}
            >
                {SITE_NAME}
            </span>
        </div>
    );
}

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
            style={{ width: size, height: size }}
        >
            <LogoMark size={size * 0.72} className={fillClassName} decorative />
        </div>
    );
}
