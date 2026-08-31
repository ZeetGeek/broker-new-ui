"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Bell, ChevronDown, Gift, LogOut, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

export type PortalProfileMenuProps = {
    userName: string;
    userEmail?: string;
    userAvatarUrl?: string;
    profileHref: string;
    referralsHref?: string;
    notificationsHref?: string;
    roleLabel?: string;
    orgName?: string | null;
    tooltipLabel?: string;
};

const itemClass = `
  body-sm cursor-pointer gap-2 rounded-inner px-3 py-2 font-medium text-ink
  focus:bg-surface-muted focus:text-ink
`;

export function PortalProfileMenu({
    userName,
    userEmail,
    userAvatarUrl,
    profileHref,
    referralsHref,
    notificationsHref,
    roleLabel,
    orgName,
    tooltipLabel,
}: PortalProfileMenuProps) {
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

    const trigger = (
        <DropdownMenuTrigger
            render={
                <Button
                    variant="ghost"
                    size="md"
                    aria-label={`${userName} menu`}
                    className="
                      scale-[0.96] gap-1 ps-0 pe-1 text-ink-muted
                      hover:bg-transparent hover:text-ink
                      data-popup-open:text-ink
                    "
                />
            }
        >
            <span className="overflow-hidden rounded-full block-control-lg inline-control-lg">
                <UserAvatar name={userName} imageUrl={userAvatarUrl} size="fill" />
            </span>
            <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
    );

    return (
        <DropdownMenu>
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
                sideOffset={8}
                className={cn(
                    `
                      t-dropdown animate-none! rounded-inner border border-border-warm bg-surface
                      p-0 text-ink shadow-md ring-0 min-inline-56
                      before:backdrop-blur-none
                      dark:bg-surface dark:text-ink
                      data-open:animate-none!
                      data-closed:animate-none!
                    `,
                )}
            >
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2 p-3 text-ink">
                        <span className="overflow-hidden rounded-full block-9 inline-9">
                            <UserAvatar name={userName} imageUrl={userAvatarUrl} size="fill" />
                        </span>
                        <div className="min-inline-0">
                            <p className="body truncate font-medium text-ink capitalize">
                                {userName}
                            </p>
                            {userEmail ? (
                                <p className="body-xs truncate text-ink-muted">{userEmail}</p>
                            ) : null}
                            {orgName ? (
                                <p className="body-xs mbs-0.5 truncate font-medium text-ink">
                                    {orgName}
                                </p>
                            ) : null}
                            {roleLabel ? (
                                <p className="eyebrow mbs-0.5 text-brand">{roleLabel}</p>
                            ) : null}
                        </div>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-border-warm" />

                <DropdownMenuGroup className="p-1.5">
                    <DropdownMenuItem className={itemClass} render={<Link href={profileHref} />}>
                        <UserRound aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Profile
                    </DropdownMenuItem>

                    {referralsHref ? (
                        <DropdownMenuItem
                            className={itemClass}
                            render={<Link href={referralsHref} />}
                        >
                            <Gift aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Referrals & Credits
                        </DropdownMenuItem>
                    ) : null}

                    {notificationsHref ? (
                        <DropdownMenuItem
                            className={itemClass}
                            render={<Link href={notificationsHref} />}
                        >
                            <Bell aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Notifications
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-border-warm" />

                <DropdownMenuGroup className="p-1.5">
                    <DropdownMenuItem
                        className={itemClass}
                        disabled={isLoggingOut}
                        onClick={() => void handleLogout()}
                    >
                        <LogOut aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        {isLoggingOut ? "Signing out…" : "Log out"}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
