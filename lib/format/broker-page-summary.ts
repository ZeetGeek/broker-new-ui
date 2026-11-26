import type { MyListingsSummary } from "@/lib/api/my-listings";
import type { UserProfile } from "@/lib/api/profile";
import type { VisitTab } from "@/lib/api/site-visits";
import { formatCommission } from "@/lib/format/commission";
import { formatDateShort, isSameCalendarDay } from "@/lib/format/date";
import { buildMyListingsSummaryLines } from "@/lib/format/my-listings-summary";
import {
    type PageSummaryLine,
    summaryCount as count,
    summaryLine as line,
} from "@/lib/format/page-summary";

import type { ContactsSummary, ContactsTab } from "@/features/contacts/types";
import { type EarningsReport, percentChange } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealItem, type DealsView } from "@/features/pipeline/types";
import type { MyListingsStatusTab } from "@/features/properties/your-listings/types";
import { type Task, taskGroup } from "@/features/tasks/model";

export function dashboardSummary(data: {
    overdue: number | null;
    activeDeals: number | null;
    visitsToday: number | null;
    visitsToUpdate: number | null;
    listings?: MyListingsSummary;
}): PageSummaryLine[] {
    const rows: PageSummaryLine[] = [];
    if (data.overdue != null)
        rows.push(
            data.overdue > 0
                ? line(
                      `${count(data.overdue, "overdue task")} to follow up.`,
                      `${count(data.overdue, "overdue task")}`,
                  )
                : line("No overdue tasks. Your follow-ups are up to date.", "No overdue tasks"),
        );
    if (data.visitsToday != null)
        rows.push(
            line(
                `${count(data.visitsToday, "site visit")} scheduled for today.`,
                `${count(data.visitsToday, "visit")} today`,
            ),
        );
    if (data.activeDeals != null)
        rows.push(
            line(
                `${count(data.activeDeals, "active deal")} in your pipeline.`,
                `${count(data.activeDeals, "active deal")}`,
            ),
        );
    if (data.visitsToUpdate != null && data.visitsToUpdate > 0)
        rows.push(
            line(
                `Record the outcome of ${count(data.visitsToUpdate, "visit")}.`,
                `${count(data.visitsToUpdate, "visit")} to update`,
            ),
        );
    if (data.listings) {
        rows.push(
            line(
                `${count(data.listings.published, "listing")} published in your inventory.`,
                `${count(data.listings.published, "published listing")}`,
            ),
        );
        if (data.listings.draft > 0)
            rows.push(
                line(
                    `${count(data.listings.draft, "property draft")} waiting to publish.`,
                    `${count(data.listings.draft, "draft")} to publish`,
                ),
            );
    }
    return rows.length
        ? rows
        : [line("Your clients, properties and follow-ups in one place.", "Your day at a glance")];
}

export function contactsSummary(
    summary: ContactsSummary | null,
    tab: ContactsTab,
    platformOwners: boolean,
): PageSummaryLine[] {
    if (!summary) return [];
    if (tab === "owners") {
        if (summary.ownerCount === 0)
            return [
                line("Add an owner to link their properties to your work.", "Add your first owner"),
            ];
        const rows = [
            line(
                `${count(summary.ownerCount, "owner")} in your contacts.`,
                `${count(summary.ownerCount, "owner")} saved`,
            ),
        ];
        if (summary.customOwnerCount > 0)
            rows.push(
                line(
                    `${count(summary.customOwnerCount, "owner")} added directly by you.`,
                    `${count(summary.customOwnerCount, "owner")} added by you`,
                ),
            );
        if (platformOwners && summary.platformOwnerCount > 0)
            rows.push(
                line(
                    `${count(summary.platformOwnerCount, "owner")} connected through representation.`,
                    `${count(summary.platformOwnerCount, "platform owner")}`,
                ),
            );
        if (platformOwners && summary.lapsedOwnerCount > 0)
            rows.push(
                line(
                    `${count(summary.lapsedOwnerCount, "owner")} with no active representation.`,
                    `${count(summary.lapsedOwnerCount, "lapsed owner")}`,
                ),
            );
        return rows;
    }
    if (summary.buyerCount === 0)
        return [line("Add your first client and record what they need.", "Add your first client")];
    const unmatched = Math.min(summary.buyerCount, Math.max(0, summary.unmatchedBuyerCount));
    const linked = summary.buyerCount - unmatched;
    return [
        line(
            `${count(summary.buyerCount, "client")} in your CRM.`,
            `${count(summary.buyerCount, "client")} saved`,
        ),
        unmatched > 0
            ? line(
                  `${count(unmatched, "client")} still need${unmatched === 1 ? "s" : ""} a property match.`,
                  `${count(unmatched, "client")} to match`,
              )
            : line(
                  "Every client is linked to at least one property.",
                  "All clients have a property",
              ),
        ...(linked > 0
            ? [
                  line(
                      `${count(linked, "client")} linked to at least one property.`,
                      `${count(linked, "client")} linked to property`,
                  ),
              ]
            : []),
    ];
}

export function listingsSummary(data: {
    summary: MyListingsSummary | null;
    resultTotal: number;
    status: MyListingsStatusTab | "";
    hasActiveFilters: boolean;
}): PageSummaryLine[] {
    const { summary, resultTotal, status, hasActiveFilters } = data;
    const noun =
        status === "draft"
            ? "draft"
            : status === "sold"
              ? "sold property"
              : status === "deleted"
                ? "deleted listing"
                : "listing";
    const compact = hasActiveFilters
        ? resultTotal
            ? `${count(resultTotal, "match", "matches")} found`
            : "No matching listings"
        : status === "draft"
          ? `${count(resultTotal, "draft")} to publish`
          : status === "deleted"
            ? `${count(resultTotal, "deleted listing")}`
            : status === "sold"
              ? `${count(resultTotal, "sold property", "sold properties")}`
              : `${count(resultTotal, noun)}${status ? ` ${status}` : " in inventory"}`;
    const texts = buildMyListingsSummaryLines(data);
    const rows = [line(texts[0], compact)];
    if (
        hasActiveFilters ||
        status === "draft" ||
        status === "deleted" ||
        status === "sold" ||
        !summary
    ) {
        if (texts[1])
            rows.push(
                line(
                    texts[1],
                    hasActiveFilters
                        ? "Clear or change your filters"
                        : status === "deleted"
                          ? "Deleted listings stay here"
                          : resultTotal === 0
                            ? "Add a property to start"
                            : "Finish details to publish",
                ),
            );
        return rows;
    }
    if (summary.total === 0) return [line(texts[0], "Add your first property")];
    // These counts cover the whole inventory, not just the selected status.
    if (summary.draft > 0)
        rows.push(
            line(
                `${count(summary.draft, "draft")} waiting to publish across your inventory.`,
                `${count(summary.draft, "draft")} to publish`,
            ),
        );
    if (summary.unpublished > 0)
        rows.push(
            line(
                `${count(summary.unpublished, "listing")} unpublished across your inventory.`,
                `${count(summary.unpublished, "unpublished listing")}`,
            ),
        );
    if (summary.sale > 0)
        rows.push(
            line(
                `${count(summary.sale, "property", "properties")} listed for sale across your inventory.`,
                `${count(summary.sale, "property", "properties")} for sale`,
            ),
        );
    if (summary.rent > 0)
        rows.push(
            line(
                `${count(summary.rent, "property", "properties")} listed for rent across your inventory.`,
                `${count(summary.rent, "property", "properties")} for rent`,
            ),
        );
    return rows;
}

export function pipelineSummary(
    deals: DealItem[],
    view: DealsView,
    filtered: boolean,
): PageSummaryLine[] {
    if (!deals.length)
        return [
            line(
                filtered
                    ? "No deals match your current filters."
                    : view === "board"
                      ? "Link a client to a property to start your first deal."
                      : view === "sold"
                        ? "No completed deals in this view yet."
                        : "No lost deals in this view.",
                filtered
                    ? "No matching deals"
                    : view === "board"
                      ? "Add your first deal"
                      : view === "sold"
                        ? "No completed deals yet"
                        : "No lost deals",
            ),
        ];
    const state =
        view === "board" ? "in progress" : view === "sold" ? "completed" : "marked as lost";
    const rows = [
        line(
            `${count(deals.length, "deal")} ${filtered ? `${deals.length === 1 ? "matches" : "match"} your filters` : state}.`,
            `${count(deals.length, "deal")} ${filtered ? `${deals.length === 1 ? "matches" : "match"} filters` : state}`,
        ),
    ];
    const clients = new Set(deals.map((deal) => deal.buyer.id)).size;
    rows.push(
        line(
            `${count(clients, "client")} across the deals in this view.`,
            `${count(clients, "client")} in this view`,
        ),
    );
    if (view === "board") {
        for (const stage of DEAL_STAGE_ORDER) {
            const n = deals.filter((deal) => deal.status === stage).length;
            if (n)
                rows.push(
                    line(
                        `${count(n, "deal")} in the ${DEAL_STAGE_META[stage].label} stage.`,
                        `${DEAL_STAGE_META[stage].label}: ${count(n, "deal")}`,
                    ),
                );
        }
    } else {
        const dates = deals
            .map((deal) => Date.parse(deal.resolvedAt ?? ""))
            .filter(Number.isFinite);
        if (dates.length) {
            const date = formatDateShort(new Date(Math.max(...dates)));
            rows.push(
                line(
                    `${view === "sold" ? "Latest completion" : "Latest loss"} recorded on ${date}.`,
                    `${view === "sold" ? "Last completed" : "Last lost"}: ${date}`,
                ),
            );
        }
        const recorded = deals.filter((deal) =>
            view === "sold"
                ? deal.closedAmountInr != null && deal.closedAmountInr > 0
                : Boolean(deal.lostReason),
        ).length;
        if (recorded)
            rows.push(
                line(
                    `${count(recorded, "deal")} with ${view === "sold" ? "a closing amount" : "a reason for the loss"} recorded.`,
                    `${count(recorded, "deal")} with ${view === "sold" ? "amounts" : "reasons"}`,
                ),
            );
    }
    return rows;
}

export function visitsSummary(
    counts: Record<VisitTab, number>,
    tab: VisitTab,
    filtered: boolean,
): PageSummaryLine[] {
    const labels: Record<VisitTab, string> = {
        upcoming: "upcoming",
        running: "happening now",
        needs_update: "to update",
        completed: "completed",
        not_attended: "not attended",
        cancelled: "cancelled",
    };
    const order = [tab, ...(Object.keys(labels).filter((key) => key !== tab) as VisitTab[])];
    const rows = order
        .filter((key) => counts[key] > 0)
        .map((key) =>
            line(
                `${count(counts[key], "visit")} ${labels[key]} within the selected dates${filtered ? " and filters" : ""}.`,
                `${count(counts[key], "visit")} ${labels[key]}`,
            ),
        );
    if (counts[tab] === 0)
        rows.unshift(
            line(
                tab === "needs_update"
                    ? "No visits need an outcome update in this view."
                    : tab === "running"
                      ? "No visits are happening now in this view."
                      : `No ${labels[tab]} visits in the current view.`,
                "No visits in this view",
            ),
        );
    return rows;
}

export function tasksSummary(
    tasks: Task[],
    tab: string,
    now: number,
    filtered: boolean,
    visibleCount: number,
): PageSummaryLine[] {
    const scoped = tasks.filter((task) =>
        tab === "deleted"
            ? Boolean(task.deletedAt)
            : !task.deletedAt &&
              (tab === "completed"
                  ? Boolean(task.completedAt)
                  : !task.completedAt && (tab !== "overdue" || taskGroup(task, now) === "overdue")),
    );
    if (filtered)
        return [
            line(
                `${count(visibleCount, "task")} ${visibleCount === 1 ? "matches" : "match"} your filters.`,
                visibleCount ? `${count(visibleCount, "matching task")}` : "No matching tasks",
            ),
        ];
    const state =
        tab === "completed"
            ? "completed"
            : tab === "deleted"
              ? "in Deleted"
              : tab === "overdue"
                ? "overdue"
                : "to do";
    const rows = [
        line(
            `${count(scoped.length, "task")} ${state}.`,
            `${count(scoped.length, "task")} ${state}`,
        ),
    ];
    if (!scoped.length)
        return [
            line(
                tab === "completed"
                    ? "Tasks you finish will appear here."
                    : tab === "deleted"
                      ? "No tasks in Deleted."
                      : tab === "overdue"
                        ? "Your follow-ups are up to date."
                        : "Add a call, reminder or your next follow-up.",
                tab === "completed"
                    ? "No completed tasks yet"
                    : tab === "deleted"
                      ? "No deleted tasks"
                      : tab === "overdue"
                        ? "No overdue tasks"
                        : "Add your next follow-up",
            ),
        ];
    if (tab === "all") {
        const overdue = scoped.filter((task) => taskGroup(task, now) === "overdue").length;
        const today = scoped.filter((task) => taskGroup(task, now) === "today").length;
        if (overdue)
            rows.unshift(
                line(
                    `${count(overdue, "overdue task")} need${overdue === 1 ? "s" : ""} attention.`,
                    `${count(overdue, "overdue task")}`,
                ),
            );
        if (today)
            rows.push(
                line(`${count(today, "task")} due today.`, `${count(today, "task")} due today`),
            );
    }
    if (tab === "all" || tab === "overdue") {
        const priority = scoped.filter(
            (task) => task.priority === "urgent" || task.priority === "high",
        ).length;
        if (priority)
            rows.push(
                line(
                    `${count(priority, "task")} marked Priority 1 or 2.`,
                    `${count(priority, "priority task")}`,
                ),
            );
        const reminders = scoped.filter((task) => task.reminders.length > 0).length;
        if (reminders)
            rows.push(
                line(
                    `${count(reminders, "task")} with reminders set.`,
                    `${count(reminders, "task")} with reminders`,
                ),
            );
    }
    const clients = scoped.filter((task) => task.clientId).length;
    if (clients)
        rows.push(
            line(
                `${count(clients, "task")} linked to clients.`,
                `${count(clients, "client-linked task")}`,
            ),
        );
    return rows;
}

export function earningsSummary(report: EarningsReport): PageSummaryLine[] {
    const rows = [
        line(
            `${count(report.closedCount, "deal")} completed in the selected period.`,
            `${count(report.closedCount, "completed deal")}`,
        ),
        line(
            `${formatCommission(report.earnedInr)} estimated commission in this period.`,
            `${formatCommission(report.earnedInr, true)} est. commission`,
        ),
    ];
    if (report.lostCount)
        rows.push(
            line(
                `${count(report.lostCount, "deal")} marked as lost in this period.`,
                `${count(report.lostCount, "lost deal")}`,
            ),
        );
    const change = percentChange(report.earnedInr, report.previousEarnedInr);
    if (report.comparison && change != null)
        rows.push(
            line(
                `${change === 0 ? "Unchanged" : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}%`} compared with ${report.comparison.phrase}.`,
                change === 0
                    ? "Same as previous period"
                    : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on last period`,
            ),
        );
    if (report.winRate != null)
        rows.push(
            line(
                `${report.winRate}% win rate across completed and lost deals in this period.`,
                `${report.winRate}% win rate this period`,
            ),
        );
    if (report.live.potentialInr > 0)
        rows.push(
            line(
                `${formatCommission(report.live.potentialInr)} potential commission across open deals.`,
                `${formatCommission(report.live.potentialInr, true)} potential commission`,
            ),
        );
    if (report.live.count > 0)
        rows.push(
            line(
                `${count(report.live.count, "open deal")} in your current pipeline.`,
                `${count(report.live.count, "open deal")}`,
            ),
        );
    if (report.avgDaysToClose != null && report.closedCount > 0)
        rows.push(
            line(
                `${count(report.avgDaysToClose, "day")} on average from new client to close.`,
                `${count(report.avgDaysToClose, "day")} to close on average`,
            ),
        );
    if (report.unvaluedClosedCount > 0)
        rows.push(
            line(
                `${count(report.unvaluedClosedCount, "completed deal")} with no commission set.`,
                `${count(report.unvaluedClosedCount, "deal")} lack commission`,
            ),
        );
    return rows;
}

export function profileSummary(
    profile: UserProfile | null,
    dirty: boolean,
    saving: boolean,
): PageSummaryLine[] {
    if (saving) return [line("Saving your latest profile changes.", "Saving your changes…")];
    if (!profile) return [];
    const rows = [
        dirty
            ? line("You have profile changes waiting to be saved.", "You have unsaved changes")
            : line(
                  "Your saved contact details and work preferences.",
                  "Your saved profile details",
              ),
    ];
    if (typeof profile.isEmailVerified === "boolean")
        rows.push(
            profile.isEmailVerified
                ? line("Your email address is confirmed.", "Email address confirmed")
                : line(
                      "Confirm your email address to finish account setup.",
                      "Email needs confirmation",
                  ),
        );
    if (profile.broker?.serviceAreas) {
        const n = new Set(profile.broker.serviceAreas.map((area) => area.trim()).filter(Boolean))
            .size;
        rows.push(
            n
                ? line(
                      `${count(n, "service area")} saved on your profile.`,
                      `${count(n, "service area")} saved`,
                  )
                : line("Add the areas where you work to your profile.", "Add your service areas"),
        );
    }
    if (profile.broker?.specializations) {
        const n = new Set(profile.broker.specializations.map((item) => item.trim()).filter(Boolean))
            .size;
        if (n)
            rows.push(
                line(
                    `${count(n, "property specialization")} on your profile.`,
                    `${count(n, "specialization")} saved`,
                ),
            );
    }
    const years = profile.broker?.experienceYears ?? profile.experienceYears;
    if (years != null && Number.isFinite(years) && years >= 0)
        rows.push(
            line(
                `${count(years, "year")} of experience on your profile.`,
                `${count(years, "year")} of experience`,
            ),
        );
    return rows;
}

export function historySummary(data: {
    entries: { category: string; createdAt: string | null }[];
    notifications: boolean;
    total?: number;
    unreadCount?: number;
    filtered: boolean;
    now: Date;
}): PageSummaryLine[] {
    const { entries, notifications, total, unreadCount, filtered, now } = data;
    const noun = notifications ? "notification" : "update";
    const rows: PageSummaryLine[] = [];
    if (filtered)
        rows.push(
            line(
                `${count(entries.length, `loaded ${noun}`)} ${entries.length === 1 ? "matches" : "match"} your filters.`,
                `${count(entries.length, "loaded match", "loaded matches")}`,
            ),
        );
    else {
        if (notifications && unreadCount != null)
            rows.push(
                unreadCount
                    ? line(
                          `${count(unreadCount, "unread notification")} to review.`,
                          `${count(unreadCount, "unread notification")}`,
                      )
                    : line("All your notifications are marked as read.", "You're up to date"),
            );
        if (total != null)
            rows.push(
                line(`${count(total, noun)} in your history.`, `${count(total, noun)} in total`),
            );
        else
            rows.push(
                line(
                    `${count(entries.length, `recent ${noun}`)} available to review.`,
                    `${count(entries.length, `recent ${noun}`)}`,
                ),
            );
    }
    const today = entries.filter(
        (entry) =>
            entry.createdAt &&
            Number.isFinite(Date.parse(entry.createdAt)) &&
            isSameCalendarDay(new Date(entry.createdAt), now),
    ).length;
    if (today)
        rows.push(
            line(
                `${count(today, `loaded ${noun}`)} from today.`,
                `${count(today, noun)} loaded from today`,
            ),
        );
    const categories = new Map<string, number>();
    for (const entry of entries)
        categories.set(entry.category, (categories.get(entry.category) ?? 0) + 1);
    for (const [category, n] of [...categories].sort((a, b) => b[1] - a[1]).slice(0, 3))
        rows.push(
            line(
                `${count(n, `loaded ${noun}`)} in ${category.toLowerCase()}.`,
                `${category}: ${count(n, "loaded item")}`,
            ),
        );
    return rows;
}
