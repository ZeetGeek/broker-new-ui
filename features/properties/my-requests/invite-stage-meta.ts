import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleX, Clock, Hourglass } from "lucide-react";

import type { InviteStage } from "@/features/properties/my-requests/invite-types";

export type InviteStageMeta = {
    label: string;
    hint: string;
    icon: LucideIcon;
    badgeVariant: "brand" | "urgent" | "danger" | "neutral" | "outline";
};

export const INVITE_STAGE_META: Record<InviteStage, InviteStageMeta> = {
    pending: {
        label: "Waiting for you",
        hint: "An owner asked you to sell this property. Say yes or no.",
        icon: Hourglass,
        badgeVariant: "urgent",
    },
    accepted: {
        label: "You can sell this",
        hint: "You accepted this invite. You can now show the property to buyers.",
        icon: CircleCheck,
        badgeVariant: "brand",
    },
    declined: {
        label: "You said no",
        hint: "You turned this invite down. The owner may ask another broker.",
        icon: CircleX,
        badgeVariant: "neutral",
    },
    expired: {
        label: "Invite closed",
        hint: "You did not answer in time, so the owner's invite closed.",
        icon: Clock,
        badgeVariant: "outline",
    },
};

export const INVITE_STAGE_ORDER: InviteStage[] = ["pending", "accepted", "declined", "expired"];
