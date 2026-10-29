"use client";

import Link from "next/link";

import { Command, Gift, Home, LifeBuoy, User } from "@/components/shared/icons";

import { OWNER_PROFILE_HREF, OWNER_REFERRALS_HREF } from "@/lib/routes/owner";

import {
    PortalProfileMenu,
    PortalProfileMenuSeparator,
    PortalProfileShortcutHint,
    portalProfileMenuItemClass,
} from "@/components/layout/portal-profile-menu";
import { DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";

export type OwnerProfileMenuProps = {
    userName: string;
    userAvatarUrl?: string;
    /** Plain status under the name, e.g. "Independent" or org name — never raw enums. */
    accountStatusLabel: string;
    onShortcutsOpen?: () => void;
    tooltipLabel?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

function OwnerStatus({ accountStatusLabel }: { accountStatusLabel: string }) {
    return (
        <div className="body-xs flex items-center gap-2.5 font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1">
                <Home aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={2} />
                Owner
            </span>
            <span aria-hidden className="rounded-full bg-ink-subtle/40 block-1 inline-1" />
            <span className="truncate">{accountStatusLabel}</span>
        </div>
    );
}

export function OwnerProfileMenu({
    userName,
    userAvatarUrl,
    accountStatusLabel,
    onShortcutsOpen,
    tooltipLabel,
    open,
    onOpenChange,
}: OwnerProfileMenuProps) {
    return (
        <PortalProfileMenu
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            profileHref={OWNER_PROFILE_HREF}
            headerStatus={<OwnerStatus accountStatusLabel={accountStatusLabel} />}
            tooltipLabel={tooltipLabel}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DropdownMenuGroup>
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={OWNER_PROFILE_HREF} />}
                >
                    <User aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                    <span className="flex-1 min-inline-0">My profile</span>
                    <PortalProfileShortcutHint shortcutId="profile" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={OWNER_REFERRALS_HREF} />}
                >
                    <Gift aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                    <span className="flex-1 min-inline-0">Referrals</span>
                    <PortalProfileShortcutHint shortcutId="referrals" />
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <PortalProfileMenuSeparator />

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
