"use client";

import { cn } from "@/lib/utils";
import { BELT_COLORS, BELT_NAMES, STRIPE_NAMES } from "@/types";
import type { Belt, Stripe } from "@/generated/prisma";

interface BeltBadgeProps {
  belt: Belt;
  stripe?: Stripe;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showStripe?: boolean;
  className?: string;
}

export function BeltBadge({
  belt,
  stripe,
  size = "md",
  showName = true,
  showStripe = false,
  className,
}: BeltBadgeProps) {
  const color = BELT_COLORS[belt];
  const name = BELT_NAMES[belt];
  const stripeName = stripe ? STRIPE_NAMES[stripe] : null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Determinar si el cinturon es blanco para usar borde
  const isWhite = belt === "BLANCA";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex-shrink-0",
          sizeClasses[size],
          isWhite && "border border-gray-300 dark:border-gray-600"
        )}
        style={{ backgroundColor: color }}
        title={`Cinturón ${name}`}
      />
      {showName && (
        <span className={cn("font-medium", textSizeClasses[size])}>
          {name}
          {showStripe && stripeName && (
            <span className="text-muted-foreground font-normal ml-1">
              ({stripeName})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

interface BeltIndicatorProps {
  belt: Belt;
  stripe?: Stripe;
  className?: string;
}

export function BeltIndicator({ belt, stripe, className }: BeltIndicatorProps) {
  const color = BELT_COLORS[belt];
  const isWhite = belt === "BLANCA";
  const stripeCount = stripe
    ? ["CERO", "UNO", "DOS", "TRES", "CUATRO"].indexOf(stripe)
    : 0;

  return (
    <div
      className={cn(
        "relative h-3 w-16 rounded-sm overflow-hidden",
        isWhite && "border border-gray-300 dark:border-gray-600",
        className
      )}
      style={{ backgroundColor: color }}
      title={`${BELT_NAMES[belt]} - ${stripeCount} grados`}
    >
      {/* Stripes */}
      <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5">
        {Array.from({ length: stripeCount }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-1 bg-white/90 rounded-[1px]"
          />
        ))}
      </div>
    </div>
  );
}
