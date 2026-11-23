import type { PeoplePickerLookingFor, PeoplePickerPerson } from "@/components/shared/people-picker";

type OwnerType = NonNullable<PeoplePickerPerson["ownerType"]>;

function lookingForFromClientType(type: string | null | undefined): PeoplePickerLookingFor | null {
    const value = (type ?? "").toLowerCase().trim();
    if (
        value === "renter" ||
        value === "rent" ||
        value === "tenant" ||
        value === "tenants" ||
        value === "looking_to_rent"
    ) {
        return "rent";
    }
    if (value === "both" || value === "buy_or_rent" || value === "buying_or_renting") {
        return "both";
    }
    if (
        value === "buyer" ||
        value === "buy" ||
        value === "investor" ||
        value === "looking_to_buy"
    ) {
        return "buy";
    }
    return null;
}

function ownerTypeFromApi(type: string | null | undefined): OwnerType | null {
    const value = (type ?? "").toLowerCase().trim();
    if (
        value === "individual" ||
        value === "builder" ||
        value === "company" ||
        value === "platform" ||
        value === "exclusive"
    ) {
        return value;
    }
    return null;
}

/** Minimal filter-sheet person → picker row. */
export function mapFilterPersonToPicker(
    person: { id: string; name: string },
    role: "client" | "owner",
): PeoplePickerPerson {
    return { id: person.id, name: person.name, role };
}

export function mapNamedPersonToPicker(
    person: { id: string; name: string; phoneDigits?: string; imageUrl?: string },
    role: "client" | "owner",
): PeoplePickerPerson {
    return {
        id: person.id,
        name: person.name,
        role,
        phoneDigits: person.phoneDigits,
        imageUrl: person.imageUrl,
    };
}

/**
 * Task link-options client.
 * Dropdowns show phone + Buying/Renting only — never locality / requirement text.
 */
export function mapTaskClientToPicker(client: {
    id: string;
    name: string;
    type?: string;
    requirement?: string;
    phoneDigits?: string;
}): PeoplePickerPerson {
    return {
        id: client.id,
        name: client.name,
        role: "client",
        phoneDigits: client.phoneDigits || undefined,
        lookingFor: lookingForFromClientType(client.type),
    };
}

/** Task link-options owner (platform / exclusive). */
export function mapTaskOwnerToPicker(owner: {
    id: string;
    name: string;
    type?: string;
    phoneDigits?: string;
}): PeoplePickerPerson {
    return {
        id: owner.id,
        name: owner.name,
        role: "owner",
        phoneDigits: owner.phoneDigits || undefined,
        ownerType: ownerTypeFromApi(owner.type),
    };
}

/** CRM ClientItem-shaped records — phone + lookingFor; no address line. */
export function mapClientItemToPicker(client: {
    id: string;
    name: string;
    phoneDigits?: string;
    lookingFor?: PeoplePickerLookingFor | null;
    type?: string;
    avatarUrl?: string | null;
}): PeoplePickerPerson {
    return {
        id: client.id,
        name: client.name,
        role: "client",
        phoneDigits: client.phoneDigits || undefined,
        lookingFor: client.lookingFor ?? lookingForFromClientType(client.type),
        imageUrl: client.avatarUrl ?? undefined,
    };
}

/** Exclusive / exclusive-owner picker rows. */
export function mapExclusiveOwnerToPicker(owner: {
    id: string;
    fullName?: string;
    name?: string;
    phone?: string | null;
    ownerType?: string | null;
}): PeoplePickerPerson {
    return {
        id: owner.id,
        name: owner.fullName ?? owner.name ?? "Owner",
        role: "owner",
        phoneDigits: owner.phone ? owner.phone.replace(/\D/g, "") || undefined : undefined,
        ownerType: ownerTypeFromApi(owner.ownerType),
    };
}
