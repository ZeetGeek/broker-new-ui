import type { UserProfile } from "@/lib/api/profile";

import { FEATURE_RERA_VERIFICATION } from "@/config/index";

import type { BrokerProfileMenuBroker } from "./profile-menu";

export type BrokerVerificationState = "PROFILE_INCOMPLETE" | "PENDING_VERIFICATION" | "VERIFIED";

export function mapBrokerVerificationState(profile: UserProfile | null): BrokerVerificationState {
    // Match the profile form's source of truth; an explicitly cleared broker
    // RERA number must not fall back to an older flattened value.
    const license = profile?.broker?.licenseNumber ?? profile?.licenseNumber;
    if (!license?.trim()) return "PROFILE_INCOMPLETE";

    const verified = profile?.broker?.verified ?? profile?.verified;
    return verified ? "VERIFIED" : "PENDING_VERIFICATION";
}

export function computeBrokerProfileCompletion(profile: UserProfile | null): number {
    if (!profile) return 0;

    const checks = [
        Boolean(profile.fullName?.trim()),
        Boolean(profile.phone?.replace(/\D/g, "").slice(-10).length === 10),
        // Hidden RERA field does not count against profile completion.
        ...(FEATURE_RERA_VERIFICATION
            ? [Boolean(profile.licenseNumber?.trim() ?? profile.broker?.licenseNumber?.trim())]
            : []),
        Boolean((profile.broker?.serviceAreas?.length ?? 0) > 0),
        Boolean(profile.avatarUrl?.trim()),
        Boolean(profile.broker?.bio?.trim()),
    ];

    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
}

export function mapBrokerProfileMenuBroker(
    profile: UserProfile | null,
    fallbackName: string,
    fallbackEmail?: string,
): BrokerProfileMenuBroker {
    const phoneDigits = profile?.phone?.replace(/\D/g, "") ?? "";
    const tenDigit = phoneDigits.slice(-10);

    return {
        name: profile?.fullName?.trim() || fallbackName,
        phone: tenDigit.length === 10 ? tenDigit : phoneDigits,
        email: profile?.email?.trim() || fallbackEmail?.trim() || undefined,
        avatarUrl: profile?.avatarUrl ?? undefined,
        verificationState: mapBrokerVerificationState(profile),
        profileCompletion: computeBrokerProfileCompletion(profile),
        publicSlug: profile?.broker?.publicSlug ?? null,
    };
}
