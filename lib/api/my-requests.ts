import {
    filterRequests,
    sortRequests,
    summarizeRequests,
} from "@/features/properties/my-requests/filter-requests";
import {
    MOCK_REQUESTS,
    MOCK_REQUESTS_QUOTA,
} from "@/features/properties/my-requests/mock-requests";
import { reminderState } from "@/features/properties/my-requests/reminder-rules";
import type {
    RequestItem,
    RequestsFilters,
    RequestsResult,
    RequestsSummary,
} from "@/features/properties/my-requests/types";
import { REMINDER_LIMIT } from "@/features/properties/my-requests/types";

/** Mutable in-memory copy so nudge/withdraw survive within a session. */
let requests: RequestItem[] = MOCK_REQUESTS.map((item) => ({ ...item }));

function delay(ms = 240): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const myRequestsApi = {
    async list(filters: RequestsFilters): Promise<RequestsResult> {
        await delay();

        const matched = sortRequests(filterRequests(requests, filters), filters.sort);
        const totalPages = Math.max(1, Math.ceil(matched.length / filters.limit));
        const page = Math.min(Math.max(1, filters.page), totalPages);
        const start = (page - 1) * filters.limit;

        return {
            items: matched.slice(start, start + filters.limit),
            total: matched.length,
            page,
            totalPages,
        };
    },

    /** Summary is over the whole set, not the filtered page. */
    async summary(): Promise<RequestsSummary> {
        await delay(160);
        return summarizeRequests(requests, { ...MOCK_REQUESTS_QUOTA });
    },

    /**
     * Remind an owner who has not answered. The cap and cooldown are enforced
     * here too — the button being hidden is a convenience, not the rule.
     */
    async nudge(requestId: string): Promise<void> {
        await delay(200);

        const target = requests.find((item) => item.id === requestId);
        if (!target || !reminderState(target).canRemind) return;

        const sentAt = new Date().toISOString();
        const nextCount = target.remindersSent + 1;

        requests = requests.map((item) =>
            item.id === requestId
                ? {
                      ...item,
                      remindersSent: nextCount,
                      nudgedAt: sentAt,
                      timeline: [
                          ...item.timeline,
                          {
                              key: "nudged" as const,
                              label: `You sent a reminder (${nextCount} of ${REMINDER_LIMIT})`,
                              at: sentAt,
                          },
                      ],
                  }
                : item,
        );
    },

    /** Pull back a request the broker no longer wants. Frees a quota slot. */
    async withdraw(requestId: string): Promise<void> {
        await delay(200);
        requests = requests.map((item) =>
            item.id === requestId
                ? {
                      ...item,
                      stage: "withdrawn" as const,
                      resolvedAt: new Date().toISOString(),
                      daysToExpiry: null,
                      expiresAt: null,
                      timeline: [
                          ...item.timeline,
                          {
                              key: "withdrawn" as const,
                              label: "You cancelled the request",
                              at: new Date().toISOString(),
                          },
                      ],
                  }
                : item,
        );
    },
};
