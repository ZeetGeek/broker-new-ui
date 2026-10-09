import { readPortal } from "@/features/auth/portal";
import { RegisterWizard } from "@/features/auth/register-wizard";

function normalizeReferralCode(value: string | undefined): string {
    return (value ?? "").trim().toUpperCase();
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ portal?: string; role?: string; ref?: string; step?: string }>;
}) {
    const { portal, role, ref, step } = await searchParams;
    const chosenPortal = readPortal(portal) ?? readPortal(role);
    // console.log("portal=>",portal)

    return (
        <RegisterWizard
            initialPortal={chosenPortal}
            initialStep={chosenPortal && step === "account" ? "account" : "role"}
            initialReferralCode={normalizeReferralCode(ref)}
        />
    );
}
