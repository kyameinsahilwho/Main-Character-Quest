"use client";

import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";

interface OverallProgressProps {
  completionPercentage: number;
  isInitialLoad: boolean;
}

export default function OverallProgress({ completionPercentage, isInitialLoad }: OverallProgressProps) {
  return (
    <div className="sticky right-0 top-0 h-screen w-12 bg-card/50 border-l border-border flex flex-col items-center justify-center p-2">
      <div className="flex flex-col items-center justify-center h-full w-full">
        {isInitialLoad ? <Skeleton className="h-full w-full" /> : (
            <>
                <div className="relative h-full w-6">
                    <Progress value={completionPercentage} className="absolute top-0 left-0 h-full w-full [&>div]:bg-primary" orientation="vertical" />
                </div>
                <span className="mt-2 font-bold text-sm text-foreground">{completionPercentage}%</span>
            </>
        )}
      </div>
    </div>
  );
}

declare module "react" {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      orientation?: 'horizontal' | 'vertical';
    }
  }