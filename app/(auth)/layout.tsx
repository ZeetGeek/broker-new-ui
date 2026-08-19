import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 py-10 block-svh">
            <Logo />
            {children}
        </div>
    );
}
