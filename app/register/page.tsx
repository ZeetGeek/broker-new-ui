import { signupPortal } from "@/lib/auth/launch-policy";

import { readPortal } from "@/features/auth/portal";
import { RegisterWizard } from "@/features/auth/register-wizard";

function normalizeReferralCode(value: string | undefined): string {
    return (value ?? "").trim().toUpperCase();
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{
        portal?: string;
        role?: string;
        ref?: string;
        step?: string;
        country?: string;
    }>;
}) {
    const { portal, role, ref, step, country } = await searchParams;
    const chosenPortal = signupPortal(readPortal(portal) ?? readPortal(role));

    return (
        <RegisterWizard
            initialPortal={chosenPortal}
            initialStep={chosenPortal && step === "account" ? "account" : "role"}
            initialReferralCode={normalizeReferralCode(ref)}
            initialCountryIso2={/^[A-Za-z]{2}$/.test(country ?? "") ? country : undefined}
        />
    );
}
