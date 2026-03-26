# Mirror — Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is fine)
- An [Anthropic](https://console.anthropic.com) API key
- A [Fireflies](https://app.fireflies.ai) account (for the real integration)
- [ngrok](https://ngrok.com) for local webhook testing

---

## 1. Clone and install

```bash
git clone <your-repo>
cd mirror
npm install
```

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Run the database schema

1. In your Supabase project, go to **SQL Editor**
2. Open `supabase-schema.sql` from this repo
3. Paste the entire contents and click **Run**

This creates all tables, row-level security policies, and realtime subscriptions.

---

## 4. Configure Supabase Auth

1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

For production, replace `localhost:3000` with your Vercel URL.

---

## 5. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
FIREFLIES_API_KEY=your-fireflies-key
FIREFLIES_WEBHOOK_SECRET=any-random-string-you-choose
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For `FIREFLIES_WEBHOOK_SECRET`: generate any random string (e.g. `openssl rand -hex 32`). You'll paste this into Fireflies when setting up the webhook.

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

---

## 7. Set up Fireflies webhook (for real automation)

### Step 1 — Expose localhost with ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL ngrok gives you (e.g. `https://abc123.ngrok.io`).

### Step 2 — Register the webhook in Fireflies

1. Go to [app.fireflies.ai](https://app.fireflies.ai) → **Integrations → Webhooks**
2. Add a new webhook:
   - **URL**: `https://abc123.ngrok.io/api/webhooks/fireflies`
   - **Secret**: the value you put in `FIREFLIES_WEBHOOK_SECRET`
   - **Events**: select `Transcript ready`

### Step 3 — Get your Fireflies API key

1. Go to **Account → API Key** in Fireflies
2. Copy and paste into `FIREFLIES_API_KEY` in `.env.local`

Once this is set up, any meeting recorded through Fireflies will automatically:
1. Send a webhook to Mirror when the transcript is ready
2. Mirror analyzes it with Claude
3. The feedback report appears in your feed — no action needed

---

## 8. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add all environment variables from `.env.local`.

Then update your Supabase Auth redirect URL to your Vercel URL, and update the Fireflies webhook URL to your production URL.

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # Runs Claude analysis on a meeting
│   │   ├── meetings/route.ts         # CRUD for meetings
│   │   └── webhooks/
│   │       └── fireflies/route.ts    # Receives Fireflies transcripts
│   ├── auth/
│   │   ├── callback/route.ts         # Supabase OAuth callback
│   │   └── login/page.tsx            # Magic link login
│   ├── feed/page.tsx                 # Main feed with realtime updates
│   ├── onboarding/page.tsx           # First-time profile + connections setup
│   ├── report/[id]/page.tsx          # Individual feedback report
│   └── layout.tsx
├── lib/
│   ├── analyze.ts                    # Claude feedback generation
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # Server + service role clients
├── middleware.ts                     # Auth protection for all routes
└── types/index.ts                    # TypeScript types
```

---

## How the automated flow works

```
Meeting ends
    ↓
Fireflies generates transcript
    ↓
Fireflies POSTs to /api/webhooks/fireflies
    ↓
Mirror creates meeting record (status: analyzing)
    → Feed shows pending card immediately via Supabase Realtime
    ↓
Mirror calls Claude API with transcript + user profile
    ↓
Claude returns structured feedback JSON
    ↓
Mirror saves report to Supabase
Mirror updates meeting status to 'ready'
    ↓
Supabase Realtime pushes update to user's browser
    → Feed card flips from pending → ready with score
    ↓
User opens report — no action required
```

---

## Next steps

- [ ] Add Otter.ai webhook integration (same pattern as Fireflies)
- [ ] Add Zoom cloud recording integration
- [ ] Add Google Calendar polling
- [ ] Build the Trends page in Next.js
- [ ] Add email notifications (Resend)
- [ ] Add coach chat to the report page
