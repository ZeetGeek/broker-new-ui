"use client";

import { createContext, useContext } from "react";

export const PersonDetailsContext = createContext<((href: string, name: string) => boolean) | null>(
    null,
);
export const usePersonDetails = () => useContext(PersonDetailsContext);
