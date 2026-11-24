import { cn } from "@/lib/utils";

import { CalendarCheck, ChevronRight, Clock, Users } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";

import styles from "./broker-property-analytics.module.css";

/** Static examples of the broker's own work, scoped to the attention-card preview. */
const SAMPLE_ITEMS = [
    {
        title: "Share the floor plan with Karan Joshi",
        detail: "Karan Joshi · Overdue since yesterday, 5:30 PM",
        source: "task",
        urgent: true,
    },
    {
        title: "Record the visit outcome",
        detail: "Priya Mehta · Yesterday, 11:00 AM · Outcome not recorded",
        source: "visit",
        urgent: true,
    },
    {
        title: "Call Vivek Nair about his requirements",
        detail: "Vivek Nair · Overdue since yesterday, 4:00 PM",
        source: "task",
        urgent: true,
    },
    {
        title: "Record the visit outcome",
        detail: "Neha Desai · Yesterday, 4:30 PM · Outcome not recorded",
        source: "visit",
        urgent: true,
    },
    {
        title: "Confirm the meeting point for today's visit",
        detail: "Harsh Patel · Today, 12:00 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Send the property details to Ankit Shah",
        detail: "Ankit Shah · Today, 12:30 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Prepare the documents for a second visit",
        detail: "Meera Bhatt · Today, 2:00 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Discuss the next step after the visit",
        detail: "Rohan Joshi · Today, 3:00 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Update the client's property shortlist",
        detail: "Kavya Iyer · Today, 4:00 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Check whether the client wants another visit",
        detail: "Aditi Kulkarni · Today, 5:00 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Follow up with Amit Trivedi",
        detail: "Amit Trivedi · No contact logged for 15 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Sneha Kapoor",
        detail: "Sneha Kapoor · No contact logged for 14 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Arjun Rao",
        detail: "Arjun Rao · No contact logged for 12 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Nisha Reddy",
        detail: "Nisha Reddy · No contact logged for 10 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Sanjay Gupta",
        detail: "Sanjay Gupta · No contact logged for 8 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Dev Patel",
        detail: "Dev Patel · No contact logged for 7 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Record feedback from the second visit",
        detail: "Riya Sethi · Yesterday, 3:00 PM · Outcome not recorded",
        source: "visit",
        urgent: true,
    },
    {
        title: "Update the client's budget after the call",
        detail: "Manish Bansal · Today, 10:00 AM",
        source: "task",
        urgent: false,
    },
    {
        title: "Discuss the client's revised offer",
        detail: "Deepa Shah · Today, 11:30 AM",
        source: "task",
        urgent: false,
    },
    {
        title: "Share directions before tomorrow's visit",
        detail: "Nikhil Deshmukh · Today, 2:30 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Confirm the client's document checklist",
        detail: "Gaurav Sinha · Today, 3:30 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Record the client's next available visit time",
        detail: "Simran Kaur · Today, 4:30 PM",
        source: "task",
        urgent: false,
    },
    {
        title: "Follow up with Swati Iyer",
        detail: "Swati Iyer · No contact logged for 9 days",
        source: "deal",
        urgent: false,
    },
    {
        title: "Follow up with Tejas Shah",
        detail: "Tejas Shah · No contact logged for 8 days",
        source: "deal",
        urgent: false,
    },
] as const;

export function BrokerAttentionPreview() {
    return (
        <AnalyticsCard
            title="Needs your attention"
            titleId="broker-attention-heading"
            description="Sample broker tasks, visit outcomes and client follow-ups."
            action={<span className={styles.count}>{SAMPLE_ITEMS.length} items</span>}
            className={cn(styles.section, styles.attention, styles.liveAttention)}
        >
            <div
                role="region"
                aria-label="Sample broker items needing your attention"
                tabIndex={0}
                className={styles.attentionViewport}
            >
                <ul className={styles.attentionList}>
                    {SAMPLE_ITEMS.map((item) => {
                        const Icon =
                            item.source === "visit"
                                ? CalendarCheck
                                : item.source === "deal"
                                  ? Users
                                  : Clock;
                        return (
                            <li key={`${item.title}:${item.detail}`}>
                                <div className={styles.attentionRow}>
                                    <span
                                        className={cn(
                                            styles.taskIcon,
                                            item.urgent && styles.taskUrgent,
                                        )}
                                    >
                                        <Icon size={18} aria-hidden />
                                    </span>
                                    <div className={styles.taskCopy}>
                                        <span className={styles.attentionTitle}>{item.title}</span>
                                        <p>{item.detail}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                        title="Sample item"
                                        aria-label={`Sample item: ${item.title}`}
                                    >
                                        {item.source === "task"
                                            ? "Open task"
                                            : item.source === "visit"
                                              ? "Open visit"
                                              : "Open deal"}
                                        <ChevronRight aria-hidden />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </AnalyticsCard>
    );
}
