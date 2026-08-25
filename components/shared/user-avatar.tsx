"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";

import { cn } from "@/lib/utils";

const AVATAR_BG_COLORS = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
] as const;

function avatarBgFromName(name: string): (typeof AVATAR_BG_COLORS)[number] {
    const normalized = name.trim().toLowerCase();
    let hash = 0;

    for (let i = 0; i < normalized.length; i++) {
        hash = (hash << 5) - hash + normalized.charCodeAt(i);
        hash |= 0;
    }

    return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

const avatarVariants = cva("overflow-hidden rounded-full px-1 pbs-[2px]", {
    variants: {
        size: {
            sm: "block-control-sm inline-control-sm",
            md: "block-control-md inline-control-md",
            lg: "block-control-xl inline-control-xl",
            fill: "block-full inline-full",
        },
    },
    defaultVariants: {
        size: "md",
    },
});

export type UserAvatarProps = VariantProps<typeof avatarVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
};

export function UserAvatar({ name, imageUrl, size, className }: UserAvatarProps) {
    return (
        <Avatar className={cn(avatarVariants({ size }), avatarBgFromName(name), className)}>
            {imageUrl ? <AvatarImage src={imageUrl} alt={name} className="object-cover" /> : null}
            <AvatarFallback
                name={name}
                className="pbs-1 block-full inline-full"
                facehashProps={{
                    className: "size-full text-ink",
                    variant: "solid",
                    intensity3d: "none",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
