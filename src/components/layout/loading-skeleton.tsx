import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
            <h2 className="text-xl font-bold font-headline mb-4"><Skeleton className="h-8 w-32" /></h2>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
}
