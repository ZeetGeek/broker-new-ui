import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { TestLab } from "@/components/dev-tools/test-lab";
import { ThemeProvider } from "@/components/theme-provider";

import { ProgressProvider } from "@/providers/progress-provider";
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
            className={cn("light font-sans antialiased", fontVariables)}
            style={{ colorScheme: "light" }}
        >
            <body>
                <StoreProvider>
                    <QueryProvider>
                        <ThemeProvider>
                            <ProgressProvider>
                                {children}
                                <TestLab />
                            </ProgressProvider>
                        </ThemeProvider>
                    </QueryProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
