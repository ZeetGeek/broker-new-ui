import {
    type AppIcon,
    Armchair,
    Bath,
    BedDouble,
    Building2,
    CalendarCheck,
    CalendarClock,
    Car,
    Compass,
    DoorOpen,
    HandCoins,
    Layers,
    Monitor,
    Ruler,
    ShieldCheck,
    Tags,
    Users,
} from "@/components/shared/icons";

import type { buildPropertyFacts } from "./property-detail-facts";

import styles from "./property-detail.module.css";

const FACT_ICONS: Record<string, AppIcon> = {
    bhk: BedDouble,
    bathrooms: Bath,
    balconies: DoorOpen,
    area: Ruler,
    carpetArea: Ruler,
    category: Tags,
    type: Building2,
    furnishing: Armchair,
    floor: Layers,
    totalFloors: Layers,
    facing: Compass,
    propertyAge: CalendarClock,
    condition: ShieldCheck,
    parking: Car,
    maintenance: HandCoins,
    available: CalendarCheck,
    securityDeposit: ShieldCheck,
    cabins: DoorOpen,
    meetingRooms: Users,
    workstations: Monitor,
    ceilingHeight: Ruler,
};
export function PropertyFactsList({ facts }: { facts: ReturnType<typeof buildPropertyFacts> }) {
    return (
        <dl className={styles.facts}>
            {facts.map((fact) => {
                const Icon = FACT_ICONS[fact.key] ?? Building2;
                return (
                    <div className={styles.fact} key={fact.key}>
                        <dt>
                            <Icon size={22} strokeWidth={1.5} aria-hidden />
                            <span>{fact.label}</span>
                        </dt>
                        <dd>{fact.value}</dd>
                    </div>
                );
            })}
        </dl>
    );
}
