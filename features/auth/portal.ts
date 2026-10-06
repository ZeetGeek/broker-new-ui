export type Portal = "owner" | "broker";

export const PORTAL_OPTIONS: {
    value: Portal;
    label: string;
    description: string;
    helper: string;
    rolePhrase: string;
    avatarSrc: string;
}[] = [
    {
        value: "owner",
        label: "Owner",
        description: "You have a property ready to sell or rent.",
        helper: "You'll add properties. Brokers ask you for permission to sell or rent them.",
        rolePhrase: "an owner",
        avatarSrc: "/avatars/owner.svg",
    },
    {
        value: "broker",
        label: "Broker",
        description: "You find buyers and tenants for properties.",
        helper: "You'll browse listed properties and ask owners if you can sell or rent them.",
        rolePhrase: "a broker",
        avatarSrc: "/avatars/broker.svg",
    },
];

export function parsePortal(value: string | undefined): Portal {
    return value === "broker" ? "broker" : "owner";
}

/** A portal only when the query actually names one. A missing value stays unset. */
export function readPortal(value: string | undefined): Portal | undefined {
    return value === "owner" || value === "broker" ? value : undefined;
}
