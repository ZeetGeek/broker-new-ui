import { attemptActions } from "@/features/properties/my-requests/attempt-rules";
import {
    filterRequests,
    sortRequests,
    summarizeRequests,
} from "@/features/properties/my-requests/filter-requests";
import {
    MOCK_REQUESTS,
    MOCK_REQUESTS_QUOTA,
} from "@/features/properties/my-requests/mock-requests";
import type {
    RequestItem,
    RequestsFilters,
    RequestsResult,
    RequestsSummary,
} from "@/features/properties/my-requests/types";
import { ATTEMPT_LIMIT } from "@/features/properties/my-requests/types";

/** Mutable in-memory copy so attempt changes survive within a session. */
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
     * Send this attempt's one reminder. Enforced here too — the button being
     * disabled is a convenience, not the rule.
     */
    async nudge(requestId: string): Promise<void> {
        await delay(200);

        const target = requests.find((item) => item.id === requestId);
        if (!target || !attemptActions(target).canRemind) return;

        const sentAt = new Date().toISOString();

        requests = requests.map((item) =>
            item.id === requestId
                ? {
                      ...item,
                      reminderUsed: true,
                      nudgedAt: sentAt,
                      timeline: [
                          ...item.timeline,
                          {
                              key: "nudged" as const,
                              label: "You sent a reminder",
                              at: sentAt,
                          },
                      ],
                  }
                : item,
        );
    },

    /**
     * Close the current attempt. When it was the broker's last one the
     * property locks instead, and they may not approach that owner again.
     */
    async withdraw(requestId: string): Promise<void> {
        await delay(200);

        const target = requests.find((item) => item.id === requestId);
        if (!target || !attemptActions(target).canCancel) return;

        const at = new Date().toISOString();
        const isLastAttempt = target.attemptNumber >= ATTEMPT_LIMIT;

        requests = requests.map((item) =>
            item.id === requestId
                ? {
                      ...item,
                      stage: isLastAttempt ? ("locked" as const) : ("cancelled" as const),
                      resolvedAt: at,
                      timeline: [
                          ...item.timeline,
                          isLastAttempt
                              ? {
                                    key: "locked" as const,
                                    label: "No attempts left — owner never replied",
                                    at,
                                }
                              : {
                                    key: "cancelled" as const,
                                    label: `You cancelled attempt ${item.attemptNumber}`,
                                    at,
                                },
                      ],
                  }
                : item,
        );
    },

    /**
     * Open the next attempt on a property whose last attempt ended — either
     * the broker cancelled it or the owner rejected it.
     */
    async retry(requestId: string): Promise<void> {
        await delay(200);

        const target = requests.find((item) => item.id === requestId);
        if (!target || !attemptActions(target).canRetry) return;

        const at = new Date().toISOString();
        const nextAttempt = target.attemptNumber + 1;

        requests = requests.map((item) =>
            item.id === requestId
                ? {
                      ...item,
                      stage: "pending" as const,
                      attemptNumber: nextAttempt,
                      reminderUsed: false,
                      nudgedAt: null,
                      ownerSeen: false,
                      requestedAt: at,
                      resolvedAt: null,
                      daysWaiting: 0,
                      // The previous attempt's rejection reason must not
                      // follow the new request into a fresh attempt.
                      declineReason: undefined,
                      timeline: [
                          ...item.timeline,
                          {
                              key: "sent" as const,
                              label: `You sent the request (${nextAttempt} of ${ATTEMPT_LIMIT})`,
                              at,
                          },
                      ],
                  }
                : item,
        );
    },
};
