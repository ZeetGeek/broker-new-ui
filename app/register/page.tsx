import { parsePortal } from "@/features/auth/portal";
import { RegisterWizard } from "@/features/auth/register-wizard";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ portal?: string }>;
}) {
    const { portal } = await searchParams;

    return <RegisterWizard initialPortal={parsePortal(portal)} />;
}
