# Hot Take Website

Marketing website for **Hot Take**, a live speed-dating app focused on real-time chemistry instead of swipe-based matching.

Built with React, TypeScript, and Vite.

## What This Site Includes

- Hero section with product messaging and CTA flow
- Interactive "Hot Take" voting preview
- Feature walkthrough ("Share your take -> Live speed date -> Match & message")
- Support and FAQ section
- In-site privacy policy page

## Tech Stack

- React 19
- TypeScript
- Vite
- `lucide-react` for icons

## Community Hot/Cold votes (live)

The interactive previewer reads and writes votes through the same Supabase project as the iOS app.

1. Copy `.env.example` to `.env.local`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon key from Supabase → Project Settings → API)
3. Apply migration `20260518190000_community_take_votes.sql` on that project (`supabase db push` from the mobile repo)

Without env vars, the site falls back to static demo percentages.

## Admin dashboard (`/admin`)

Ops console for the same Supabase project (migration `20260523120000_website_admin_dashboard.sql` in the **hot-takes-dating-app** repo).

1. Allowlisted emails live in `public.website_admins` (default superadmin: `b.antoine.se@gmail.com`).
2. Create a Supabase Auth user with that email (or sign up in the iOS app first).
3. Open [http://localhost:5173/admin/login](http://localhost:5173/admin/login) and sign in with email + password.

**Sections:** Overview KPIs, moderation reports, live queue, pairing funnel (24h), profile search, community vote stats.

Access is enforced server-side via `admin_*` RPCs (`admin_require_access`); the browser never uses the service role key.

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start local development server

```bash
npm run dev
```

By default, Vite runs at [http://localhost:5173](http://localhost:5173).

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - run TypeScript project build, then create production bundle
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint checks

## Build Output

Production files are generated in `dist/`.

## Project Structure (High-Level)

- `src/main.tsx` - app entry point
- `src/App.tsx` - all page sections and UI state
- `src/index.css` / `src/App.css` - styling

## Notes

- Current implementation is a single-page experience with an internal view switch for Home vs Privacy Policy.
- App content includes user-facing support details and privacy messaging for the iOS product.
