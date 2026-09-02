import { apiFetch } from "@/lib/api/client";

export type RepresentationRespondStatus = "accepted" | "rejected";

export type RepresentationRespondBody = {
    status: RepresentationRespondStatus;
    message?: string;
};

export const representativeApi = {
    requestRepresentation(propertyId: string, message?: string) {
        return apiFetch<{ id: string }>("/representative/broker/request", {
            method: "POST",
            body: JSON.stringify({ propertyId, ...(message ? { message } : {}) }),
        });
    },

    ownerRespond(representationId: string, body: RepresentationRespondBody) {
        return apiFetch(`/representative/${representationId}/owner/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    brokerRespond(representationId: string, body: RepresentationRespondBody) {
        return apiFetch(`/representative/${representationId}/broker/respond`, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },
};
