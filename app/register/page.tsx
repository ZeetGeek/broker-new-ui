import { RegisterWizard } from "@/features/auth/register-wizard";

type Portal = "owner" | "broker";

function parsePortal(value: string | undefined): Portal {
    return value === "broker" ? "broker" : "owner";
}

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ portal?: string }>;
}) {
    const { portal } = await searchParams;

    return <RegisterWizard initialPortal={parsePortal(portal)} />;
}
