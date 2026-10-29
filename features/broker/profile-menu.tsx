"use client";

import Link from "next/link";

import {
    PortalProfileMenu,
    portalProfileMenuItemClass,
    PortalProfileMenuSeparator,
    PortalProfileShortcutHint,
} from "@/components/layout/portal-profile-menu";
import {
    BadgeCheck,
    Bookmark,
    Briefcase,
    Command,
    Gift,
    LifeBuoy,
    ShieldCheck,
    User,
} from "@/components/shared/icons";
import { DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";
import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import type { BrokerVerificationState } from "@/features/broker/map-profile-menu";

export type BrokerProfileMenuBroker = {
    name: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
    verificationState: BrokerVerificationState;
    profileCompletion: number;
    publicSlug?: string | null;
};

export type BrokerProfileMenuProps = {
    broker: BrokerProfileMenuBroker;
    onShortcutsOpen?: () => void;
    tooltipLabel?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

const PROFILE_HREF = "/broker/profile";
const PROFILE_EDIT_HREF = "/broker/profile";
const SAVED_PROPERTIES_HREF = "/broker/saved-properties";
const REFERRALS_HREF = "/broker/referrals";
const VERIFICATION_HREF = "/broker/profile#profile-rera";

function VerificationStatus({
    state,
    profileCompletion,
}: {
    state: BrokerVerificationState;
    profileCompletion: number;
}) {
    if (state === "VERIFIED") {
        return (
            <div className="body-xs flex items-center gap-2.5 font-medium text-ink-muted">
                <span className="inline-flex items-center gap-1">
                    <Briefcase
                        aria-hidden
                        className="shrink-0 block-3.5 inline-3.5"
                        strokeWidth={2}
                    />
                    Broker
                </span>
                <span aria-hidden className="rounded-full bg-ink-subtle/40 block-1 inline-1" />
                <span className="inline-flex items-center gap-1 text-brand-text">
                    <BadgeCheck
                        aria-hidden
                        className="shrink-0 animate-verified-glow text-brand block-3.5 inline-3.5"
                        strokeWidth={2.25}
                    />
                    RERA verified
                </span>
            </div>
        );
    }

    if (state === "PENDING_VERIFICATION") {
        return (
            <div
                className="
                  body-xs rounded-md border border-border-warm bg-surface-muted/80 px-3 py-1.5
                  font-medium text-ink-muted
                "
            >
                Under review
            </div>
        );
    }

    const clamped = Math.min(100, Math.max(0, profileCompletion));

    return (
        <Link
            href={PROFILE_EDIT_HREF}
            className="
              group/chip block overflow-hidden rounded-inner border border-brand-soft
              bg-linear-to-br from-brand-soft/70 to-surface-muted/50 px-3 py-2.5
              transition-[background-color,box-shadow] duration-160 ease-out
              hover:border-brand/25 hover:shadow-xs
            "
        >
            <div className="flex items-center justify-between gap-2">
                <span className="body-xs font-semibold text-brand-text">Complete your profile</span>
                <span className="tabular body-xs font-semibold text-brand">{clamped}%</span>
            </div>
            <div
                className="mbs-2 overflow-hidden rounded-full bg-canvas/60 block-1"
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Profile ${clamped}% complete`}
            >
                <div
                    className="
                      rounded-full bg-brand transition-[width] duration-500 ease-out block-full
                    "
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </Link>
    );
}

export function BrokerProfileMenu({
    broker,
    onShortcutsOpen,
    tooltipLabel,
    open,
    onOpenChange,
}: BrokerProfileMenuProps) {
    return (
        <PortalProfileMenu
            userName={broker.name}
            userAvatarUrl={broker.avatarUrl}
            profileHref={PROFILE_HREF}
            headerStatus={
                <VerificationStatus
                    state={broker.verificationState}
                    profileCompletion={broker.profileCompletion}
                />
            }
            tooltipLabel={tooltipLabel}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DropdownMenuGroup>
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={PROFILE_HREF} />}
                >
                    <User aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                    <span className="flex-1 min-inline-0">My profile</span>
                    <PortalProfileShortcutHint shortcutId="profile" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={SAVED_PROPERTIES_HREF} />}
                >
                    <Bookmark
                        aria-hidden
                        className="shrink-0 block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <span className="flex-1 min-inline-0">Saved properties</span>
                </DropdownMenuItem>

                {broker.verificationState !== "VERIFIED" ? (
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        render={<Link href={VERIFICATION_HREF} />}
                    >
                        <ShieldCheck
                            aria-hidden
                            className="shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="flex-1 min-inline-0">Verification & RERA</span>
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuGroup>

            <PortalProfileMenuSeparator />

            {FEATURE_PLATFORM_OWNER ? (
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        render={<Link href={REFERRALS_HREF} />}
                    >
                        <Gift
                            aria-hidden
                            className="shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="flex-1 min-inline-0">Referrals</span>
                        <PortalProfileShortcutHint shortcutId="referrals" />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            ) : null}

            {FEATURE_PLATFORM_OWNER ? <PortalProfileMenuSeparator /> : null}

            <DropdownMenuGroup>
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    onClick={() => onShortcutsOpen?.()}
                >
                    <Command aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                    <span className="flex-1 min-inline-0">Keyboard shortcuts</span>
                    <PortalProfileShortcutHint shortcutId="shortcuts_cheatsheet" />
                </DropdownMenuItem>

                {SUPPORT_WHATSAPP_URL ? (
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        render={
                            <a
                                href={SUPPORT_WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            />
                        }
                    >
                        <LifeBuoy
                            aria-hidden
                            className="shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="flex-1 min-inline-0">Help & support</span>
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuGroup>
        </PortalProfileMenu>
    );
}
