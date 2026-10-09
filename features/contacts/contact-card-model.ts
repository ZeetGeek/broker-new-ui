import { formatIndianPrice } from "@/lib/format/price";

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
    budgetLabel: string;
    localities: string[];
    /** Card-only: area(s), else city — not country/state. */
    importantLocation: string;
    priority: "hot" | "warm" | "cold";
    nextFollowUpAt: string | null;
    properties: ContactPropertyCardItem[];
};

export type OwnerContactCardModel = {
    ownerTypeLabel: string;
    /** Card-only: area, else city — not country/state. */
    importantLocation: string;
    localities: string[];
    city: string;
    askingPrice: string;
    propertyType: string;
    nextFollowUpAt: string | null;
    properties: ContactPropertyCardItem[];
};

function buyerBudgetLabel(buyer: BuyerRow): string {
    if (buyer.budgetMaxInr == null && buyer.budgetMinInr == null) return "Budget not set";
    const value = buyer.budgetMaxInr ?? buyer.budgetMinInr ?? 0;
    const amount = formatIndianPrice(value, buyer.lookingFor);
    return buyer.budgetMaxInr != null ? `Up to ${amount}` : `From ${amount}`;
}

export function toBuyerContactCardModel(buyer: BuyerRow): BuyerContactCardModel {
    const details = buyer.details;
    const localities = details?.localities.length ? details.localities : buyer.preferredLocalities;
    const areas = localities.slice(0, 2).join(", ");
    return {
        budgetLabel: buyerBudgetLabel(buyer),
        localities,
        importantLocation: areas || buyer.city?.trim() || "",
        priority: details?.priority ?? "warm",
        nextFollowUpAt: details?.nextFollowUpAt || null,
        properties: buyer.attachedProperties.map((property) => {
            const lead = buyer.leads.find((item) => item.propertyId === property.id);
            return {
                id: property.id,
                leadId: property.leadId || lead?.leadId || "",
                title: property.title,
                locality: property.locality || lead?.city || buyer.city || "Surat",
                priceLabel:
                    property.priceLabel ||
                    (lead?.listPriceInr
                        ? formatIndianPrice(lead.listPriceInr, lead.isRent ? "rent" : "buy")
                        : "Price on request"),
                coverUrl: property.coverUrl,
                propertyType: property.propertyType || "Property",
            };
        }),
    };
}

function titleForOwnerProperty(owner: OwnerRow, index: number): string {
    return owner.propertyTitles[index] || owner.linkedListingTitle || "Property";
}

function ownerTypeLabel(value: string | null | undefined): string {
    if (!value) return "";
    if (value === "individual") return "Individual";
    if (value === "builder") return "Builder";
    if (value === "company") return "Company";
    return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    const city = details?.city?.trim() || "";
    const locality =
        details?.locality?.trim() ||
        owner.localities.find((item) => item && item !== "—" && item !== city) ||
        "";
    const localities = owner.localities.filter((item) => item && item !== "—");
    const properties = owner.properties?.length
        ? owner.properties.map((property) => ({
              id: property.id,
              leadId: "",
              title: property.title,
              locality: property.locality || locality || city || "Surat",
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
                  locality: owner.localities[index] || locality || city || "Surat",
                  priceLabel: askingPrice,
                  propertyType: owner.propertyType || details?.propertyType || "Property",
              }),
          );

    return {
        ownerTypeLabel: ownerTypeLabel(details?.ownerType),
        importantLocation: locality || city,
        localities,
        city,
        askingPrice,
        propertyType:
            owner.propertyType ||
            details?.propertyType ||
            owner.properties?.[0]?.propertyType ||
            "Property",
        nextFollowUpAt: details?.nextFollowUpAt || null,
        properties,
    };
}
