# Hot Takes Website

Marketing website for **Hot Takes**, a live speed-dating app focused on real-time chemistry instead of swipe-based matching.

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
