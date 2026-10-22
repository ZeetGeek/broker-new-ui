import { matchesPropertyCriteria, type PropertyListCriteria } from "@/lib/properties/list-criteria";

import type { VisitPropertySummary } from "@/features/site-visits/broker/model";

export function matchesVisitProperty(
    property: VisitPropertySummary,
    criteria?: Partial<PropertyListCriteria>,
) {
    const bhkMatch = property.configLabel.match(/(\d+)\s*BHK/i);
    return matchesPropertyCriteria(
        {
            ...property,
            bhk: bhkMatch ? Number(bhkMatch[1]) : undefined,
            isRent: property.purpose === "rent",
            commissionAmount: property.commissionAmountInr,
            ...property.filterFacts,
        },
        criteria,
    );
}
