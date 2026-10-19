# ListenShelf

A responsive, installable, personal audio library built with React, TypeScript, and Vite. Its GitHub Pages deployment is at **https://exitramp505.github.io/ListenShelf/**.

## Included features

- Browse collections, search titles/authors/chapters, and filter by category.
- Detailed collection screens with ordered chapters and favorites.
- Persistent HTML5 audio playback when navigating between screens.
- Full-screen and mini player with seeking, skip back 15s / forward 30s, previous / next recording, speed control, and a 15/30/60-minute sleep timer.
- Continuous playback advances **within the active collection** and stops after its last track (browser autoplay restrictions may require another tap).
- Media Session metadata and iPhone lock-screen controls, where supported.
- Listening history, completed chapters, continue-listening position, and favorites saved in your browser.
- Add, edit, and remove **personal** collections with HTTPS MP3 URLs; import/export collections as JSON.
- Standalone iPhone home-screen mode, app icon, and network-first service worker caching of app pages (audio is **not** stored offline).
- A starter catalog of public-domain LibriVox recordings. Source attribution is linked on each catalog page.

The three audio URLs already present in the original ListenShelf proof of concept are preserved exactly in `src/library.ts`. The original reference archive is **not** mirrored or scraped.

## Local development

Requires Node.js 24+. Run:

```bash
npm ci
npm run dev
```

The `predev` script creates the iPhone/PWA icons with Node's built-in `zlib`, without additional dependencies.

Run the production build:

```bash
npm run build
```

## Deploy

Pushing to the `main` branch triggers `.github/workflows/deploy.yml`. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The Vite base path is `/ListenShelf/`. Service worker is registered only in a production build.

## Library data

- `src/library.ts`: bundled catalog; new sources can be edited here before deployment.
- The in-app **Add a collection** form saves directly in your browser's `localStorage`. It is **per device/browser**, not shared between phones or computers.
- JSON import/export can move your personally added collections between devices. The starter books already ship with the app.
- For privacy, progress and favorites also remain in the current browser and are not uploaded to GitHub.
- Imported audio URLs must use HTTPS; other websites can block hotlinking or streaming.

## Limitations to test

GitHub Actions verifies compilation and deployment. Real iOS Safari tests are still needed for full audiobook auto-advance, remote-server seek support, background playback, and long sessions. Streaming audio requires an internet connection and an accessible source server. The app is not a native iOS app and does not provide offline MP3 downloads.
