import { Logo } from "@/components/shared/logo";

export function AuthShell({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="bg-canvas min-block-svh md:grid md:grid-cols-[3fr_2fr]">
            <div className="relative hidden bg-surface-muted md:block">
                <div className="absolute inset-s-8 inset-bs-8">
                    <Logo />
                </div>
            </div>
            <div className="flex flex-col px-4 py-10 block-full sm:px-8">
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
