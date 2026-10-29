import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsSummary } from "@/features/properties/my-requests/types";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

export function buildMyDealsSummaryLines({
    activeTab,
    sentSummary,
    inviteSummary,
    isLoading = false,
}: {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    isLoading?: boolean;
}): string[] {
    if (isLoading) return ["Loading your deals…"];

    if (activeTab === "sent") {
        if (!sentSummary) return ["Your request count is unavailable right now"];
        const pending = sentSummary.counts.pending;
        if (pending === 0)
            return [
                "No requests waiting for an owner's reply",
                "Find a property in Owner listings and send a request",
            ];
        const lines = [
            `${countLabel(pending, "request is", "requests are")} waiting for the owner's reply`,
        ];
        if (sentSummary.unseenCount > 0)
            lines.push(
                `Owners have not opened ${countLabel(sentSummary.unseenCount, "request", "requests")} yet`,
            );
        lines.push("Once the owner approves, the property appears in Representing");
        lines.push("You can send a reminder if the owner has not replied");
        return lines;
    }

    if (activeTab === "invites") {
        if (!inviteSummary) return ["Your invitation count is unavailable right now"];
        const waiting = inviteSummary.waitingOnYouCount;
        if (waiting === 0)
            return [
                "No owner invitations waiting for your reply",
                "New invitations from owners will appear here",
            ];
        return [
            `${countLabel(waiting, "invitation from an owner needs", "invitations from owners need")} your reply`,
            "Owners are asking you to sell or rent their properties",
            "Accept an invitation to add the property to Representing",
            "Decline if you do not want to work on that property",
        ];
    }

    if (!sentSummary || !inviteSummary) return ["Some deal counts are unavailable right now"];

    if (activeTab === "rejected") {
        const rejected = sentSummary.counts.declined;
        const declined = inviteSummary.counts.declined;
        if (rejected + declined === 0) return ["No rejected requests or declined invitations"];
        const lines: string[] = [];
        if (rejected > 0)
            lines.push(
                `Owners rejected ${countLabel(rejected, "request you sent", "requests you sent")}`,
            );
        if (declined > 0)
            lines.push(
                `You declined ${countLabel(declined, "invitation from an owner", "invitations from owners")}`,
            );
        lines.push("Open a property's timeline to see what happened");
        return lines;
    }

    if (activeTab === "cancelled") {
        const total = sentSummary.counts.ended + inviteSummary.counts.ended;
        if (total === 0) return ["No cancelled representations"];
        return [
            `${countLabel(total, "representation was", "representations were")} cancelled by you or the owner`,
        ];
    }

    const approved = sentSummary.counts.approved;
    const accepted = inviteSummary.counts.accepted;
    const total = approved + accepted;
    if (total === 0)
        return [
            "No approved properties yet",
            "Send a request or accept an owner's invitation to get started",
        ];
    const lines = [
        `${countLabel(total, "property approved", "properties approved")} for you to sell or rent`,
    ];
    if (approved > 0)
        lines.push(
            `Owners approved ${countLabel(approved, "request you sent", "requests you sent")}`,
        );
    if (accepted > 0)
        lines.push(
            `You accepted ${countLabel(accepted, "invitation from an owner", "invitations from owners")}`,
        );
    if (sentSummary.needsFollowUpCount > 0) {
        lines.push(
            `${countLabel(sentSummary.needsFollowUpCount, "property from your requests still needs", "properties from your requests still need")} clients`,
        );
    } else {
        lines.push("Add interested clients to start working on a property");
    }
    if (inviteSummary.waitingOnYouCount > 0)
        lines.push(
            `${countLabel(inviteSummary.waitingOnYouCount, "more invitation needs", "more invitations need")} your reply`,
        );
    return lines;
}
