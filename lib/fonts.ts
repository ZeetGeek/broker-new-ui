import { Geist, Geist_Mono, Inter } from "next/font/google";
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const heading = Geist({ subsets: ["latin"], variable: "--font-heading" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const fontVariables = `${sans.variable} ${heading.variable} ${mono.variable}`;
