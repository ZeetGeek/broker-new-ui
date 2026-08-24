import { DashboardHeader } from "./dashboard-header";
import { FollowUpsCard } from "./follow-ups-card";
import { dashboardMock } from "./mock-data";
import { NewInAreas } from "./new-in-areas";
import { PipelineCard } from "./pipeline-card";
import { RequestsCard } from "./requests-card";
import { ReraBanner } from "./rera-banner";
import { TodayCard } from "./today-card";

function weekdayLabelFor(date: Date): string {
    return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date);
}

export function BrokerDashboard() {
    const data = dashboardMock;
    const weekdayLabel = weekdayLabelFor(new Date());

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            <DashboardHeader
                weekdayLabel={weekdayLabel}
                siteVisitCount={data.siteVisitCount}
                requestsWaitingCount={data.requestsWaitingCount}
            />

            {data.reraVerifying ? <ReraBanner /> : null}

            {/*
              Mobile priority: Today → Follow-ups → Requests → Pipeline
              Desktop 2×2: Today | Requests / Pipeline | Follow-ups
            */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <TodayCard visits={data.todayVisits} className="order-1" />
                <FollowUpsCard
                    items={data.followUps}
                    overdueCount={data.overdueFollowUpCount}
                    className="order-2 md:order-4"
                />
                <RequestsCard counts={data.requestCounts} className="order-3 md:order-2" />
                <PipelineCard
                    activeClientCount={data.activeClientCount}
                    stages={data.pipeline}
                    className="order-4 md:order-3"
                />
            </div>

            <NewInAreas properties={data.newInAreas} />
        </div>
    );
}
