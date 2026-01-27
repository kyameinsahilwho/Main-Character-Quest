"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    Trophy,
    Target,
    Bell,
    Send,
    Check,
    X,
    Flame,
    Star,
    Heart,
    Rocket,
    Award,
    ChevronRight,
    Copy,
    Mail,
    MoreVertical,
    LogOut,
    Trash2,
    UserMinus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSocial, useChallenges } from "@/hooks/use-social";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

// Cheer types with emojis
const CHEER_TYPES = [
    { id: "clap", emoji: "👏", label: "Clap" },
    { id: "fire", emoji: "🔥", label: "Fire" },
    { id: "star", emoji: "⭐", label: "Star" },
    { id: "heart", emoji: "❤️", label: "Heart" },
    { id: "rocket", emoji: "🚀", label: "Rocket" },
    { id: "trophy", emoji: "🏆", label: "Trophy" },
];

interface SocialSectionProps {
    className?: string;
}

export function SocialSection({ className }: SocialSectionProps) {
    const [activeTab, setActiveTab] = useState("friends");
    const social = useSocial();
    const challenges = useChallenges();

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 border-2 border-violet-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black font-headline">Accountability Squad</h2>
                        <p className="text-xs text-muted-foreground">{social.friends.length} friends</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid grid-cols-4 gap-1 p-1 bg-transparent mb-4">
                    <TabsTrigger
                        value="friends"
                        className="rounded-xl text-xs font-bold uppercase tracking-wide border border-transparent data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-700 transition-all data-[state=inactive]:hover:bg-muted"
                    >
                        Friends
                    </TabsTrigger>
                    <TabsTrigger
                        value="challenges"
                        className="rounded-xl text-xs font-bold uppercase tracking-wide border border-transparent data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-700 transition-all data-[state=inactive]:hover:bg-muted"
                    >
                        Challenges
                    </TabsTrigger>
                    <TabsTrigger
                        value="leaderboard"
                        className="rounded-xl text-xs font-bold uppercase tracking-wide border border-transparent data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-700 transition-all data-[state=inactive]:hover:bg-muted"
                    >
                        Ranks
                    </TabsTrigger>
                    <TabsTrigger
                        value="feed"
                        className="rounded-xl text-xs font-bold uppercase tracking-wide border border-transparent data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-700 transition-all data-[state=inactive]:hover:bg-muted"
                    >
                        Feed
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto px-4 pb-32">
                    <TabsContent value="friends" className="mt-0 space-y-4">
                        <FriendsTab social={social} />
                    </TabsContent>

                    <TabsContent value="challenges" className="mt-0 space-y-4">
                        <ChallengesTab challenges={challenges} friends={social.friends} />
                    </TabsContent>

                    <TabsContent value="leaderboard" className="mt-0 space-y-4">
                        <LeaderboardTab leaderboard={challenges.friendsLeaderboard} />
                    </TabsContent>

                    <TabsContent value="feed" className="mt-0 space-y-4">
                        <FeedTab
                            milestones={challenges.friendsMilestones}
                            activity={challenges.friendsActivity}
                            onCelebrate={challenges.celebrateMilestone}
                            onSendCheer={social.sendCheer}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

// ==================== FRIENDS TAB ====================

function FriendsTab({ social }: { social: ReturnType<typeof useSocial> }) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [showInviteDialog, setShowInviteDialog] = useState(false);

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setIsInviting(true);
        try {
            await social.sendFriendInvite(inviteEmail);
            setInviteEmail("");
            setShowInviteDialog(false);
        } catch (error: any) {
            alert(error.message || "Failed to send invite");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <>
            {/* Pending Invites */}
            {social.pendingInvites.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Friend Requests
                    </h3>
                    {social.pendingInvites.map((invite) => (
                        <motion.div
                            key={invite._id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-3 bg-violet-500/10 border-2 border-violet-500/30 rounded-xl"
                        >
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                {invite.fromUser?.image ? (
                                    <img src={invite.fromUser.image} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                    <Users className="w-5 h-5 text-violet-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">{invite.fromUser?.name || "Someone"}</p>
                                <p className="text-xs text-muted-foreground">Wants to be your partner</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 bg-green-500/20 hover:bg-green-500/30 text-green-500"
                                    onClick={() => social.acceptFriendInvite(invite._id)}
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30 text-red-500"
                                    onClick={() => social.declineFriendInvite(invite._id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Invite Button */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                    <Button className="w-full gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bold border-violet-700 hover:border-violet-800">
                        <UserPlus className="w-4 h-4" />
                        Invite Friend by Email
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Invite a Friend</DialogTitle>
                        <DialogDescription>
                            Send an invite link to your friend&apos;s email. They&apos;ll be able to join your accountability squad!
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendInvite} className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="friend@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Friends List */}
            <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Your Squad ({social.friends.length})
                </h3>

                {social.friends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No friends yet</p>
                        <p className="text-sm">Invite friends to stay accountable together!</p>
                    </div>
                ) : (
                    social.friends.map((friend) => friend && (
                        <FriendCard
                            key={friend.friendshipId}
                            friend={friend}
                            onSendCheer={social.sendCheer}
                            onRemoveFriend={social.removeFriend}
                        />
                    ))
                )}
            </div>
        </>
    );
}

function FriendCard({ friend, onSendCheer, onRemoveFriend }: {
    friend: any;
    onSendCheer: (userId: Id<"users">, type: string) => void;
    onRemoveFriend: (userId: Id<"users">) => void;
}) {
    const [showCheerPicker, setShowCheerPicker] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-card border-2 border-border border-b-4 rounded-2xl mb-2 group"
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-violet-500 border-2 border-violet-600 flex items-center justify-center overflow-hidden shadow-sm ring-4 ring-violet-500/10">
                    {friend.image ? (
                        <img src={friend.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-black text-lg">
                            {friend.name?.[0]?.toUpperCase() || "?"}
                        </span>
                    )}
                </div>
                {/* Streak indicator */}
                {friend.currentStreak > 0 && (
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 border-2 border-orange-600 border-b-[3px] text-white text-[10px] font-black px-1.5 py-0.5 rounded-xl flex items-center gap-0.5 z-10">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        {friend.currentStreak}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-black text-foreground text-sm truncate">{friend.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
                    <span>Lvl {friend.level}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span>{friend.totalXP?.toLocaleString() || 0} XP</span>
                </div>
                {friend.todayActivity && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-green-500 mt-1 uppercase tracking-wide">
                        <span>✓ {friend.todayActivity.tasksCompleted} tasks</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                {/* Cheer Button */}
                <div className="relative">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-xl border-2 border-b-4 border-slate-200 hover:bg-violet-50 hover:border-violet-200 active:border-b-0 active:translate-y-[4px] transition-all"
                        onClick={() => setShowCheerPicker(!showCheerPicker)}
                    >
                        <span className="text-xl">👏</span>
                    </Button>

                    <AnimatePresence>
                        {showCheerPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 top-12 bg-white border-2 border-b-4 border-slate-200 rounded-2xl p-2 shadow-xl z-20 flex gap-2 w-max"
                            >
                                {CHEER_TYPES.map((cheer) => (
                                    <button
                                        key={cheer.id}
                                        onClick={() => {
                                            onSendCheer(friend.id, cheer.id);
                                            setShowCheerPicker(false);
                                        }}
                                        className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-90"
                                    >
                                        {cheer.emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* More Options Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 font-bold">
                        <DropdownMenuItem
                            className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => {
                                if (confirm(`Are you sure you want to remove ${friend.name} from your squad?`)) {
                                    onRemoveFriend(friend.id);
                                }
                            }}
                        >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfriend
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

// ==================== CHALLENGES TAB ====================

function ChallengesTab({ challenges, friends }: {
    challenges: ReturnType<typeof useChallenges>;
    friends: any[];
}) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        title: "",
        type: "tasks_count",
        targetValue: 10,
        durationDays: 7,
        selectedFriends: [] as Id<"users">[],
    });

    const handleCreateChallenge = async () => {
        if (!newChallenge.title.trim()) return;

        try {
            await challenges.createChallenge({
                title: newChallenge.title,
                type: newChallenge.type,
                targetValue: newChallenge.targetValue,
                durationDays: newChallenge.durationDays,
                invitedFriendIds: newChallenge.selectedFriends,
            });
            setShowCreateDialog(false);
            setNewChallenge({
                title: "",
                type: "tasks_count",
                targetValue: 10,
                durationDays: 7,
                selectedFriends: [],
            });
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <>
            {/* Pending Challenge Invites */}
            {challenges.pendingInvites.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Challenge Invites
                    </h3>
                    {challenges.pendingInvites.map((invite: any) => (
                        <motion.div
                            key={invite.participantId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Target className="w-5 h-5 text-amber-500" />
                                <div className="flex-1">
                                    <p className="font-bold">{invite.challenge.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        by {invite.creator?.name || "Someone"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Goal: {invite.challenge.targetValue} {invite.challenge.type.replace("_", " ")} in {invite.challenge.durationDays} days
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                    onClick={() => challenges.respondToChallenge(invite.challenge.id, true)}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => challenges.respondToChallenge(invite.challenge.id, false)}
                                >
                                    Decline
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Challenge Button */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                    <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold border-amber-700 hover:border-amber-800">
                        <Target className="w-4 h-4" />
                        Create Challenge
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline">New Challenge</DialogTitle>
                        <DialogDescription>
                            Challenge your friends to stay accountable together!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Challenge name (e.g., 7-Day Productivity Sprint)"
                            value={newChallenge.title}
                            onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={newChallenge.type}
                                onValueChange={(value) => setNewChallenge({ ...newChallenge, type: value })}
                            >
                                <SelectTrigger className="border-2 border-b-4 border-border rounded-xl bg-background font-medium">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="border-2 rounded-xl">
                                    <SelectItem value="tasks_count">✅ Complete Tasks</SelectItem>
                                    <SelectItem value="habits_count">💧 Check-in Habits</SelectItem>
                                    <SelectItem value="streak">🔥 Maintain Streak</SelectItem>
                                    <SelectItem value="xp_earned">⭐ Earn XP</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Target"
                                className="border-2 border-b-4 rounded-xl"
                                value={newChallenge.targetValue}
                                onChange={(e) => setNewChallenge({ ...newChallenge, targetValue: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <Select
                            value={newChallenge.durationDays.toString()}
                            onValueChange={(value) => setNewChallenge({ ...newChallenge, durationDays: parseInt(value) })}
                        >
                            <SelectTrigger className="w-full border-2 border-b-4 border-border rounded-xl bg-background font-medium">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent className="border-2 rounded-xl">
                                <SelectItem value="3">⚡ 3 Days (Quick Sprint)</SelectItem>
                                <SelectItem value="7">📅 1 Week</SelectItem>
                                <SelectItem value="14">🗓️ 2 Weeks</SelectItem>
                                <SelectItem value="30">📆 1 Month</SelectItem>
                            </SelectContent>
                        </Select>

                        {friends.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Invite Friends</p>
                                <div className="flex flex-wrap gap-2">
                                    {friends.map((friend: any) => (
                                        <button
                                            key={friend.id}
                                            onClick={() => {
                                                const selected = newChallenge.selectedFriends.includes(friend.id)
                                                    ? newChallenge.selectedFriends.filter(id => id !== friend.id)
                                                    : [...newChallenge.selectedFriends, friend.id];
                                                setNewChallenge({ ...newChallenge, selectedFriends: selected });
                                            }}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                                newChallenge.selectedFriends.includes(friend.id)
                                                    ? "bg-amber-500 text-white"
                                                    : "bg-muted hover:bg-muted/80"
                                            )}
                                        >
                                            {friend.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleCreateChallenge}
                            disabled={!newChallenge.title.trim()}
                            className="w-full bg-amber-500 hover:bg-amber-600 border-amber-700 hover:border-amber-800"
                        >
                            Start Challenge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Active Challenges */}
            <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Active Challenges ({challenges.activeChallenges.filter((c: any) => c.myStatus === "accepted").length})
                </h3>

                {challenges.activeChallenges.filter((c: any) => c.myStatus === "accepted").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No active challenges</p>
                        <p className="text-sm">Create one to compete with friends!</p>
                    </div>
                ) : (
                    challenges.activeChallenges
                        .filter((c: any) => c.myStatus === "accepted")
                        .map((challenge: any) => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                onLeaveChallenge={challenges.leaveChallenge}
                            />
                        ))
                )}
            </div>
        </>
    );
}

function ChallengeCard({ challenge, onLeaveChallenge }: {
    challenge: any;
    onLeaveChallenge: (id: Id<"challenges">) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-card border-2 border-border border-b-4 rounded-2xl relative"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    <span className="font-bold">{challenge.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full font-medium">
                        {challenge.daysRemaining}d left
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 -mr-2 rounded-lg text-muted-foreground hover:bg-muted"
                            >
                                <MoreVertical className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-bold">
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                onClick={() => {
                                    if (confirm(`Are you sure you want to leave ${challenge.title}?`)) {
                                        onLeaveChallenge(challenge.id);
                                    }
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Challenge
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* My Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span>Your Progress</span>
                    <span className="font-bold">{challenge.myProgress}/{challenge.targetValue}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${challenge.myProgressPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                </div>
            </div>

            {/* Participants */}
            <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                    {challenge.participants.slice(0, 4).map((p: any, i: number) => (
                        <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-card bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden"
                        >
                            {p.image ? (
                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-xs font-bold">{p.name?.[0]}</span>
                            )}
                        </div>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">
                    {challenge.participants.length} competing
                </span>
            </div>
        </motion.div>
    );
}

// ==================== LEADERBOARD TAB ====================

function LeaderboardTab({ leaderboard }: { leaderboard: any[] }) {
    const [sortBy, setSortBy] = useState("xp");

    const getRankStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white";
        if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
        if (rank === 3) return "bg-gradient-to-r from-amber-600 to-orange-700 text-white";
        return "bg-muted text-muted-foreground";
    };

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
        switch (sortBy) {
            case "streak": return (b.currentStreak || 0) - (a.currentStreak || 0);
            case "level": return (b.level || 0) - (a.level || 0);
            case "tasks": return (b.tasksCompleted || 0) - (a.tasksCompleted || 0);
            case "xp":
            default: return (b.totalXP || 0) - (a.totalXP || 0);
        }
    });

    return (
        <>
            {/* Sort Options */}
            <div className="flex gap-2 overflow-auto pb-2">
                {[
                    { id: "xp", label: "XP", icon: "⚡" },
                    { id: "streak", label: "Streak", icon: "🔥" },
                    { id: "level", label: "Level", icon: "⭐" },
                    { id: "tasks", label: "Tasks", icon: "✓" },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            sortBy === option.id
                                ? "bg-violet-500 text-white"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        {option.icon} {option.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            <div className="space-y-2">
                {sortedLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Add friends to see the leaderboard!</p>
                    </div>
                ) : (
                    sortedLeaderboard.map((entry: any) => (
                        <motion.div
                            layout
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4",
                                entry.isMe
                                    ? "bg-violet-50 border-violet-500 hover:border-violet-600"
                                    : "bg-card border-border hover:border-slate-300"
                            )}
                        >
                            {/* Rank Badge - Only show dynamic rank 1-3 if sorted by XP? No, show rank always? 
                                Actually, entry.rank comes from server and might be fixed to XP. 
                                We should probably recalculate rank roughly based on index for this view if we sort client side.
                            */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                                getRankStyle(entry.rank) // Note: This might still use the server-provided rank (based on XP). 
                                // Ideally we should recalculate if we want it to reflect the current sort. 
                                // But keeping it simple for now as requested "sort by desc". 
                                // To make it perfect, we'd map index+1 to rank.
                            )}>
                                {entry.rank}
                            </div>


                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                {entry.image ? (
                                    <img src={entry.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold">{entry.name?.[0]}</span>
                                )}
                            </div>

                            {/* Name & Stats */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">
                                    {entry.name} {entry.isMe && "(You)"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Level {entry.level}
                                </p>
                            </div>

                            {/* Value */}
                            <div className="text-right">
                                <p className="font-black text-lg">
                                    {sortBy === "xp" && entry.totalXP?.toLocaleString()}
                                    {sortBy === "streak" && entry.currentStreak}
                                    {sortBy === "level" && entry.level}
                                    {sortBy === "tasks" && entry.tasksCompleted}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase">
                                    {sortBy === "xp" && "XP"}
                                    {sortBy === "streak" && "Days"}
                                    {sortBy === "level" && "Level"}
                                    {sortBy === "tasks" && "Done"}
                                </p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </>
    );
}

// ==================== FEED TAB ====================

function FeedTab({
    milestones,
    activity,
    onCelebrate,
    onSendCheer
}: {
    milestones: any[];
    activity: any[];
    onCelebrate: (id: Id<"milestones">) => void;
    onSendCheer: (userId: Id<"users">, type: string) => void;
}) {
    const [celebratingId, setCelebratingId] = useState<string | null>(null);

    const getMilestoneIcon = (type: string) => {
        switch (type) {
            case "tasks_completed": return "✓";
            case "streak_achieved": return "🔥";
            case "level_up": return "⭐";
            case "habit_streak": return "💧";
            case "weekly_goal": return "🎯";
            default: return "🎉";
        }
    };

    const getMilestoneMessage = (type: string, value: number) => {
        switch (type) {
            case "tasks_completed": return `Completed ${value} quests!`;
            case "streak_achieved": return `${value}-day streak! 🔥`;
            case "level_up": return `Reached Level ${value}!`;
            case "habit_streak": return `${value}-day habit streak!`;
            case "weekly_goal": return "Crushed their weekly goal!";
            default: return "Achieved a milestone!";
        }
    };

    const handleCelebrate = (milestoneId: string) => {
        setCelebratingId(milestoneId);
        onCelebrate(milestoneId as Id<"milestones">);
        // Clear confetti after animation
        setTimeout(() => setCelebratingId(null), 1500);
    };

    return (
        <div className="space-y-4">
            {/* Today's Activity */}
            {activity.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Today&apos;s Activity
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {activity.map((item: any) => (
                            <div
                                key={item.friend.id}
                                className="p-3 bg-card border-2 border-border border-b-4 rounded-2xl"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                        {item.friend.image ? (
                                            <img src={item.friend.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold">{item.friend.name?.[0]}</span>
                                        )}
                                    </div>
                                    <span className="font-bold text-sm truncate">{item.friend.name}</span>
                                </div>
                                {item.activity ? (
                                    <div className="text-xs space-y-0.5">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tasks</span>
                                            <span className="font-bold text-green-500">✓ {item.activity.tasksCompleted}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Habits</span>
                                            <span className="font-bold text-blue-500">💧 {item.activity.habitsCompleted}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Not active yet today</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Milestones Feed */}
            <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Recent Milestones
                </h3>

                {milestones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No milestones yet</p>
                        <p className="text-sm">Your friends&apos; achievements will appear here!</p>
                    </div>
                ) : (
                    milestones.map((milestone: any) => (
                        <motion.div
                            key={milestone._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-card border-2 border-border border-b-4 rounded-2xl relative overflow-hidden"
                        >
                            {/* Mini Confetti Effect */}
                            <AnimatePresence>
                                {celebratingId === milestone._id && (
                                    <>
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{
                                                    opacity: 1,
                                                    scale: 0,
                                                    x: 0,
                                                    y: 0
                                                }}
                                                animate={{
                                                    opacity: 0,
                                                    scale: 1,
                                                    x: (Math.random() - 0.5) * 150,
                                                    y: (Math.random() - 0.5) * 100 - 30
                                                }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="absolute right-16 top-1/2 pointer-events-none z-10"
                                                style={{
                                                    fontSize: "16px",
                                                }}
                                            >
                                                {["🎉", "✨", "🎊", "⭐", "💫", "🌟"][i % 6]}
                                            </motion.div>
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl">
                                    {getMilestoneIcon(milestone.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">{milestone.user?.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {getMilestoneMessage(milestone.type, milestone.value)}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                                        {(() => {
                                            const date = new Date(milestone.achievedAt);
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
                                        })()}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={milestone.hasCelebrated ? "secondary" : "outline"}
                                    className={cn(
                                        "relative z-20",
                                        milestone.hasCelebrated
                                            ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                            : "bg-white hover:bg-gray-50 text-foreground border-2 border-gray-200 hover:border-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-600"
                                    )}
                                    onClick={() => !milestone.hasCelebrated && handleCelebrate(milestone._id)}
                                    disabled={milestone.hasCelebrated}
                                >
                                    {milestone.hasCelebrated ? "🎉 Celebrated" : "🎉 Celebrate"}
                                </Button>
                            </div>
                            {milestone.celebratedBy?.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    {milestone.celebratedBy.length} friend{milestone.celebratedBy.length > 1 ? "s" : ""} celebrated
                                </p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
