"use client";

import type { ReactNode } from "react";

import { addCollection, Icon } from "@iconify/react/offline";

import { Button } from "@/components/ui/button";

import brands from "./thesvg-color-brands.json";

addCollection(brands as Parameters<typeof addCollection>[0]);

function BrandIcon({ icon }: { icon: "thesvg-color:google" | "thesvg-color:apple-light" }) {
    return (
        <Icon icon={icon} width={20} height={20} className="block-5 inline-5" aria-hidden="true" />
    );
}

function SocialButton({ children, mark }: { children: ReactNode; mark: ReactNode }) {
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
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

export function SocialAuthButtons({ action }: { action: "Sign in" | "Sign up" }) {
    return (
        <div className="flex flex-col gap-3">
            <SocialButton mark={<BrandIcon icon="thesvg-color:google" />}>
                {action} with Google
            </SocialButton>
            <SocialButton mark={<BrandIcon icon="thesvg-color:apple-light" />}>
                {action} with Apple
            </SocialButton>
        </div>
    );
}
