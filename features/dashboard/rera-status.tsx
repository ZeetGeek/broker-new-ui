import Link from "next/link";

import { Clock, type LucideIcon, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ReraStatus } from "./mock-data";

const PROFILE_EDIT_HREF = "/broker/profile/edit";
const VERIFY_WAIT_COPY = "Usually within 24 hours";
const ADD_RERA_TOOLTIP =
    "Add your RERA number to get verified. Owners approve verified brokers far more often.";
const SETUP_CHIP_TOOLTIP_CLASS = "block w-max max-w-74! text-pretty";
const ACTIONABLE_CHIP_HOVER =
    "transition-colors duration-160 hover:brightness-95 active:brightness-90";

const CHIP: Record<
    Exclude<ReraStatus, "verifying">,
    {
        label: string;
        variant: "brand" | "neutral" | "urgent" | "outline";
        icon: LucideIcon;
        href?: string;
    }
> = {
    verified: { label: "RERA verified", variant: "brand", icon: ShieldCheck },
    profile_incomplete: {
        label: "Add RERA",
        variant: "urgent",
        icon: ShieldAlert,
        href: PROFILE_EDIT_HREF,
    },
};

export type ReraStatusChipProps = {
    status: ReraStatus;
};

export function ReraStatusChip({ status }: ReraStatusChipProps) {
    if (status === "verifying") {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Badge
                            variant="outline"
                            className="bg-surface font-semibold text-pending"
                            aria-label={`RERA verifying. ${VERIFY_WAIT_COPY}.`}
                        >
                            <Clock aria-hidden className="block-3 inline-3" strokeWidth={1.75} />
                            RERA verifying...
                        </Badge>
                    }
                />
                <TooltipContent side="bottom">{VERIFY_WAIT_COPY}</TooltipContent>
            </Tooltip>
        );
    }

    const chip = CHIP[status];
    const Icon = chip.icon;
    const surfaceOutline = chip.variant === "outline" ? "bg-surface" : undefined;
    const className = cn(badgeVariants({ variant: chip.variant }), surfaceOutline);

    const content = (
        <>
            <Icon aria-hidden className="block-3 inline-3" strokeWidth={1.75} />
            {chip.label}
        </>
    );

    if (chip.href) {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Link
                            href={chip.href}
                            aria-label="Add your RERA number to get verified"
                            className={cn(
                                className,
                                ACTIONABLE_CHIP_HOVER,
                                "outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                            )}
                        >
                            {content}
                        </Link>
                    }
                />
                <TooltipContent side="inline-end" className={SETUP_CHIP_TOOLTIP_CLASS}>
                    {ADD_RERA_TOOLTIP}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Badge variant={chip.variant} className={surfaceOutline}>
            {content}
        </Badge>
    );
}

export type ReraBannerProps = {
    status: ReraStatus;
};

export function ReraBanner({ status }: ReraBannerProps) {
    if (status === "verified") {
        return null;
    }

    if (status === "verifying") {
        return (
            <div
                role="status"
                className="
                  flex items-start gap-3 rounded-card bg-brand-soft px-4 py-3 text-brand-text
                  md:items-center md:px-5
                "
            >
                <Shield
                    aria-hidden
                    className="mbs-0.5 shrink-0 block-5 inline-5 md:mbs-0"
                    strokeWidth={1.75}
                />
                <p className="body-sm font-medium">
                    Verifying your RERA number. Usually within 24 hours. You can browse meanwhile.
                </p>
            </div>
        );
    }

    return (
        <div
            role="status"
            className="
              flex flex-col gap-3 rounded-card bg-urgent-soft px-4 py-3 text-urgent
              sm:flex-row sm:items-center sm:justify-between sm:px-5
            "
        >
            <div className="flex items-start gap-3 md:items-center">
                <ShieldAlert
                    aria-hidden
                    className="mbs-0.5 shrink-0 block-5 inline-5 md:mbs-0"
                    strokeWidth={1.75}
                />
                <p className="body-sm font-medium">
                    Add your RERA number so owners can see you&apos;re verified.
                </p>
            </div>
            <Button
                variant="outline"
                size="md"
                nativeButton={false}
                render={<Link href={PROFILE_EDIT_HREF} />}
                className="
                  shrink-0 self-start border-2 border-urgent/40 bg-surface text-urgent
                  sm:self-center
                "
            >
                Add RERA
            </Button>
        </div>
    );
}
