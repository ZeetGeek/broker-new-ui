import { Logo } from "@/components/shared/logo";

export function AuthShell({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="bg-canvas p-1 min-block-svh md:grid md:grid-cols-[3fr_2fr] md:gap-1">
            <div className="relative hidden md:block">
                <div className="rounded-card bg-brand-text p-5 block-full inline-full">
                    <div className="absolute inset-s-8 inset-bs-8">
                        <Logo variant="inverse" />
                    </div>
                </div>
            </div>
            <div
                className="
                  flex flex-col rounded-card border border-border-warm bg-surface-muted px-4 py-10
                  block-full
                  sm:px-8
                "
            >
                <div className="md:hidden">
                    <Logo />
                </div>
                <div className="relative flex flex-1 flex-col items-center justify-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
