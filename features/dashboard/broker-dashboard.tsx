import { DashboardHeader } from "./dashboard-header";
import { FollowUpsCard } from "./follow-ups-card";
import { dashboardMock } from "./mock-data";
import { NextShowingCard } from "./next-showing-card";
import { PipelineCard } from "./pipeline-card";
import { PlaceholderCard } from "./placeholder-card";
import { RequestsCard } from "./requests-card";
import { TodayCard } from "./today-card";

export function BrokerDashboard() {
    const data = dashboardMock;
    const now = new Date();
    const nextShowing = data.nextShowing
        ? {
              id: data.nextShowing.id,
              scheduledAt: new Date(now.getTime() + data.nextShowing.minutesUntil * 60_000),
              configLabel: data.nextShowing.configLabel,
              locality: data.nextShowing.locality,
              address: data.nextShowing.address,
              amountInr: data.nextShowing.amountInr,
              isRent: data.nextShowing.isRent,
              meetNote: data.nextShowing.meetNote,
              distanceKm: data.nextShowing.distanceKm,
              brokerNote: data.nextShowing.brokerNote,
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
                    phoneDigits={data.phoneDigits}
                    email={data.email}
                />
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
                <NextShowingCard showing={nextShowing} now={now} className="md:col-span-5" />
                <div className="grid grid-cols-1 gap-4 md:col-span-7 md:grid-cols-2 md:gap-5">
                    <TodayCard agenda={data.today} now={now} />
                    <RequestsCard data={data.requests} serviceAreas={data.serviceAreas} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:col-span-7 md:grid-cols-2 md:gap-5">
                    <PipelineCard data={data.pipelineCard} />
                    <FollowUpsCard data={data.followUps} />
                </div>
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
