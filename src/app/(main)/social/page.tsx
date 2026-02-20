import { SocialSection } from '@/components/social-section';
import { fetchQuery } from '@/lib/server-convex-client';
import { api } from '../../../../convex/_generated/api';

export default async function SocialPage() {
  let initialFriends: any[] | undefined;
  let initialNotifications: any[] | undefined;
  let initialChallenges: any[] | undefined;
  let initialLeaderboard: any[] | undefined;
  let initialActivity: any[] | undefined;

  try {
    [
      initialFriends,
      initialNotifications,
      initialChallenges,
      initialLeaderboard,
      initialActivity
    ] = await Promise.all([
      fetchQuery<any[]>(api.social.getFriends),
      fetchQuery<any[]>(api.social.getSocialNotifications, { limit: 50 }),
      fetchQuery<any[]>(api.challenges.getActiveChallenges),
      fetchQuery<any[]>(api.challenges.getFriendsLeaderboard, { type: "xp" }),
      fetchQuery<any[]>(api.challenges.getFriendsActivity),
    ]);
  } catch (error) {
    console.warn("Failed to fetch social data on server:", error);
  }

  return (
    <SocialSection
      initialFriends={initialFriends}
      initialNotifications={initialNotifications}
      initialChallenges={initialChallenges}
      initialLeaderboard={initialLeaderboard}
      initialActivity={initialActivity}
    />
  );
}
