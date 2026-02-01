import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
    return (
        <div className="w-full space-y-4 animate-in fade-in duration-300">
            {/* Card skeleton */}
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-2/3 rounded-lg" />
                <Skeleton className="h-4 w-1/3 rounded-lg" />
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
                <Skeleton className="h-5 w-1/2 rounded-lg" />
                <Skeleton className="h-4 w-2/5 rounded-lg" />
            </div>
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3 opacity-60">
                <Skeleton className="h-5 w-3/5 rounded-lg" />
                <Skeleton className="h-4 w-1/4 rounded-lg" />
            </div>
        </div>
    );
}
