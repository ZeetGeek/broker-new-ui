import { Bricolage_Grotesque, DM_Sans, Geist_Mono } from "next/font/google";

/**
 * Single place to swap fonts. Change the import + config here only —
 * `--font-sans` / `--font-heading` / `--font-mono` stay wired everywhere else
 * (globals.css `@theme inline` + base h1-h6 rule, Tailwind `font-sans` / `font-heading` / `font-mono`).
 */
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const heading = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heading" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const fontVariables = `${sans.variable} ${heading.variable} ${mono.variable}`;
