"use client";

import { cn } from "@/lib/utils";

interface NotificationItemProps {
    notification: any;
    onMarkRead: () => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "friend_request": return "👋";
            case "friend_accepted": return "🤝";
            case "cheer_received": return "🎉";
            case "challenge_invite": return "🎯";
            case "challenge_update": return "📊";
            case "milestone_friend": return "🏆";
            default: return "🔔";
        }
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                !notification.seen && "bg-violet-500/5"
            )}
            onClick={onMarkRead}
        >
            <div className="text-2xl shrink-0">
                {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm",
                    !notification.seen && "font-medium"
                )}>
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(notification.createdAt)}
                </p>
            </div>
            {!notification.seen && (
                <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-2" />
            )}
        </div>
    );
}
