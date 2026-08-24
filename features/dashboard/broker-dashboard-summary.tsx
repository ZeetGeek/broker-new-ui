import { CalendarClock, Inbox, Users } from "lucide-react";

type SummaryStat = {
    icon: typeof Inbox;
    label: string;
    value: string;
    detail: string;
    accent?: "urgent";
};

const STATS: SummaryStat[] = [
    {
        icon: Inbox,
        label: "Requests sent",
        value: "12",
        detail: "3 waiting on the owner",
    },
    {
        icon: CalendarClock,
        label: "Site visits today",
        value: "2",
        detail: "Next at 9:30 AM · Vesu",
        accent: "urgent",
    },
];

function StatCard({ icon: Icon, label, value, detail, accent }: SummaryStat) {
    return (
        <div className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="eyebrow">{label}</span>
                <Icon
                    aria-hidden="true"
                    className={accent === "urgent" ? "text-urgent block-4 inline-4" : "text-ink-subtle block-4 inline-4"}
                />
            </div>
            <p className="tabular h2 text-ink">{value}</p>
            <p className={accent === "urgent" ? "body-sm text-urgent" : "body-sm text-ink-muted"}>
                {detail}
            </p>
        </div>
    );
}

export function BrokerDashboardSummary() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col justify-between gap-6 rounded-card bg-brand-deep p-6 md:col-span-1">
                <div className="flex items-center justify-between">
                    <span className="eyebrow text-[#B8CFC4]">Active pipeline</span>
                    <Users aria-hidden="true" className="text-[#B8CFC4] block-4 inline-4" />
                </div>
                <div>
                    <p className="tabular h1 text-white">18 clients</p>
                    <p className="body-sm mt-1 text-[#B8CFC4]">6 touring · 4 in offer · 2 closing</p>
                </div>
            </div>

            {STATS.map((stat) => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    );
}
