export type Portal = "owner" | "broker";

export const PORTAL_OPTIONS: { value: Portal; label: string }[] = [
    { value: "owner", label: "As an owner" },
    { value: "broker", label: "As a broker" },
];

export function parsePortal(value: string | undefined): Portal {
    return value === "broker" ? "broker" : "owner";
}
