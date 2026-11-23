import type {
    PeoplePickerLookingFor,
    PeoplePickerPerson,
    PeoplePickerRole,
} from "@/components/shared/people-picker";
import type { BadgeColor } from "@/components/ui/badge";

export const LOOKING_FOR_BADGE: Record<
    PeoplePickerLookingFor,
    { label: string; color: BadgeColor }
> = {
    buy: { label: "Buying", color: "emerald" },
    rent: { label: "Renting", color: "orange" },
    both: { label: "Buying or renting", color: "purple" },
};

export const OWNER_TYPE_LABEL = {
    individual: "Individual owner",
    builder: "Builder",
    company: "Company owner",
    platform: "Platform owner",
    exclusive: "Exclusive owner",
} as const;

export function peopleRoleLabel(role: PeoplePickerRole): string {
    return role === "owner" ? "Owner" : "Client";
}

export function peoplePersonTrailingBadge(person: PeoplePickerPerson): {
    label: string;
    color: BadgeColor;
} | null {
    if (person.role === "client" && person.lookingFor) {
        return LOOKING_FOR_BADGE[person.lookingFor];
    }
    if (person.role === "owner" && person.ownerType) {
        return { label: OWNER_TYPE_LABEL[person.ownerType], color: "emerald" };
    }
    return null;
}

export function peoplePersonMatchesQuery(person: PeoplePickerPerson, query: string): boolean {
    if (!query) return true;
    const trailing = peoplePersonTrailingBadge(person);
    const haystack = [
        person.name,
        person.phoneDigits ?? "",
        peopleRoleLabel(person.role),
        trailing?.label ?? "",
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(query);
}
