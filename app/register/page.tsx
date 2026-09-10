import { parsePortal } from "@/features/auth/portal";
import { RegisterWizard } from "@/features/auth/register-wizard";

function normalizeReferralCode(value: string | undefined): string {
    return (value ?? "").trim().toUpperCase();
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ portal?: string; ref?: string }>;
}) {
    const { portal, ref } = await searchParams;

    return (
        <RegisterWizard
            initialPortal={parsePortal(portal)}
            initialReferralCode={normalizeReferralCode(ref)}
        />
    );
}
