import {
    Activity,
    type AppIcon,
    Building2,
    CalendarCheck,
    Handshake,
    UserRound,
    UserRoundPlus,
    Users,
} from "@/components/shared/icons";

/** Icons for the activity categories the backend writes. */
const ICONS: Record<string, AppIcon> = {
    calendar: CalendarCheck,
    clients: UserRoundPlus,
    properties: Building2,
    representation: Handshake,
    team: Users,
    profile: UserRound,
};

export function activityIcon(category: string | undefined): AppIcon {
    return (category && ICONS[category]) || Activity;
}
