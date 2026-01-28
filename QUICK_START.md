# 🚀 Quick Setup - 5 Minutes

## Step 1: Create Supabase Project (2 min)
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name it and set password
4. Wait for project creation

## Step 2: Get API Keys (1 min)
1. Settings → API
2. Copy "Project URL"
3. Copy "anon public" key

## Step 3: Configure Environment (30 sec)
```bash
cp .env.example .env.local
```
Edit `.env.local` with your keys

## Step 4: Run Migration (1 min)
1. Supabase Dashboard → SQL Editor
2. Copy/paste `supabase/migrations/001_initial_schema.sql`
3. Click Run

## Step 5: Start App (30 sec)
```bash
bun install
bun run dev
```

## Done! 🎉
Open http://localhost:3000 and sign up!

---

## Verify It Works
- [ ] Can sign up
- [ ] Can create tasks
- [ ] Tasks appear in Supabase dashboard (Table Editor → tasks)
- [ ] Can sign out and sign back in
- [ ] Tasks still there after re-login

## Troubleshooting
**Can't see tasks after login?**
→ Check Supabase Dashboard → Authentication → Users (user exists?)
→ Check Table Editor → tasks (data exists?)

**"Failed to load" error?**
→ Double-check `.env.local` values
→ Make sure migration ran successfully

**Redirected to login immediately?**
→ This is normal! Just sign up first

---

📖 Full docs: `docs/SUPABASE_SETUP.md`
