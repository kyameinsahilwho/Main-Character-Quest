# Supabase to Convex Migration Guide

## 1. Overview
We have successfully switched the application to use **Convex** for the database and **Google Auth** (via Convex Auth) for authentication. 
Supabase dependencies have been removed from the application code, but your Supabase project still holds your old data.

## 2. Authentication
- Users must log in again using **Google**.
- If they used Google Sign-In on Supabase, their email will match, and they will be identified as the same user.

## 3. Data Migration (Advanced)
To migrate your existing tasks, projects, and habits from Supabase to Convex, you need to run a migration script.
**Prerequisites:**
1. Get your `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard > Project Settings > API.
2. Add it to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=...`

**Running the Script:**
The script `scripts/migrate.js` is provided as a starting point. 
**Note:** The current Convex mutations enforce authentication. To run a bulk import script, you would typically need to:
1. Create `internalMutation` functions in Convex that accept `userId` as an argument (bypassing the `getAuthUserId` check).
2. Call these internal functions from the script using `npx convex run ...` or the Node.js client with an Admin Key.

For now, the application starts fresh. Your old data is safe in Supabase and can be exported/imported if needed.

## 4. Next Steps
1. Run `npx convex dev` (if not running).
2. Run `npm run dev`.
3. Log in with Google.
4. Enjoy the new real-time capabilities!
