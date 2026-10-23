import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import { PublicPropertyShell } from "@/features/properties/public-property/public-property-shell";

export default function Loading() {
    return (
        <PublicPropertyShell>
            <PropertyDetailSkeleton isPublic />
        </PublicPropertyShell>
    );
}
