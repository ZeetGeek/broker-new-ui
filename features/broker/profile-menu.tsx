"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    BadgeCheck,
    Briefcase,
    ChevronDown,
    Command,
    ExternalLink,
    LifeBuoy,
    Settings,
    ShieldCheck,
    User,
} from "lucide-react";

import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
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
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";
import { SITE_URL } from "@/config/index";
import { HoldToLogout } from "@/features/broker/hold-to-logout";
import type { BrokerVerificationState } from "@/features/broker/map-profile-menu";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

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
const PROFILE_EDIT_HREF = "/broker/profile/edit";
const SETTINGS_HREF = "/broker/settings";
const VERIFICATION_HREF = "/broker/verification";

const itemClass = `
  h-9 cursor-pointer gap-2.5 rounded-inner px-3 body-sm font-medium text-ink
`;

const menuSurfaceClass = `
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

function brokerPublicProfileUrl(slug: string) {
    return `${SITE_URL.replace(/\/$/, "")}/b/${slug}`;
}

function ShortcutHint({
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
                    <Briefcase aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={2} />
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
                  body-xs rounded-full border border-border-warm bg-surface-muted/80 px-3 py-1.5
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

function ProfileMenuHeader({ broker }: { broker: BrokerProfileMenuBroker }) {
    return (
        <DropdownMenuLabel className="flex flex-col gap-3 p-0! font-normal text-ink">
            <div className="flex items-center gap-2.5">
                <span className="shrink-0 overflow-hidden rounded-full block-8 inline-8">
                    <UserAvatar name={broker.name} imageUrl={broker.avatarUrl} size="fill" />
                </span>
                <div className="flex flex-col gap-1 min-inline-0">
                    <p className="truncate font-display text-sm font-medium text-ink capitalize">
                        {broker.name}
                    </p>
                    <VerificationStatus
                        state={broker.verificationState}
                        profileCompletion={broker.profileCompletion}
                    />
                </div>
            </div>
        </DropdownMenuLabel>
    );
}

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

function MobileProfileLink({ broker }: { broker: BrokerProfileMenuBroker }) {
    return (
        <Link
            href={PROFILE_HREF}
            aria-label="Profile"
            className="flex scale-[0.96] items-center gap-1 ps-0 pe-1 text-ink-muted sm:hidden"
        >
            <span className="overflow-hidden rounded-full block-control-lg inline-control-lg">
                <UserAvatar name={broker.name} imageUrl={broker.avatarUrl} size="fill" />
            </span>
        </Link>
    );
}

function DesktopProfileDropdown({
    broker,
    onShortcutsOpen,
    tooltipLabel,
    open,
    onOpenChange,
}: BrokerProfileMenuProps) {
    const { handleLogout, isLoggingOut } = useLogoutHandler();

    const publicProfileUrl = broker.publicSlug ? brokerPublicProfileUrl(broker.publicSlug) : null;

    const trigger = (
        <div className="flex items-center justify-center">
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="md"
                        aria-label="Account menu"
                        className="
                          scale-[0.96] gap-1 ps-0 pe-1 text-ink-muted
                          hover:bg-transparent hover:text-ink
                          data-popup-open:text-ink
                        "
                    />
                }
            >
                <span className="overflow-hidden rounded-full block-control-lg inline-control-lg">
                    <UserAvatar name={broker.name} imageUrl={broker.avatarUrl} size="fill" />
                </span>
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

                <DropdownMenuContent align="end" sideOffset={14} className={cn(menuSurfaceClass)}>
                    <DropdownMenuGroup>
                        <ProfileMenuHeader broker={broker} />
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="mx-0! my-2.5 bg-border-warm inline-full!" />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className={itemClass}
                            render={<Link href={PROFILE_HREF} />}
                        >
                            <User
                                aria-hidden
                                className="shrink-0 block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span className="flex-1 min-inline-0">My profile</span>
                            <ShortcutHint shortcutId="profile" />
                        </DropdownMenuItem>

                        {publicProfileUrl ? (
                            <DropdownMenuItem
                                className={itemClass}
                                render={
                                    <a
                                        href={publicProfileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    />
                                }
                            >
                                <ExternalLink
                                    aria-hidden
                                    className="shrink-0 block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                <span className="flex-1 min-inline-0">Preview public profile</span>
                            </DropdownMenuItem>
                        ) : null}

                        {broker.verificationState !== "VERIFIED" ? (
                            <DropdownMenuItem
                                className={itemClass}
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

                    <DropdownMenuSeparator className="mx-0! my-2.5 bg-border-warm inline-full!" />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className={itemClass}
                            render={<Link href={SETTINGS_HREF} />}
                        >
                            <Settings
                                aria-hidden
                                className="shrink-0 block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span className="flex-1 min-inline-0">Settings</span>
                            <ShortcutHint shortcutId="settings" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="mx-0! my-2.5 bg-border-warm inline-full!" />

                    <DropdownMenuGroup>
                        <DropdownMenuItem className={itemClass} onClick={() => onShortcutsOpen?.()}>
                            <Command
                                aria-hidden
                                className="shrink-0 block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span className="flex-1 min-inline-0">Keyboard shortcuts</span>
                            <ShortcutHint shortcutId="shortcuts_cheatsheet" />
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className={itemClass}
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
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="mx-0! my-2.5 bg-border-warm inline-full!" />

                    <DropdownMenuGroup>
                        <HoldToLogout disabled={isLoggingOut} onComplete={handleLogout} />
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function BrokerProfileMenu(props: BrokerProfileMenuProps) {
    return (
        <>
            <MobileProfileLink broker={props.broker} />
            <DesktopProfileDropdown {...props} />
        </>
    );
}
