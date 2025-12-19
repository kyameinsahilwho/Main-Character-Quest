"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-full overflow-hidden rounded-full bg-muted/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]",
      props.orientation === 'vertical' && "h-full w-6 flex-col",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-lime-500 to-green-600 transition-all rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
      style={{ 
        transform: props.orientation === 'vertical' 
          ? `translateY(${100 - (value || 0)}%)` 
          : `translateX(-${100 - (value || 0)}%)`
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
