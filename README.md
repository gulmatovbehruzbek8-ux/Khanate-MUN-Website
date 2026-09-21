# KhanateMUN website

Next.js (App Router, TypeScript). English + Uzbek (`/en`, `/uz`). Registrations and admin data live in a Google Sheet.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run dev                  # http://localhost:3000  (admin: /admin)
```

Without Google credentials, dev mode keeps registrations in a local file (`.data/`), so you can try the form and the admin panel right away. Set `ADMIN_PASSWORD` in `.env.local` to sign in to `/admin`.

## Where to edit things

| What | File |
| --- | --- |
| Fees, social links, team, default settings | `src/content/site.ts` |
| Starting content for past seasons (the admin panel can change it later) | `src/content/seasons.ts` |
| All page text (English + Uzbek) | `src/lib/dictionaries.ts` |
| Colors and layout | `src/app/globals.css` |
| Team photos | put them in `public/team/` and set `photo: "/team/name.jpg"` in `site.ts` |

Seasons are easiest to manage from the admin panel (below). `seasons.ts` only holds the starting versions.

## Admin panel (`/admin`)

Sign in with `ADMIN_PASSWORD`. You can:

- see all registrations with search and filters (status, ticket, committee)
- change each status: New, Accepted, Paid, Rejected (saved to the Google Sheet)
- see totals: registrations, expected income, money collected, breakdown by ticket and committee
- export everything as CSV
- delete one registration or all of them (with a confirmation step). If you use the Apps Script store, re-paste `google-apps-script/Code.gs` and deploy a New version after updating
- see referrals: every registrant gets a code (KMUN-XXXXX, derived from their Telegram handle) on the success screen; the Referrals panel shows who to pay back (10 000 UZS per friend, max 2)
- **edit past seasons** (Seasons tab): titles, dates, venue, summary, fees, key dates, what was included, committees with agendas and chairs, all in English and Uzbek, and add a new season
- **add photos** to a season (first photo is the cover); photos are shrunk in the browser before upload
- **open or close registration** and **set the next season date** (this drives the homepage countdown, no redeploy needed)

Everyone who knows the password has the same access. Use a long password and share it only with the organisers.

## Google Sheet setup (free)

1. Create an empty Google Sheet.
2. Go to console.cloud.google.com, create a project, and enable the **Google Sheets API**.
3. IAM & Admin > Service Accounts > create one. Open it > Keys > Add key > JSON. A file downloads.
4. Open your Sheet > Share > paste the service account's `client_email` > **Editor**.
5. Fill `.env.local`:
   - `GOOGLE_SHEET_ID`: the long id in the Sheet URL between `/d/` and `/edit`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the JSON
   - `GOOGLE_PRIVATE_KEY`: `private_key` from the JSON, in double quotes, keeping the `\n`
   - `ADMIN_PASSWORD`: your admin password

The site creates the `Registrations`, `Settings` and `Content` tabs and the header row by itself on first use. You can also edit the Sheet by hand at any time.

## Connect Google Sheets without a card (Apps Script)

Use this if Google Cloud asks for a card. It is free and runs inside your Sheet.

1. Create a blank Google Sheet. Open **Extensions, Apps Script**.
2. Delete the sample code and paste all of `google-apps-script/Code.gs`. Save.
3. Open **Project Settings** (gear icon), then **Script Properties**, then **Add script property**: name `SECRET`, value a long random password. Save.
4. Press **Deploy, New deployment**, choose type **Web app**. Set "Execute as" to **Me** and "Who has access" to **Anyone**. Deploy and approve the permissions (Advanced, then continue).
5. Copy the **Web app URL** (ends in `/exec`).
6. In Vercel (or `.env.local`) set `GOOGLE_SCRIPT_URL` to that URL and `GOOGLE_SCRIPT_SECRET` to the same secret from step 3. Redeploy.

Only requests that carry the secret are accepted. If you edit `Code.gs` later, use **Deploy, Manage deployments, Edit, New version** so the change goes live.

## Photo storage (free, needed for uploads on Vercel)

Vercel has no permanent disk, so photos go to **Vercel Blob**:

1. In your Vercel project open **Storage** > **Create** > **Blob** and connect it to the project.
2. Redeploy. Vercel adds `BLOB_READ_WRITE_TOKEN` by itself.

While testing locally without that token, photos are saved in `.data/uploads` instead (git-ignored).

## Deploy on Vercel (free)

1. Push this folder to a GitHub repo (`.env.local` is git-ignored, never commit it).
2. vercel.com > Add New > Project > import the repo.
3. Settings > Environment Variables: add the `GOOGLE_*` variables and `ADMIN_PASSWORD`. Then connect Blob storage (see above).
4. Deploy. Every push to `main` redeploys.

## Notes

- Spam protection: hidden honeypot field and a per-IP rate limit on the form and on admin login.
- Values are written to the Sheet as plain text, so nobody can inject spreadsheet formulas. CSV exports escape them too.
- Google Sheets is fine for a few hundred registrations. If you outgrow it, replace `src/lib/sheets.ts` (same interface as `src/lib/devstore.ts`).
