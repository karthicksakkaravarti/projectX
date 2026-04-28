"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import React, { useMemo } from "react"

export type TextShimmerProps = {
  children: string
  as?: React.ElementType
  className?: string
  duration?: number
  spread?: number
}

export function TextShimmer({
  children,
  as: Component = "span",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion(
    Component as React.ComponentType<React.HTMLAttributes<HTMLElement>>
  )

  const dynamicSpread = useMemo(
    () => children.length * spread,
    [children, spread]
  )

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        "[--base-color:theme(colors.zinc.500)] [--base-gradient-color:theme(colors.zinc.900)]",
        "dark:[--base-color:theme(colors.zinc.500)] dark:[--base-gradient-color:theme(colors.zinc.100)]",
        "[background-repeat:no-repeat,padding-box]",
        "[--bg:linear-gradient(90deg,transparent_calc(50%-var(--spread)),var(--base-gradient-color),transparent_calc(50%+var(--spread)))]",
        "[background-image:var(--bg),linear-gradient(var(--base-color),var(--base-color))]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundSize: "250% 100%, auto",
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  )
}
