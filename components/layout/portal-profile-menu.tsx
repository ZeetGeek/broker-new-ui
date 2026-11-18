"use client";

import { type ReactNode, useState } from "react";
import toast from "react-hot-toast";

import { useRouter } from "@/lib/navigation";
import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { LogoutMenuItem } from "@/components/layout/logout-menu-item";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PropertyMenuIcon as AccountMenuIcon } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

export const portalProfileMenuItemClass = `
  min-block-10 pointer-coarse:min-block-11 cursor-pointer gap-2.5 rounded-inner px-3 text-sm font-medium text-ink
`;

export const portalProfileMenuSurfaceClass = `
  t-dropdown t-profile-menu animate-none! rounded-card border inline-65 max-inline-[calc(100vw-1.5rem)]
  border-border-warm bg-surface p-1.5 text-ink shadow-xl ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted!
  **:data-[slot$=-item]:focus:text-ink!
  **:data-[variant=destructive]:data-highlighted:bg-danger-soft!
  **:data-[variant=destructive]:data-highlighted:text-danger!
  **:data-[variant=destructive]:focus:bg-danger-soft!
  **:data-[variant=destructive]:focus:text-danger!
`;

export function PortalProfileMenuSeparator() {
    return <DropdownMenuSeparator className="my-1" />;
}

export function PortalProfileShortcutHint({
    shortcutId,
    destructive = false,
}: {
    shortcutId: ShortcutId;
    destructive?: boolean;
}) {
    const shortcut = getShortcut(shortcutId);
    if (!shortcut?.showInProfileMenu) return null;

    return (
        <KbdGroup className="ms-auto hidden gap-0.5 sm:inline-flex">
            {shortcut.displayKeys.map((key) => (
                <Kbd
                    variant="surface"
                    key={key}
                    className={cn(
                        "px-1.5 text-[10px] tracking-normal",
                        destructive && "border-danger/30 text-danger",
                    )}
                >
                    {key}
                </Kbd>
            ))}
        </KbdGroup>
    );
}

export type PortalProfileMenuProps = {
    userName: string;
    userAvatarUrl?: string;
    profileHref: string;
    /** Short role shown under the name on the header pill — "Broker" / "Owner". */
    roleLabel: string;
    /** Menu body between header and logout (groups + separators). */
    children: ReactNode;
    tooltipLabel?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

function useLogoutHandler() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await dispatch(logout()).unwrap();
            dispatch(resetDashboard());
            toast.success("Signed out");
            router.replace("/login");
        } catch {
            dispatch(resetDashboard());
            toast.success("Signed out");
            router.replace("/login");
        } finally {
            setIsLoggingOut(false);
        }
    }

    return { handleLogout, isLoggingOut };
}

function DesktopProfileDropdown({
    userName,
    userAvatarUrl,
    roleLabel,
    children,
    tooltipLabel,
    open,
    onOpenChange,
}: Omit<PortalProfileMenuProps, "profileHref">) {
    const { handleLogout, isLoggingOut } = useLogoutHandler();
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    // Account pill: face + who you are, visible without opening the menu.
    // Name/role collapse to avatar-only below `lg` so the header never wraps.
    const trigger = (
        <div className="flex items-center justify-center">
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="md"
                        aria-label={`Account menu for ${userName}`}
                        className="
                          group gap-2.5 rounded-full bg-transparent px-0 text-ink-subtle
                          transition-colors duration-160
                          hover:bg-transparent hover:text-ink-muted
                          focus:bg-transparent
                          focus-visible:border-transparent focus-visible:bg-transparent
                          focus-visible:ring-0
                          aria-expanded:bg-transparent data-popup-open:text-ink-muted
                          dark:hover:bg-transparent
                        "
                    />
                }
            >
                {/* Keyboard focus shows on the avatar only — no pill outline. */}
                <UserAvatar
                    name={userName}
                    imageUrl={userAvatarUrl}
                    size="md"
                    className="group-focus-visible:ring-2 group-focus-visible:ring-brand"
                />
                <span className="flex flex-col items-start gap-0.5 text-start min-inline-0">
                    <span className="body-sm truncate leading-tight font-semibold text-ink max-inline-36">
                        {userName}
                    </span>
                    <span className="body-xs leading-tight text-ink-muted">{roleLabel}</span>
                </span>
                <AccountMenuIcon
                    name="chevron-down"
                    aria-hidden="true"
                    className="
                      transition-transform duration-160 block-3.5 inline-3.5
                      group-data-popup-open:rotate-180
                    "
                />
            </DropdownMenuTrigger>
        </div>
    );

    return (
        <div>
            <DropdownMenu open={open} onOpenChange={onOpenChange}>
                {tooltipLabel ? (
                    <Tooltip>
                        <TooltipTrigger render={trigger} />
                        <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
                    </Tooltip>
                ) : (
                    trigger
                )}

                <DropdownMenuContent
                    align="end"
                    sideOffset={14}
                    className={cn(portalProfileMenuSurfaceClass)}
                >
                    {children}

                    <PortalProfileMenuSeparator />

                    <DropdownMenuGroup>
                        <LogoutMenuItem
                            disabled={isLoggingOut}
                            onSelect={() => setIsLogoutConfirmOpen(true)}
                        />
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <ConfirmDialog
                open={isLogoutConfirmOpen}
                onOpenChange={setIsLogoutConfirmOpen}
                title="Log out?"
                confirmLabel="Log out"
                cancelLabel="Stay signed in"
                busy={isLoggingOut}
                onConfirm={() => void handleLogout()}
            >
                <p className="body text-ink-muted">You can sign back in any time.</p>
            </ConfirmDialog>
        </div>
    );
}

/**
 * Shared account dropdown chrome for owner and broker portals.
 * Portal-specific links are passed as children.
 */
export function PortalProfileMenu({
    userName,
    userAvatarUrl,
    roleLabel,
    children,
    tooltipLabel,
    open,
    onOpenChange,
}: PortalProfileMenuProps) {
    return (
        <DesktopProfileDropdown
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            roleLabel={roleLabel}
            tooltipLabel={tooltipLabel}
            open={open}
            onOpenChange={onOpenChange}
        >
            {children}
        </DesktopProfileDropdown>
    );
}
