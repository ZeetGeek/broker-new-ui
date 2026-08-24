import { DashboardHeader } from "./dashboard-header";
import { dashboardMock } from "./mock-data";
import { NextShowingCard } from "./next-showing-card";
import { PlaceholderCard } from "./placeholder-card";

export function BrokerDashboard() {
    const data = dashboardMock;
    const now = new Date();
    const nextShowing = data.nextShowing
        ? {
              id: data.nextShowing.id,
              scheduledAt: new Date(now.getTime() + data.nextShowing.minutesUntil * 60_000),
              configLabel: data.nextShowing.configLabel,
              locality: data.nextShowing.locality,
              amountInr: data.nextShowing.amountInr,
              isRent: data.nextShowing.isRent,
              meetNote: data.nextShowing.meetNote,
              status: data.nextShowing.status,
              clientName: data.nextShowing.clientName,
              clientPhoneDigits: data.nextShowing.clientPhoneDigits,
          }
        : null;

    return (
        <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-6 md:gap-8">
            <header className="flex shrink-0 flex-col gap-4">
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

            <div
                className="
                  grid flex-1 grid-cols-1 gap-4
                  md:grid-cols-12 md:grid-rows-3 md:gap-5
                "
            >
                <NextShowingCard showing={nextShowing} now={now} className="md:col-span-5" />
                <PlaceholderCard title="Today" className="md:col-span-4" />
                <PlaceholderCard title="Your Requests" className="md:col-span-3" />
                <PlaceholderCard title="Pipeline" className="md:col-span-3" />
                <PlaceholderCard title="Follow-ups" className="md:col-span-4" />
                <PlaceholderCard title="Activity" className="md:col-span-5" />
                <PlaceholderCard title="New in your areas" className="md:col-span-12" />
            </div>
        </div>
    );
}
