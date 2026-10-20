"use client";

import { type ReactNode, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { ChevronDown } from "@/components/shared/icons";

import { useRouter } from "@/lib/navigation";
import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { HoldToLogout } from "@/components/layout/hold-to-logout";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

export const portalProfileMenuItemClass = `
  h-9 cursor-pointer gap-2.5 rounded-inner px-3 body-sm font-medium text-ink
`;

export const portalProfileMenuSurfaceClass = `
  t-dropdown t-profile-menu animate-none! min-inline-[16.25rem] rounded-inner border
  border-border-warm bg-surface p-0 text-ink ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  p-3
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
    return <DropdownMenuSeparator className="mx-0! my-2.5 bg-border-warm inline-full!" />;
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
    /** Status row under the name — role, verification, account type, etc. */
    headerStatus: ReactNode;
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

function MobileProfileLink({
    userName,
    userAvatarUrl,
    profileHref,
}: {
    userName: string;
    userAvatarUrl?: string;
    profileHref: string;
}) {
    return (
        <Link
            href={profileHref}
            aria-label="Profile"
            className="flex items-center gap-1 ps-0 pe-1 text-ink-muted sm:hidden"
        >
            <UserAvatar name={userName} imageUrl={userAvatarUrl} size="md" />
        </Link>
    );
}

function DesktopProfileDropdown({
    userName,
    userAvatarUrl,
    headerStatus,
    children,
    tooltipLabel,
    open,
    onOpenChange,
}: Omit<PortalProfileMenuProps, "profileHref">) {
    const { handleLogout, isLoggingOut } = useLogoutHandler();

    const trigger = (
        <div className="flex items-center justify-center">
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="md"
                        aria-label="Account menu"
                        className="
                          gap-1 ps-0 pe-1 text-ink-muted
                          hover:bg-transparent hover:text-ink
                          data-popup-open:text-ink
                        "
                    />
                }
            >
                <UserAvatar name={userName} imageUrl={userAvatarUrl} size="md" />
                <ChevronDown aria-hidden="true" className="block-4 inline-4" strokeWidth={1.75} />
            </DropdownMenuTrigger>
        </div>
    );

    return (
        <div className="hidden sm:block">
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
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex flex-col gap-3 p-0! ps-[5px]! font-normal text-ink">
                            <div className="flex items-center gap-2.5">
                                <UserAvatar
                                    name={userName}
                                    imageUrl={userAvatarUrl}
                                    size="md"
                                    className="shrink-0"
                                />
                                <div className="flex flex-col gap-1 min-inline-0">
                                    <p className="truncate font-display text-sm font-medium text-ink capitalize">
                                        {userName}
                                    </p>
                                    {headerStatus}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    <PortalProfileMenuSeparator />

                    {children}

                    <PortalProfileMenuSeparator />

                    <DropdownMenuGroup>
                        <HoldToLogout disabled={isLoggingOut} onComplete={handleLogout} />
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * Shared account dropdown chrome for owner and broker portals.
 * Portal-specific links and status rows are passed as children / headerStatus.
 */
export function PortalProfileMenu({
    userName,
    userAvatarUrl,
    profileHref,
    headerStatus,
    children,
    tooltipLabel,
    open,
    onOpenChange,
}: PortalProfileMenuProps) {
    return (
        <>
            <MobileProfileLink
                userName={userName}
                userAvatarUrl={userAvatarUrl}
                profileHref={profileHref}
            />
            <DesktopProfileDropdown
                userName={userName}
                userAvatarUrl={userAvatarUrl}
                headerStatus={headerStatus}
                tooltipLabel={tooltipLabel}
                open={open}
                onOpenChange={onOpenChange}
            >
                {children}
            </DesktopProfileDropdown>
        </>
    );
}
