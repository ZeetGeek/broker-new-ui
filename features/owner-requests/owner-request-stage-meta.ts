import type { LucideIcon } from "lucide-react";
import { Ban, CircleCheck, CircleX, Hourglass, Undo2 } from "lucide-react";

import type { DealStatusTone } from "@/features/properties/my-requests/deal-card-chrome";
import type { OwnerRepStatus } from "@/features/owner-requests/types";

export type OwnerRequestStageMeta = {
    label: string;
    hint: string;
    icon: LucideIcon;
    tone: DealStatusTone;
};

export const OWNER_REQUEST_STAGE_META: Record<OwnerRepStatus, OwnerRequestStageMeta> = {
    pending: {
        label: "Waiting on you",
        hint: "A broker wants to sell this property. Say yes or no.",
        icon: Hourglass,
        tone: "action",
    },
    accepted: {
        label: "Broker can sell",
        hint: "This broker can show your property to buyers.",
        icon: CircleCheck,
        tone: "success",
    },
    rejected: {
        label: "You said no",
        hint: "You turned this request down.",
        icon: CircleX,
        tone: "danger",
    },
    withdrawn: {
        label: "Withdrawn",
        hint: "This invite or request was pulled back.",
        icon: Undo2,
        tone: "closed",
    },
    revoked: {
        label: "Ended",
        hint: "This representation is no longer active.",
        icon: Ban,
        tone: "closed",
    },
    unknown: {
        label: "Request",
        hint: "Representation status",
        icon: Hourglass,
        tone: "waiting",
    },
};

/** Sent-invite pending copy — owner is waiting on the broker. */
export const OWNER_INVITE_PENDING_META: OwnerRequestStageMeta = {
    label: "Waiting for reply",
    hint: "You invited this broker. They have not replied yet.",
    icon: Hourglass,
    tone: "waiting",
};
