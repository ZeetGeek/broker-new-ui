"use client";

import { createContext, useContext, useEffect } from "react";

export const PersonDetailsContext = createContext<((href: string, name: string) => boolean) | null>(
    null,
);
export const usePersonDetails = () => useContext(PersonDetailsContext);

export const PersonDetailsWorkingContext = createContext<((working: boolean) => void) | null>(null);

export function usePersonDetailsWorking(working: boolean) {
    const setWorking = useContext(PersonDetailsWorkingContext);
    useEffect(() => {
        setWorking?.(working);
        return () => setWorking?.(false);
    }, [working, setWorking]);
}
