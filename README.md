# ListenShelf

ListenShelf is a mobile-friendly React / TypeScript audio-player proof of concept.

## Local development

Install Node.js 24 or later. Then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Build the production site with `npm run build`.

## GitHub Pages

The project is configured for the repository `exitramp505/ListenShelf`, with the Vite base path `/ListenShelf/`.

A workflow at `.github/workflows/deploy.yml` builds and deploys changes to the `main` branch. In GitHub **Settings → Pages**, choose **GitHub Actions** under **Build and deployment → Source**.

Expected Pages address: https://exitramp505.github.io/ListenShelf/

## iPhone

Open the Pages site in Safari, tap Share, and select **Add to Home Screen**. The app includes standalone display metadata. A full offline-capable service worker has not been added; recordings require network access.

## Playback

Use Play to start. Next/Previous preserves playback intent, and the player attempts to advance automatically at the end of each recording. Safari may still impose limits on automatic playback and lock-screen behavior, which must be tested on an actual iPhone.

## Repository hygiene

`node_modules/` and `dist/` belong in `.gitignore` and should not be uploaded again. If already committed, they can be removed from Git tracking as a separate housekeeping change.
