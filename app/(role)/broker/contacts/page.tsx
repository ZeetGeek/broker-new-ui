import type { Metadata } from "next";

import { ContactsPage } from "@/features/contacts/contacts-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ContactsPage />;
}
