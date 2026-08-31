import { apiFetch } from "@/lib/api/client";

export const representativeApi = {
    requestRepresentation(propertyId: string, message?: string) {
        return apiFetch<{ id: string }>("/representative/broker/request", {
            method: "POST",
            body: JSON.stringify({ propertyId, ...(message ? { message } : {}) }),
        });
    },
};
