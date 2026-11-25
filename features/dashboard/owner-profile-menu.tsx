"use client";

import Link from "next/link";

import { OWNER_PROFILE_HREF, OWNER_REFERRALS_HREF } from "@/lib/routes/owner";

import {
    PortalProfileMenu,
    PortalProfileMenuGroup as DropdownMenuGroup,
    PortalProfileMenuItem as DropdownMenuItem,
    portalProfileMenuItemClass,
    PortalProfileMenuSeparator,
    PortalProfileShortcutHint,
} from "@/components/layout/portal-profile-menu";
import { PropertyMenuIcon as AccountMenuIcon } from "@/components/shared/icons";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";

export type OwnerProfileMenuProps = {
    userName: string;
    userAvatarUrl?: string;
    onShortcutsOpen?: () => void;
    tooltipLabel?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export function OwnerProfileMenu({
    userName,
    userAvatarUrl,
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
            roleLabel="Owner"
            tooltipLabel={tooltipLabel}
            open={open}
            onOpenChange={onOpenChange}
        >
            <DropdownMenuGroup>
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={OWNER_PROFILE_HREF} />}
                >
                    <AccountMenuIcon
                        name="account"
                        aria-hidden
                        className="shrink-0 text-ink! block-4.5! inline-4.5!"
                    />
                    <span className="flex-1 min-inline-0">My profile</span>
                    <PortalProfileShortcutHint shortcutId="profile" portal="owner" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={OWNER_REFERRALS_HREF} />}
                >
                    <AccountMenuIcon
                        name="gift"
                        aria-hidden
                        className="shrink-0 text-ink! block-4.5! inline-4.5!"
                    />
                    <span className="flex-1 min-inline-0">Referrals</span>
                    <PortalProfileShortcutHint shortcutId="referrals" portal="owner" />
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <PortalProfileMenuSeparator />

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
                    <PortalProfileShortcutHint shortcutId="shortcuts_cheatsheet" portal="owner" />
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
