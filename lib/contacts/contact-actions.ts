import type { NewBuyerInput } from "@/lib/api/clients";
import { contactsApi } from "@/lib/api/contacts";

import {
    type BuyerContactForm,
    emptyOwnerForm,
    type OwnerContactForm,
} from "@/features/contacts/contact-form-model";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

/** Shared by the Contacts page and the sidebar opened over other pages. */
export async function updateBuyerContact(
    buyer: BuyerRow,
    patch: Partial<BuyerContactForm>,
): Promise<BuyerRow> {
    const notes = patch.notes ?? buyer.notes ?? null;
    const input: NewBuyerInput = {
        name: buyer.name,
        phoneDigits: buyer.phoneDigits,
        email: buyer.email,
        lookingFor: buyer.lookingFor,
        propertyKind: buyer.propertyKind,
        preferredLocalities: buyer.preferredLocalities,
        country: buyer.country,
        state: buyer.state,
        city: buyer.city,
        budgetMinInr: buyer.budgetMinInr,
        budgetMaxInr: buyer.budgetMaxInr,
        rentBudgetMinInr: buyer.rentBudgetMinInr ?? null,
        rentBudgetMaxInr: buyer.rentBudgetMaxInr ?? null,
        bhk: buyer.bhk,
        source: buyer.source ?? "walk_in",
        notes,
    };
    await contactsApi.saveBuyer(input, buyer.id);
    return {
        ...buyer,
        notes,
        lastContactedAt: patch.lastSpokeAt || buyer.lastContactedAt,
        details: buyer.details ? { ...buyer.details, ...patch } : buyer.details,
    };
}

export function updateOwnerContact(
    owner: OwnerRow,
    patch: Partial<OwnerContactForm>,
): Promise<OwnerRow> {
    return contactsApi.saveOwner(
        {
            ...emptyOwnerForm(),
            name: owner.name,
            phone: owner.phoneDigits ?? "",
            status: owner.status ?? "active",
            lastSpokeAt: owner.lastSpokeAt?.slice(0, 10) ?? "",
            tags: owner.tags ?? [],
            notes: owner.notes ?? "",
            ...owner.details,
            ...patch,
        },
        owner.id,
        owner.origin,
    );
}
