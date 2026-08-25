"use client";

import { ActivityCard } from "./activity-card";
import { DashboardHeader } from "./dashboard-header";
import { DashEnter } from "./dash-enter";
import { FollowUpsCard } from "./follow-ups-card";
import { dashboardMock } from "./mock-data";
import { NewInAreas } from "./new-in-areas";
import { NextShowingCard } from "./next-showing-card";
import { PipelineCard } from "./pipeline-card";
import { RequestsCard } from "./requests-card";
import { TodayCard } from "./today-card";
import { YouRepresentCard } from "./you-represent-card";

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
                <DashEnter index={0} className="md:col-span-5 md:row-start-1">
                    <NextShowingCard showing={nextShowing} now={now} />
                </DashEnter>
                <DashEnter
                    index={1}
                    className="grid grid-cols-1 gap-4 md:col-span-7 md:row-start-1 md:grid-cols-2 md:gap-5"
                >
                    <TodayCard agenda={data.today} now={now} />
                    <RequestsCard data={data.requests} serviceAreas={data.serviceAreas} />
                </DashEnter>
                <DashEnter
                    index={2}
                    className="grid grid-cols-1 gap-4 md:col-span-7 md:row-start-2 md:grid-cols-2 md:gap-5"
                >
                    <PipelineCard data={data.pipelineCard} />
                    <FollowUpsCard data={data.followUps} />
                </DashEnter>
                <DashEnter index={3} className="md:col-span-6 md:col-start-1 md:row-start-3">
                    <YouRepresentCard data={data.youRepresent} />
                </DashEnter>
                <DashEnter index={4} className="md:col-span-5 md:col-start-8 md:row-start-2">
                    <ActivityCard data={data.activity} now={now} />
                </DashEnter>
                <DashEnter index={5} className="md:col-span-6 md:col-start-7 md:row-start-3">
                    <NewInAreas properties={data.newInAreas} serviceAreas={data.serviceAreas} />
                </DashEnter>
            </div>
        </div>
    );
}
