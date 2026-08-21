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
        description: "You have a property to sell or rent.",
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
