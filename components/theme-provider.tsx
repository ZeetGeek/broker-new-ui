"use client";

import * as React from "react";

import { MotionConfig } from "motion/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            {...props}
        >
            <MotionConfig reducedMotion="user">
                {children}
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        className: "body font-sans!",
                        style: {
                            background: "var(--color-surface)",
                            color: "var(--color-ink)",
                            border: "1px solid var(--color-border-warm)",
                            borderRadius: "var(--radius-inner)",
                            boxShadow: "var(--shadow-md)",
                        },
                    }}
                />
            </MotionConfig>
        </NextThemesProvider>
    );
}

export { ThemeProvider };
