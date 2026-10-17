import { BADGE_COLORS, type BadgeColor } from "@/components/ui/badge";

export const BADGE_COLOR_SWATCHES: { name: BadgeColor; label: string; sample: string }[] =
    BADGE_COLORS.map((name) => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        sample: name.charAt(0).toUpperCase() + name.slice(1),
    }));
