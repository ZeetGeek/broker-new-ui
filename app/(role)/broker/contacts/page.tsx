import type { Metadata } from "next";

import { ContactsPage } from "@/features/contacts/contacts-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ add?: string; flow?: string }>;
}) {
    const query = await searchParams;
    return (
        <ContactsPage
            key={`${query.add ?? ""}:${query.flow ?? ""}`}
            initialAddBuyer={query.add === "buyer"}
            addDealFlow={query.flow === "add-deal"}
        />
    );
}
