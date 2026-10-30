"use client";

import Link from "next/link";

import {
    PortalProfileMenu,
    portalProfileMenuItemClass,
    PortalProfileMenuSeparator,
    PortalProfileShortcutHint,
} from "@/components/layout/portal-profile-menu";
import { PropertyMenuIcon as AccountMenuIcon } from "@/components/shared/icons";
import { DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";
import { FEATURE_RERA_VERIFICATION } from "@/config/index";
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
const SAVED_PROPERTIES_HREF = "/broker/saved-properties";
const REFERRALS_HREF = "/broker/referrals";
const VERIFICATION_HREF = "/broker/profile#profile-rera";

function VerificationStatus({ state }: { state: BrokerVerificationState }) {
    const verified = state === "VERIFIED";
    const pending = state === "PENDING_VERIFICATION";
    return (
        <div className="body-xs flex flex-wrap items-center gap-2.5 font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1">
                <AccountMenuIcon
                    name="briefcase"
                    aria-hidden
                    className="shrink-0 block-3.5 inline-3.5"
                />
                Broker
            </span>
            {/* Verification badge temporarily hidden. */}
            {FEATURE_RERA_VERIFICATION && (
                <span
                    className={
                        verified
                            ? "inline-flex items-center gap-1 text-brand-text"
                            : "inline-flex items-center gap-1 text-ink-muted"
                    }
                >
                    <AccountMenuIcon
                        name={verified ? "verified" : "unverified"}
                        aria-hidden
                        className="shrink-0 block-3.5 inline-3.5"
                    />
                    {verified ? "RERA verified" : pending ? "Under review" : "Not verified"}
                </span>
            )}
        </div>
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
            headerStatus={<VerificationStatus state={broker.verificationState} />}
            tooltipLabel={tooltipLabel}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DropdownMenuGroup>
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={PROFILE_HREF} />}
                >
                    <AccountMenuIcon
                        name="account"
                        aria-hidden
                        className="shrink-0 text-ink! block-4.5! inline-4.5!"
                    />
                    <span className="flex-1 min-inline-0">My profile</span>
                    <PortalProfileShortcutHint shortcutId="profile" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={SAVED_PROPERTIES_HREF} />}
                >
                    <AccountMenuIcon
                        name="bookmark"
                        aria-hidden
                        className="shrink-0 text-ink! block-4.5! inline-4.5!"
                    />
                    <span className="flex-1 min-inline-0">Saved properties</span>
                </DropdownMenuItem>

                {/* Verification & RERA temporarily hidden; retain menu action for later. */}
                {FEATURE_RERA_VERIFICATION && broker.verificationState !== "VERIFIED" ? (
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        render={<Link href={VERIFICATION_HREF} />}
                    >
                        <AccountMenuIcon
                            name="shield"
                            aria-hidden
                            className="shrink-0 text-ink! block-4.5! inline-4.5!"
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
                        <AccountMenuIcon
                            name="gift"
                            aria-hidden
                            className="shrink-0 text-ink! block-4.5! inline-4.5!"
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
                    <AccountMenuIcon
                        name="keyboard"
                        aria-hidden
                        className="shrink-0 text-ink! block-4.5! inline-4.5!"
                    />
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
                        <AccountMenuIcon
                            name="support"
                            aria-hidden
                            className="shrink-0 text-ink! block-4.5! inline-4.5!"
                        />
                        <span className="flex-1 min-inline-0">Help & support</span>
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuGroup>
        </PortalProfileMenu>
    );
}
