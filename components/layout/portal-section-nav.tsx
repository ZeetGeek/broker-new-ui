"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

const PortalSectionNavStateContext = createContext<ReactNode | null>(null);
const PortalSectionNavSetterContext = createContext<((node: ReactNode | null) => void) | null>(
    null,
);

export function PortalSectionNavProvider({ children }: { children: ReactNode }) {
    const [sectionNav, setSectionNav] = useState<ReactNode | null>(null);

    return (
        <PortalSectionNavSetterContext.Provider value={setSectionNav}>
            <PortalSectionNavStateContext.Provider value={sectionNav}>
                {children}
            </PortalSectionNavStateContext.Provider>
        </PortalSectionNavSetterContext.Provider>
    );
}

export function usePortalSectionNav() {
    return useContext(PortalSectionNavStateContext);
}

/** Renders children into the portal header section row (below logo + nav). */
export function PortalSectionNav({ children }: { children: ReactNode }) {
    const setSectionNav = useContext(PortalSectionNavSetterContext);

    useEffect(() => {
        if (!setSectionNav) {
            return undefined;
        }

        setSectionNav(children);
        return () => setSectionNav(null);
    }, [children, setSectionNav]);

    return null;
}
