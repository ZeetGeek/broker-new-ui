"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ReferenceLine,
    XAxis,
    YAxis,
} from "recharts";

import { DEFAULT_CURRENCY } from "@/lib/format/currency";
import { formatPrice } from "@/lib/format/price";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { DEAL_STAGE_ORDER, type DealStatus } from "@/features/pipeline/types";
import { statusLabel } from "@/features/properties/property-analytics/analytics-labels";
import {
    DEMO_ASK_INR,
    type DemoClient,
} from "@/features/properties/property-analytics/broker-analytics-demo";

import styles from "./broker-property-analytics.module.css";

export function ClientProgressChart({ clients }: { clients: DemoClient[] }) {
    const stages: DealStatus[] = [...DEAL_STAGE_ORDER, "closed", "lost"];
    const data = stages.map((stage) => ({
        stage: statusLabel(stage, "Closed"),
        count: clients.filter((client) => client.stage === stage).length,
        lost: stage === "lost",
    }));
    return (
        <>
            <ChartContainer
                className={styles.progressChart}
                config={{ count: { label: "Clients", color: "var(--color-brand)" } }}
                aria-label="Clients by current pipeline stage"
            >
                <BarChart
                    data={data}
                    layout="vertical"
                    accessibilityLayer
                    margin={{ left: 0, right: 28, top: 0, bottom: 0 }}
                    barSize={13}
                >
                    <CartesianGrid horizontal={false} strokeDasharray="3 4" />
                    <XAxis
                        type="number"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, Math.max(5, ...data.map((row) => row.count))]}
                    />
                    <YAxis
                        type="category"
                        dataKey="stage"
                        width={92}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 5, 5, 0]} isAnimationActive={false}>
                        {data.map((row) => (
                            <Cell
                                key={row.stage}
                                fill={row.lost ? "var(--color-ink-subtle)" : "var(--color-brand)"}
                            />
                        ))}
                        <LabelList
                            dataKey="count"
                            position="right"
                            fill="var(--color-ink)"
                            fontSize={12}
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
            <ul className="sr-only">
                {data.map((row) => (
                    <li key={row.stage}>
                        {row.stage}: {row.count} clients
                    </li>
                ))}
            </ul>
        </>
    );
}

export function OffersComparisonChart({ offers }: { offers: DemoClient[] }) {
    const data = offers.map((client) => ({
        name: client.name.split(" ")[0],
        fullName: client.name,
        amount: client.offer!,
        withdrawn: client.withdrawn,
    }));
    return (
        <>
            <ChartContainer
                className={styles.offersChart}
                config={{ amount: { label: "Recorded offer", color: "var(--color-brand)" } }}
                aria-label="Recorded offers compared with the sample asking price"
            >
                <BarChart
                    data={data}
                    layout="vertical"
                    accessibilityLayer
                    margin={{ left: 0, right: 78, top: 18, bottom: 0 }}
                    barSize={16}
                >
                    <CartesianGrid horizontal={false} strokeDasharray="3 4" />
                    <XAxis
                        type="number"
                        domain={[0, DEMO_ASK_INR]}
                        ticks={[0, 10_000_000, 20_000_000]}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatPrice(Number(value), DEFAULT_CURRENCY)}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={52}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                    />
                    <ReferenceLine
                        x={DEMO_ASK_INR}
                        stroke="var(--color-ink-muted)"
                        strokeDasharray="4 3"
                        label={{
                            value: "Asking",
                            position: "top",
                            fontSize: 11,
                            fill: "var(--color-ink-muted)",
                        }}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                formatter={(value, _name, item) => (
                                    <div className={styles.chartTooltip}>
                                        <span>
                                            {item.payload.fullName}
                                            {item.payload.withdrawn ? " · Withdrawn" : ""}
                                        </span>
                                        <strong>
                                            {formatPrice(Number(value), DEFAULT_CURRENCY)}
                                        </strong>
                                    </div>
                                )}
                            />
                        }
                    />
                    <Bar dataKey="amount" radius={[0, 5, 5, 0]} isAnimationActive={false}>
                        {data.map((row) => (
                            <Cell
                                key={row.name}
                                fill={
                                    row.withdrawn ? "var(--color-ink-subtle)" : "var(--color-brand)"
                                }
                            />
                        ))}
                        <LabelList
                            dataKey="amount"
                            content={({ x, y, width, height, value }) => (
                                <text
                                    x={Number(x) + Number(width) + 7}
                                    y={Number(y) + Number(height) / 2}
                                    dominantBaseline="middle"
                                    fill="var(--color-ink)"
                                    fontSize={11}
                                >
                                    {formatPrice(Number(value), DEFAULT_CURRENCY)}
                                </text>
                            )}
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
            <ul className="sr-only">
                {offers.map((client) => (
                    <li key={client.id}>
                        {client.name}: {formatPrice(client.offer!, DEFAULT_CURRENCY)}
                        {client.withdrawn ? ", withdrawn" : ""}
                    </li>
                ))}
            </ul>
        </>
    );
}
