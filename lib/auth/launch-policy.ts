import { FEATURE_PLATFORM_OWNER } from "@/config";

export const OWNER_UNAVAILABLE_HREF = "/owner-unavailable";

/** New-account choices may change with the launch; existing account roles must not. */
export function signupPortal(
    requested: "owner" | "broker" | undefined,
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): "owner" | "broker" {
    return ownerEnabled ? (requested ?? "owner") : "broker";
}

export function isOwnerUnavailable(
    role: string | null | undefined,
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): boolean {
    return role === "owner" && !ownerEnabled;
}
