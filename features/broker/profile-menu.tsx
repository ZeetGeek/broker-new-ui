"use client";

import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    BadgeCheck,
    Check,
    ChevronDown,
    Command,
    ExternalLink,
    LifeBuoy,
    Link2,
    LogOut,
    Settings,
    ShieldCheck,
    User,
} from "lucide-react";

import { SUPPORT_WHATSAPP_URL } from "@/config/constants";
import { SITE_URL } from "@/config/index";
import { formatPhoneIn } from "@/lib/format/phone";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { BrokerVerificationState } from "@/features/broker/map-profile-menu";

import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

export type BrokerProfileMenuBroker = {
    name: string;
    phone: string;
    avatarUrl?: string;
    verificationState: BrokerVerificationState;
    profileCompletion: number;
    publicSlug?: string | null;
};

export type BrokerProfileMenuProps = {
    broker: BrokerProfileMenuBroker;
    onShortcutsOpen?: () => void;
    tooltipLabel?: string;
};

const PROFILE_HREF = "/broker/profile";
const SETTINGS_HREF = "/broker/settings";
const VERIFICATION_HREF = "/broker/verification";

const itemClass = `
  h-9 cursor-pointer gap-2.5 rounded-inner px-3 body-sm font-medium text-ink
  focus:bg-surface-muted focus:text-ink
`;

const menuSurfaceClass = `
  t-dropdown animate-none! min-inline-[16.25rem] rounded-inner border border-border-warm
  bg-surface p-0 text-ink shadow-none ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
`;

function brokerPublicProfileUrl(slug: string) {
    return `${SITE_URL.replace(/\/$/, "")}/b/${slug}`;
}

function MenuKbd({ children }: { children: ReactNode }) {
    return (
        <kbd
            className="
              inline-flex min-inline-4 items-center justify-center rounded-sm border
              border-border-warm bg-surface-muted px-1.5 py-0.5 font-sans text-[10px] font-medium
              tracking-normal text-ink-muted
            "
        >
            {children}
        </kbd>
    );
}

function ShortcutHint({ shortcutId }: { shortcutId: ShortcutId }) {
    const shortcut = getShortcut(shortcutId);
    if (!shortcut?.showInProfileMenu) return null;

    return (
        <span className="ms-auto hidden items-center gap-0.5 sm:inline-flex">
            {shortcut.keys.map((key) => (
                <MenuKbd key={key}>{key}</MenuKbd>
            ))}
        </span>
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
            <div
                className="
                  flex items-center gap-1.5 rounded-inner bg-surface-muted px-2.5 py-1.5 body-xs
                  font-medium text-brand
                "
            >
                <BadgeCheck aria-hidden className="block-4 inline-4" strokeWidth={2} />
                Verified
            </div>
        );
    }

    if (state === "PENDING_VERIFICATION") {
        return (
            <div
                className="
                  rounded-inner bg-surface-muted px-2.5 py-1.5 body-xs font-medium text-ink-muted
                "
            >
                Under review
            </div>
        );
    }

    const clamped = Math.min(100, Math.max(0, profileCompletion));

    return (
        <div className="rounded-inner bg-surface-muted px-2.5 py-2">
            <div className="flex items-center justify-between gap-2 body-xs font-medium text-ink">
                <span>Complete your profile</span>
                <span className="tabular text-ink-muted">{clamped}%</span>
            </div>
            <div
                className="mbs-1.5 overflow-hidden rounded-full bg-border-warm block-1"
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Profile ${clamped}% complete`}
            >
                <div
                    className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}

function ProfileMenuHeader({ broker }: { broker: BrokerProfileMenuBroker }) {
    const phoneDisplay =
        broker.phone.replace(/\D/g, "").slice(-10).length === 10
            ? formatPhoneIn(broker.phone)
            : broker.phone;

    return (
        <DropdownMenuLabel className="flex flex-col gap-2.5 p-3 font-normal text-ink">
            <div className="flex items-center gap-2.5">
                <span className="overflow-hidden rounded-full block-10 inline-10 shrink-0">
                    <UserAvatar name={broker.name} imageUrl={broker.avatarUrl} size="fill" />
                </span>
                <div className="min-inline-0">
                    <p className="truncate font-display text-sm font-medium text-ink capitalize">
                        {broker.name}
                    </p>
                    {phoneDisplay ? (
                        <p className="tabular truncate body-xs text-ink-muted">{phoneDisplay}</p>
                    ) : null}
                </div>
            </div>
            <VerificationStatus
                state={broker.verificationState}
                profileCompletion={broker.profileCompletion}
            />
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
            className="
              flex scale-[0.96] items-center gap-1 ps-0 pe-1 text-ink-muted
              sm:hidden
            "
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
}: BrokerProfileMenuProps) {
    const { handleLogout, isLoggingOut } = useLogoutHandler();
    const [linkCopied, setLinkCopied] = useState(false);

    const publicProfileUrl = broker.publicSlug
        ? brokerPublicProfileUrl(broker.publicSlug)
        : null;

    async function handleCopyProfileLink() {
        if (!publicProfileUrl) {
            toast.error("Public profile link is not ready yet");
            return;
        }

        try {
            await navigator.clipboard.writeText(publicProfileUrl);
            setLinkCopied(true);
            toast.success("Profile link copied");
            window.setTimeout(() => setLinkCopied(false), 1500);
        } catch {
            toast.error("Could not copy link");
        }
    }

    const trigger = (
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
    );

    return (
        <div className="hidden sm:block">
            <DropdownMenu>
                {tooltipLabel ? (
                    <Tooltip>
                        <TooltipTrigger render={trigger} />
                        <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
                    </Tooltip>
                ) : (
                    trigger
                )}

                <DropdownMenuContent align="end" sideOffset={8} className={cn(menuSurfaceClass)}>
                    <DropdownMenuGroup>
                        <ProfileMenuHeader broker={broker} />
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-border-warm" />

                    <DropdownMenuGroup className="p-1.5">
                        <DropdownMenuItem className={itemClass} render={<Link href={PROFILE_HREF} />}>
                            <User aria-hidden className="block-4 inline-4 shrink-0" strokeWidth={1.75} />
                            <span className="min-inline-0 flex-1">My profile</span>
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
                                    className="block-4 inline-4 shrink-0"
                                    strokeWidth={1.75}
                                />
                                <span className="min-inline-0 flex-1">Preview public profile</span>
                            </DropdownMenuItem>
                        ) : null}

                        <DropdownMenuItem
                            className={itemClass}
                            disabled={!publicProfileUrl}
                            onClick={() => void handleCopyProfileLink()}
                        >
                            {linkCopied ? (
                                <Check
                                    aria-hidden
                                    className="block-4 inline-4 shrink-0 text-brand"
                                    strokeWidth={1.75}
                                />
                            ) : (
                                <Link2
                                    aria-hidden
                                    className="block-4 inline-4 shrink-0"
                                    strokeWidth={1.75}
                                />
                            )}
                            <span className="min-inline-0 flex-1">Copy profile link</span>
                        </DropdownMenuItem>

                        {broker.verificationState !== "VERIFIED" ? (
                            <DropdownMenuItem
                                className={itemClass}
                                render={<Link href={VERIFICATION_HREF} />}
                            >
                                <ShieldCheck
                                    aria-hidden
                                    className="block-4 inline-4 shrink-0"
                                    strokeWidth={1.75}
                                />
                                <span className="min-inline-0 flex-1">Verification & RERA</span>
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-border-warm" />

                    <DropdownMenuGroup className="p-1.5">
                        <DropdownMenuItem className={itemClass} render={<Link href={SETTINGS_HREF} />}>
                            <Settings
                                aria-hidden
                                className="block-4 inline-4 shrink-0"
                                strokeWidth={1.75}
                            />
                            <span className="min-inline-0 flex-1">Settings</span>
                            <ShortcutHint shortcutId="settings" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-border-warm" />

                    <DropdownMenuGroup className="p-1.5">
                        <DropdownMenuItem
                            className={itemClass}
                            onClick={() => onShortcutsOpen?.()}
                        >
                            <Command
                                aria-hidden
                                className="block-4 inline-4 shrink-0"
                                strokeWidth={1.75}
                            />
                            <span className="min-inline-0 flex-1">Keyboard shortcuts</span>
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
                                className="block-4 inline-4 shrink-0"
                                strokeWidth={1.75}
                            />
                            <span className="min-inline-0 flex-1">Help & support</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-border-warm" />

                    <DropdownMenuGroup className="p-1.5">
                        <DropdownMenuItem
                            className={cn(itemClass, "text-danger focus:text-danger")}
                            variant="destructive"
                            disabled={isLoggingOut}
                            onClick={() => void handleLogout()}
                        >
                            <LogOut
                                aria-hidden
                                className="block-4 inline-4 shrink-0"
                                strokeWidth={1.75}
                            />
                            <span className="min-inline-0 flex-1">
                                {isLoggingOut ? "Signing out…" : "Log out"}
                            </span>
                            <ShortcutHint shortcutId="logout" />
                        </DropdownMenuItem>
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
