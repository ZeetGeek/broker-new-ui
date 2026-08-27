"use client";

import type { ReactNode } from "react";
import toast from "react-hot-toast";

import { addCollection, Icon } from "@iconify/react/offline";

import { authApi } from "@/lib/api/auth";

import { Button } from "@/components/ui/button";

import type { Portal } from "./portal";
import brands from "./thesvg-color-brands.json";

addCollection(brands as Parameters<typeof addCollection>[0]);

function BrandIcon({ icon }: { icon: "thesvg-color:google" | "thesvg-color:apple-light" }) {
    return (
        <Icon icon={icon} width={20} height={20} className="block-5 inline-5" aria-hidden="true" />
    );
}

function SocialButton({
    children,
    mark,
    onClick,
}: {
    children: ReactNode;
    mark: ReactNode;
    onClick?: () => void;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClick}
            className="
              gap-3 border-border-warm bg-surface font-medium text-ink shadow-sm inline-full
              hover:bg-surface-muted
            "
        >
            {mark}
            {children}
        </Button>
    );
}

export function SocialAuthButtons({
    action,
    role = "broker",
}: {
    action: "Sign in" | "Sign up";
    role?: Portal;
}) {
    function handleGoogle() {
        window.location.href = authApi.googleStartUrl({ role });
    }

    function handleApple() {
        toast("Apple sign-in is coming soon");
    }

    return (
        <div className="flex flex-col gap-3">
            <SocialButton mark={<BrandIcon icon="thesvg-color:google" />} onClick={handleGoogle}>
                {action} with Google
            </SocialButton>
            <SocialButton
                mark={<BrandIcon icon="thesvg-color:apple-light" />}
                onClick={handleApple}
            >
                {action} with Apple
            </SocialButton>
        </div>
    );
}
