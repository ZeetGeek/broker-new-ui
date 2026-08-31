import type { UserProfile } from "@/lib/api/profile";

import type { BrokerProfileMenuBroker } from "./profile-menu";

export type BrokerVerificationState =
    | "PROFILE_INCOMPLETE"
    | "PENDING_VERIFICATION"
    | "VERIFIED";

export function mapBrokerVerificationState(profile: UserProfile | null): BrokerVerificationState {
    const verified = profile?.verified ?? profile?.broker?.verified;
    if (verified) return "VERIFIED";

    const license = profile?.licenseNumber ?? profile?.broker?.licenseNumber;
    if (license?.trim()) return "PENDING_VERIFICATION";

    return "PROFILE_INCOMPLETE";
}

export function computeBrokerProfileCompletion(profile: UserProfile | null): number {
    if (!profile) return 0;

    const checks = [
        Boolean(profile.fullName?.trim()),
        Boolean(profile.phone?.replace(/\D/g, "").slice(-10).length === 10),
        Boolean(profile.licenseNumber?.trim() ?? profile.broker?.licenseNumber?.trim()),
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
): BrokerProfileMenuBroker {
    const phoneDigits = profile?.phone?.replace(/\D/g, "") ?? "";
    const tenDigit = phoneDigits.slice(-10);

    return {
        name: profile?.fullName?.trim() || fallbackName,
        phone: tenDigit.length === 10 ? tenDigit : phoneDigits,
        avatarUrl: profile?.avatarUrl ?? undefined,
        verificationState: mapBrokerVerificationState(profile),
        profileCompletion: computeBrokerProfileCompletion(profile),
        publicSlug: profile?.broker?.publicSlug ?? null,
    };
}
