import { ContactsSkeleton } from "@/features/contacts/contacts-skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3" aria-hidden>
                <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-64" />
                <div className="animate-pulse rounded-full bg-surface-muted block-9 inline-52" />
            </div>
            <ContactsSkeleton />
        </div>
    );
}
