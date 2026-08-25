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
        <div className="flex flex-col gap-6 min-block-[calc(100dvh-5rem)] md:gap-6">
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

            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 md:gap-5">
                <NextShowingCard showing={nextShowing} now={now} className="md:col-span-5" />
                <PlaceholderCard
                    title="Today"
                    info="Site visits scheduled for today — times, properties, and clients."
                    className="md:col-span-4"
                />
                <PlaceholderCard
                    title="Your Requests"
                    info="Requests you've sent to owners to represent their properties, and where each one stands."
                    className="md:col-span-3"
                />
                <PlaceholderCard
                    title="Pipeline"
                    info="Your active clients and which deal stage each one is in."
                    className="md:col-span-3"
                />
                <PlaceholderCard
                    title="Follow-ups"
                    info="People you need to call or message next — overdue items show first."
                    className="md:col-span-4"
                />
                <PlaceholderCard
                    title="Activity"
                    info="Recent updates across your properties, clients, and visits."
                    className="md:col-span-5"
                />
                <PlaceholderCard
                    title="New in your areas"
                    info="Fresh listings in the localities you cover — ready to request representation."
                    className="md:col-span-12"
                />
            </div>
        </div>
    );
}
