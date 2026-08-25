"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";

import { cn } from "@/lib/utils";

const AVATAR_BG_COLORS = [
    "bg-red-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-sky-400",
    "bg-blue-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-purple-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400",
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
                    intensity3d: "dramatic",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
