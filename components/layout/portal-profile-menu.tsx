"use client";

import {
    type ComponentProps,
    createContext,
    type ReactElement,
    type ReactNode,
    useContext,
    useRef,
    useState,
} from "react";

import { useRouter } from "@/lib/navigation";
import { getShortcut, type ShortcutId, type ShortcutPortal } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { LogoutMenuItem } from "@/components/layout/logout-menu-item";
import toast from "@/components/shared/app-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PropertyMenuIcon as AccountMenuIcon } from "@/components/shared/icons";
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useShortcutDisplayKeys } from "@/features/shortcuts/use-shortcut-display-keys";
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
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted/50!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted/50!
  **:data-[slot$=-item]:focus:text-ink!
  **:data-[slot$=-item]:aria-[current=page]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:aria-[current=page]:focus:bg-surface-muted!
  **:data-[variant=destructive]:data-highlighted:bg-danger-soft!
  **:data-[variant=destructive]:data-highlighted:text-danger!
  **:data-[variant=destructive]:focus:bg-danger-soft!
  **:data-[variant=destructive]:focus:text-danger!
  **:data-[slot=dropdown-menu-separator]:-mx-1.5!
`;

const MobileProfileContext = createContext<{
    close: () => void;
    act: (action: () => void) => void;
} | null>(null);

export function PortalProfileMenuGroup({ children }: { children: ReactNode }) {
    const mobile = useContext(MobileProfileContext);
    return mobile ? (
        <div className={mobileActionGroupClass}>{children}</div>
    ) : (
        <DropdownMenuGroup>{children}</DropdownMenuGroup>
    );
}

export function PortalProfileMenuItem({
    children,
    render,
    onClick,
    disabled,
    className,
    active = false,
    ...props
}: Omit<ComponentProps<typeof DropdownMenuItem>, "render" | "onClick"> & {
    render?: ReactElement;
    onClick?: () => void;
    active?: boolean;
}) {
    const mobile = useContext(MobileProfileContext);
    const activeClass = active && "bg-surface-muted! font-semibold! text-ink! [&_svg]:text-ink!";
    if (!mobile)
        return (
            <DropdownMenuItem
                {...props}
                render={render}
                onClick={onClick}
                disabled={disabled}
                aria-current={active ? "page" : undefined}
                className={cn(className, activeClass)}
            >
                {children}
            </DropdownMenuItem>
        );
    return (
        <Button
            variant="ghost"
            nativeButton={!render}
            render={render}
            disabled={disabled}
            aria-current={active ? "page" : undefined}
            className={cn(
                mobileActionClass,
                "justify-start",
                !active && "hover:bg-surface-muted/50! focus-visible:bg-surface-muted/50!",
                activeClass,
            )}
            onClick={() => {
                if (render) {
                    mobile.close();
                    onClick?.();
                } else mobile.act(() => onClick?.());
            }}
        >
            {children}
        </Button>
    );
}

export function PortalProfileMenuSeparator() {
    const mobile = useContext(MobileProfileContext);
    if (mobile) return null;
    return <DropdownMenuSeparator className="my-1" />;
}

export function PortalProfileShortcutHint({
    shortcutId,
    destructive = false,
    /**
     * Profile menu only shows shortcuts flagged `showInProfileMenu`.
     * Pass true for other shared menus (e.g. nav More) that should show any bound shortcut.
     */
    showWhenAvailable = false,
    portal = "broker",
}: {
    shortcutId: ShortcutId;
    destructive?: boolean;
    showWhenAvailable?: boolean;
    portal?: ShortcutPortal;
}) {
    const shortcut = getShortcut(shortcutId, portal);
    const displayKeys = useShortcutDisplayKeys(shortcut);
    if (!shortcut) return null;
    if (!showWhenAvailable && !shortcut.showInProfileMenu) return null;

    return (
        <KbdGroup className="ms-auto hidden gap-0.5 sm:inline-flex pointer-coarse:hidden">
            {displayKeys.map((key) => (
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
            toast.message("signed-out");
            router.replace("/login");
        } catch {
            dispatch(resetDashboard());
            toast.message("signed-out");
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
                <span className="hidden flex-col items-start gap-0.5 text-start min-inline-0 lg:flex">
                    <span className="body-sm truncate leading-tight font-semibold text-ink max-inline-36">
                        {userName}
                    </span>
                    <span className="body-xs leading-tight text-ink-muted">{roleLabel}</span>
                </span>
                <AccountMenuIcon
                    name="chevron-down"
                    aria-hidden="true"
                    className="
                      hidden transition-transform duration-160 block-3.5 inline-3.5 group-data-popup-open:rotate-180
                      lg:block
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
    const mobile = useMobileMenu();
    const [localOpen, setLocalOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const afterClose = useRef<(() => void) | null>(null);
    const { handleLogout, isLoggingOut } = useLogoutHandler();
    const drawerOpen = open ?? localOpen;
    const setOpen = (value: boolean) => {
        setLocalOpen(value);
        onOpenChange?.(value);
    };
    if (mobile) {
        return (
            <>
                <MobileActionDrawer
                    open={drawerOpen}
                    onOpenChange={setOpen}
                    onOpenChangeComplete={(value) => {
                        if (!value) {
                            const action = afterClose.current;
                            afterClose.current = null;
                            action?.();
                        }
                    }}
                    title="Account"
                    description={`${userName} · ${roleLabel}`}
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon-md"
                            className="shrink-0 rounded-full p-0"
                            aria-label={`Account menu for ${userName}`}
                        >
                            <UserAvatar name={userName} imageUrl={userAvatarUrl} size="md" />
                        </Button>
                    }
                >
                    <MobileProfileContext.Provider
                        value={{
                            close: () => setOpen(false),
                            act: (action) => {
                                afterClose.current = action;
                                setOpen(false);
                            },
                        }}
                    >
                        {children}
                    </MobileProfileContext.Provider>
                    <div className={mobileActionGroupClass}>
                        <button
                            type="button"
                            className={mobileActionClass}
                            data-destructive="true"
                            disabled={isLoggingOut}
                            onClick={() => {
                                afterClose.current = () => setConfirmLogout(true);
                                setOpen(false);
                            }}
                        >
                            <AccountMenuIcon name="logout" aria-hidden />
                            Log out
                        </button>
                    </div>
                </MobileActionDrawer>
                <ConfirmDialog
                    open={confirmLogout}
                    onOpenChange={setConfirmLogout}
                    title="Log out?"
                    confirmLabel="Log out"
                    cancelLabel="Stay signed in"
                    busy={isLoggingOut}
                    onConfirm={() => void handleLogout()}
                >
                    <p className="body text-ink-muted">You can sign back in any time.</p>
                </ConfirmDialog>
            </>
        );
    }
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
