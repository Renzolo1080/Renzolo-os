# RENZOLO website (renzoloenterprises.com)

A small static site, separate from the app. Every "start" button goes to
the app (app.renzoloenterprises.com) with tracking tags, so the app can see
which page sent each founder. The Academy and Contact forms post to the
app's `/api/applications` and `/api/contact`.

## Deploy on Vercel
1. In Vercel: Add New → Project → import the same GitHub repo (Renzolo1080/Renzolo-os).
2. Set **Root Directory** to `website`. Framework: Next.js (detected).
3. Environment variable (optional): `NEXT_PUBLIC_APP_URL` = `https://app.renzoloenterprises.com` (the default).
4. Deploy, then Settings → Domains → add `renzoloenterprises.com` and `www.renzoloenterprises.com`,
   and create the DNS records Vercel shows you at GoDaddy.

## Edit
- Pages are in `app/` (home, founder-trajectory, academy, about, contact).
- The About page bio is a draft: replace it with your own words.
- Run locally: `npm install && npm run dev` (http://localhost:3100).
