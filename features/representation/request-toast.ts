import { ApiError } from "@/lib/api/client";
import { brokerYourListingsHref } from "@/lib/routes/broker";

import toast from "@/components/shared/app-toast";

export function showDuplicateRequestToast() {
    return toast.message("duplicate", {
        action: {
            label: "View request",
            onClick: () => window.location.assign(brokerYourListingsHref("requests")),
        },
    });
}

/** This conflict mapping applies only to sending a representation request. */
export function showRepresentationRequestError(error: unknown) {
    if (error instanceof ApiError && error.status === 409) return showDuplicateRequestToast();
    return toast.error(error instanceof Error ? error.message : "Could not send request");
}
