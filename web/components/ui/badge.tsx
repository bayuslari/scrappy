import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input text-foreground",
        // Vibrant solid colors for job metadata.
        emerald: "bg-emerald-500 text-white",
        lime: "bg-lime-500 text-white",
        amber: "bg-amber-500 text-white",
        red: "bg-red-500 text-white",
        sky: "bg-sky-500 text-white",
        violet: "bg-violet-500 text-white",
        indigo: "bg-indigo-600 text-white",
        rose: "bg-rose-500 text-white",
        slate: "bg-slate-400 text-white dark:bg-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
