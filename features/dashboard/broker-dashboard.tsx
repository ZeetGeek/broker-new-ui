import { DashboardHeader } from "./dashboard-header";
import { dashboardMock } from "./mock-data";
import { PlaceholderCard } from "./placeholder-card";

export function BrokerDashboard() {
    const data = dashboardMock;
    const now = new Date();

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            <header className="flex flex-col gap-4">
                <DashboardHeader
                    now={now}
                    siteVisitCount={data.siteVisitCount}
                    requestsWaitingCount={data.requestsWaitingCount}
                    reraStatus={data.reraStatus}
                    serviceAreas={data.serviceAreas}
                    activityStreakDays={data.activityStreakDays}
                    phoneDigits={data.phoneDigits}
                    email={data.email}
                />
            </header>

            <div className="row gx-3 gy-3 md:gx-4 md:gy-4">
                <div className="col-12 md:col-5">
                    <PlaceholderCard title="Next Showing" />
                </div>
                <div className="col-12 md:col-4">
                    <PlaceholderCard title="Today" />
                </div>
                <div className="col-12 md:col-3">
                    <PlaceholderCard title="Your Requests" />
                </div>
                <div className="col-12 md:col-3">
                    <PlaceholderCard title="Pipeline" />
                </div>
                <div className="col-12 md:col-4">
                    <PlaceholderCard title="Follow-ups" />
                </div>
                <div className="col-12 md:col-5">
                    <PlaceholderCard title="Activity" />
                </div>
            </div>
        </div>
    );
}
