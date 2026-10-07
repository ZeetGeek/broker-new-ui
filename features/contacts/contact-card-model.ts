import { formatIndianPrice } from "@/lib/format/price";

import { PROPERTY_KIND_OPTIONS } from "@/features/contacts/buyer-options";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

export type ContactPropertyCardItem = {
    id: string;
    /** Lead id for detach — empty when the row is not a live attachment. */
    leadId: string;
    title: string;
    locality: string;
    priceLabel: string;
    coverUrl?: string;
    propertyType: string;
};

export type BuyerContactCardModel = {
    propertyTypes: string[];
    configurations: string[];
    budgetLabel: string;
    localities: string[];
    priority: "hot" | "warm" | "cold";
    nextFollowUpAt: string | null;
    properties: ContactPropertyCardItem[];
};

export type OwnerContactCardModel = {
    intent: string;
    propertyType: string;
    configuration: string;
    askingPrice: string;
    localities: string[];
    status: string;
    nextFollowUpAt: string | null;
    properties: ContactPropertyCardItem[];
};

function buyerBudgetLabel(buyer: BuyerRow): string {
    if (buyer.budgetMaxInr == null && buyer.budgetMinInr == null) return "Budget not set";
    const value = buyer.budgetMaxInr ?? buyer.budgetMinInr ?? 0;
    const amount = formatIndianPrice(value, buyer.lookingFor);
    return buyer.budgetMaxInr != null ? `Up to ${amount}` : `From ${amount}`;
}

function buyerKindLabel(buyer: BuyerRow): string {
    if (buyer.propertyKind === "any") return "Any property";
    return (
        PROPERTY_KIND_OPTIONS.find((option) => option.value === buyer.propertyKind)?.label ??
        buyer.propertyKind
    );
}

export function toBuyerContactCardModel(buyer: BuyerRow): BuyerContactCardModel {
    const details = buyer.details;
    return {
        propertyTypes: details?.propertyTypes.length
            ? details.propertyTypes
            : [buyerKindLabel(buyer)],
        configurations: details?.configurations.length
            ? details.configurations
            : buyer.bhk
              ? [`${buyer.bhk} BHK`]
              : [],
        budgetLabel: buyerBudgetLabel(buyer),
        localities: details?.localities.length ? details.localities : buyer.preferredLocalities,
        priority: details?.priority ?? "warm",
        nextFollowUpAt: details?.nextFollowUpAt || null,
        properties: buyer.attachedProperties.map((property) => {
            const lead = buyer.leads.find((item) => item.propertyId === property.id);
            return {
                id: property.id,
                leadId: property.leadId || lead?.leadId || "",
                title: property.title,
                locality: property.locality || lead?.city || "Surat",
                priceLabel:
                    property.priceLabel ||
                    (lead?.listPriceInr
                        ? formatIndianPrice(lead.listPriceInr, lead.isRent ? "rent" : "buy")
                        : "Price on request"),
                coverUrl: property.coverUrl,
                propertyType:
                    property.propertyType || details?.propertyTypes[0] || buyerKindLabel(buyer),
            };
        }),
    };
}

function titleForOwnerProperty(owner: OwnerRow, index: number): string {
    return owner.propertyTitles[index] || owner.linkedListingTitle || "Property";
}

export function toOwnerContactCardModel(owner: OwnerRow): OwnerContactCardModel {
    const details = owner.details;
    const askingPrice =
        owner.totalValueInr > 0
            ? formatIndianPrice(
                  owner.totalValueInr,
                  owner.propertyIntent ?? (owner.isAllRent ? "rent" : "sell"),
              )
            : "Price on request";
    const properties = owner.properties?.length
        ? owner.properties.map((property) => ({
              id: property.id,
              leadId: "",
              title: property.title,
              locality: property.locality || owner.localities[0] || "Surat",
              priceLabel: property.priceLabel || askingPrice,
              coverUrl: property.coverUrl,
              propertyType: property.propertyType || owner.propertyType || "Property",
          }))
        : Array.from({ length: Math.max(owner.propertyCount, owner.propertyTitles.length) }).map(
              (_, index) => ({
                  id:
                      index === 0 && owner.linkedListingId
                          ? owner.linkedListingId
                          : `${owner.id}_${index}`,
                  leadId: "",
                  title: titleForOwnerProperty(owner, index),
                  locality: owner.localities[index] || owner.localities[0] || "Surat",
                  priceLabel: askingPrice,
                  propertyType: owner.propertyType || details?.propertyType || "Property",
              }),
          );

    return {
        intent: owner.propertyIntent || details?.intent || (owner.isAllRent ? "rent" : "sell"),
        propertyType:
            owner.propertyType ||
            details?.propertyType ||
            owner.properties?.[0]?.propertyType ||
            "Property",
        configuration:
            owner.configuration ||
            details?.configuration ||
            owner.properties?.[0]?.configuration ||
            "",
        askingPrice,
        localities: owner.localities.filter((locality) => locality && locality !== "—"),
        status: owner.status || details?.status || "active",
        nextFollowUpAt: details?.nextFollowUpAt || null,
        properties,
    };
}
