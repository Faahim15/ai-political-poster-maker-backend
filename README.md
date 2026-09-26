# পোস্টার ঘর — Backend (Express + TypeScript + MongoDB)

The API and poster-generation pipeline for the AI Political Poster Maker. Handles
auth, templates, photo uploads, and the full generate → Gemini → Puppeteer →
Cloudinary flow behind every poster.

## Run

```bash
npm install
cp .env.example .env      # fill in the values below
npm run dev                # http://localhost:5000
npm run seed                # populate the templates collection
```

## Environment Variables

| Variable         | Example                 | Notes                                               |
| ---------------- | ----------------------- | --------------------------------------------------- |
| `MONGODB_URI`    | `mongodb+srv://...`     | MongoDB Atlas or local instance                     |
| `JWT_SECRET`     | a long random string    | signs auth tokens                                   |
| `GEMINI_API_KEY` | `AIza...`               | from Google AI Studio                               |
| `GEMINI_MODEL`   | `gemini-3.8-flash`      | optional, code has a default                        |
| `CLOUDINARY_URL` | `cloudinary://...`      | or separate cloud name/key/secret vars              |
| `CORS_ORIGIN`    | `http://localhost:3000` | must match the frontend's **exact** deployed origin |
| `PORT`           | `5000`                  | optional                                            |

## Scripts

| Command               | What it does                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`         | Starts the API with hot reload                                                                                                                                                 |
| `npm run build`       | Type-checks and compiles to `dist/`                                                                                                                                            |
| `npm start`           | Runs the compiled build (`dist/`)                                                                                                                                              |
| `npm run seed`        | Seeds/inserts templates into MongoDB (see `src/scripts/`)                                                                                                                      |
| `npm run test:gemini` | Calls Gemini directly and prints the raw result — use this first when a poster's colors look wrong, to confirm Gemini is actually responding rather than silently falling back |

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts     register, login
│   │   ├── auth.middleware.ts     JWT verification (Bearer token)
│   │   └── auth.model.ts
│   ├── templates/
│   │   ├── template.model.ts      schema — see "Template shapes" below
│   │   └── template.controller.ts list / get (filter by occasion)
│   └── posters/
│       ├── poster.model.ts
│       ├── poster.controller.ts   create / status / regenerate / delete / history
│       ├── poster.service.ts      the generation pipeline (calls Gemini + renderer)
│       ├── render.service.ts      Puppeteer: HTML → 1200×1600 PNG
│       └── gemini.service.ts      all Gemini calls live here, nowhere else
├── common/
│   ├── config/
│   │   ├── db.ts                  MongoDB connection
│   │   └── cloudinary.ts          uploadBuffer() for photos + generated posters
│   ├── middleware/                error.middleware.ts, upload.middleware.ts
│   └── utils/                     AppError, asyncHandler
└── scripts/
    ├── seedTemplates.ts           renders realistic thumbnails, not stock photos
    └── insertTemplate.mjs         adds one fixed-illustration template at a time
```

## API Endpoints

```
POST   /auth/register
POST   /auth/login

GET    /templates?occasion=victory|condolence|campaign|greeting|festival
GET    /templates/:id

POST   /upload                     multipart, field name "file" → { url }

POST   /posters                    { templateId, formData, uploadedPhotoUrls }
GET    /posters/:id
GET    /posters/user/:userId       (userId in the URL is ignored — the JWT decides)
POST   /posters/:id/regenerate     { formData }  — cannot change photos, see below
DELETE /posters/:id
```

All of the above (except `/auth/*` and `GET /templates*`) require
`Authorization: Bearer <token>`. Every error response is `{ "message": "..." }`,
in Bangla, safe to show directly to the user.

## Gemini's Role — Exactly Three Calls, Nothing Else

Gemini never generates the poster image itself. `gemini.service.ts` exposes three
functions, each returning strict JSON, each with retry-then-fallback on `429`/`503`:

1. **`suggestPhotoFocusPoints(photoUrls)`** — vision call, runs on every poster with
   at least one photo. Returns `{x, y}` per photo (0–100), used as CSS
   `object-position` so a face isn't cropped by a fixed-size circular/rectangular
   frame.
2. **`suggestDecoration(occasion)`** — text call, only for plain-gradient templates
   (no `backgroundImageUrl`). Returns `{primaryColor, secondaryColor, accentColor}`.
3. **`suggestTextColors(occasion, zoneBackgroundColors)`** — text call, only for
   fixed-illustration templates. Given the _actual_ sampled background color behind
   each text zone, returns a readable text color per zone.

`poster.service.ts` decides which of (2)/(3) to call based on whether the template
has `backgroundImageUrl` + `textLayout` set. `render.service.ts` then draws the
final PNG with Puppeteer — the user's Bangla text is placed exactly as typed, never
touched by the AI.

## Template Shapes

A template is either **plain-gradient** or **fixed-illustration** — `poster.service.ts`
branches on whether `backgroundImageUrl` + `textLayout` are present.

**Plain-gradient** (HTML/CSS gradient + up to 3 circular photo slots):

```ts
{
  title, occasionType, thumbnailUrl,
  layoutConfig: { primaryColor, secondaryColor, accentColor, photoSlots }
}
```

**Fixed-illustration** (a finished background image with pre-measured blank zones):

```ts
{
  title, occasionType, thumbnailUrl,
  backgroundImageUrl,
  textLayout: {
    headline: { top, fontSize, color },   // percent of 1200x1600 canvas
    sub:      { top, fontSize, color },
    name:     { top, fontSize, color },
    photo:    { top, left, width, height, borderRadius }
  },
  zoneBackgroundColors: { headline, sub, name },  // hex, sampled from the real image
  layoutConfig: { photoSlots }
}
```

`textLayout`'s colors are only a **fallback** for the fixed-illustration case —
`suggestTextColors` overrides `headline`/`sub`/`name`.`color` on every real
generation. `zoneBackgroundColors` must be measured from the actual image (pixel
sampling), not guessed, or Gemini has nothing real to contrast against.

Adding a new fixed-illustration template is a data problem, not a code problem —
use `insertTemplate.mjs` with the measured percentages, no schema change needed.

## Troubleshooting

| Symptom                                | Likely cause                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Every poster has the same 3 hex colors | Gemini is silently failing (check `GEMINI_API_KEY`, run `npm run test:gemini`)                        |
| `Cannot GET /templates`                | Routes are mounted under `/api` by the app entrypoint — hit `/api/templates`                          |
| Frontend gets CORS errors              | `CORS_ORIGIN` doesn't exactly match the frontend's deployed origin (scheme + host, no trailing slash) |
| First request after deploy times out   | Render (or similar) free-tier cold start — retry after ~30–60s, not a bug                             |
| Regenerate doesn't apply a new photo   | By design — `regeneratePoster` only accepts `formData`; photos are fixed at creation                  |
