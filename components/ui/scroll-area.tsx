"use client"

import * as React from "react"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="
          rounded-[inherit] transition-[color,box-shadow] outline-none block-full inline-full
          focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1
        "
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        `
          group/scroll-area-scrollbar flex touch-none bg-transparent p-0 transition-colors
          select-none
          data-horizontal:flex-col data-horizontal:border-bs data-horizontal:border-bs-transparent
          data-horizontal:block-1.5
          data-vertical:border-s data-vertical:border-s-transparent data-vertical:block-full
          data-vertical:inline-1.5
        `,
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="
          relative flex-1 rounded-full bg-brand/35 transition-colors duration-160 ease-out
          group-hover/scroll-area-scrollbar:bg-brand/55
          hover:bg-brand
        "
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
