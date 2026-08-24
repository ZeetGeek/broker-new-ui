"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";

import { cn } from "@/lib/utils";

const avatarVariants = cva("overflow-hidden rounded-full bg-emerald-500 px-1 pbs-[2px]", {
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
        <Avatar className={cn(avatarVariants({ size }), className)}>
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
