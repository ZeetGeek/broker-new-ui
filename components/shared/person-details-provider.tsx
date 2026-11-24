"use client";

import { type ReactNode, useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import {
    type PersonDetailsTarget,
    personDetailsTarget,
} from "@/lib/contacts/person-details-target";

import toast from "@/components/shared/app-toast";
import {
    PersonDetailsContext,
    PersonDetailsWorkingContext,
} from "@/components/shared/person-details-context";

import { useAppSelector } from "@/store/hooks";

const PersonDetailsOverlay = dynamic(
    () =>
        import("@/features/contacts/person-details-overlay").then(
            (module) => module.PersonDetailsOverlay,
        ),
    { ssr: false },
);

export function PersonDetailsProvider({
    children,
    portal,
}: {
    children: ReactNode;
    portal: "broker" | "owner";
}) {
    const pathname = usePathname();
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const location = `${accountId}:${pathname}`;
    const [route, setRoute] = useState(location);
    const [selection, setSelection] = useState<{
        target: PersonDetailsTarget;
        version: number;
    } | null>(null);
    const opener = useRef<HTMLElement | null>(null);
    const working = useRef(false);
    const setWorking = useCallback((value: boolean) => {
        working.current = value;
    }, []);
    const version = useRef(0);
    // A deliberate page change closes the overlay; opening/closing it never changes the route.
    if (route !== location) {
        setRoute(location);
        setSelection(null);
    }
    const open = useCallback(
        (href: string, name: string) => {
            const target = personDetailsTarget(href, name, portal);
            if (!target) return false;
            if (selection && working.current) {
                toast("Finish or close this form before opening another contact.", {
                    id: "person-form-active",
                });
                return true;
            }
            if (!selection || !opener.current?.isConnected)
                opener.current =
                    document.activeElement instanceof HTMLElement ? document.activeElement : null;
            working.current = false;
            setSelection({ target, version: ++version.current });
            return true;
        },
        [portal, selection],
    );
    const close = useCallback(() => {
        setSelection(null);
        working.current = false;
        const element = opener.current;
        window.requestAnimationFrame(() => {
            if (element?.isConnected) element.focus({ preventScroll: true });
        });
    }, []);
    return (
        <PersonDetailsContext value={open}>
            <PersonDetailsWorkingContext value={setWorking}>
                {children}
                {selection ? (
                    <PersonDetailsOverlay
                        key={selection.version}
                        target={selection.target}
                        onClose={close}
                    />
                ) : null}
            </PersonDetailsWorkingContext>
        </PersonDetailsContext>
    );
}
