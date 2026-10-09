import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";

import { QueryProvider } from "@/providers/query-provider";
import { StoreProvider } from "@/providers/store-provider";

import "./globals.css";
import "./common.scss";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn("font-sans antialiased", fontVariables)}
        >
            <body>
                <StoreProvider>
                    <QueryProvider>
                        <ThemeProvider>{children}</ThemeProvider>
                    </QueryProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
