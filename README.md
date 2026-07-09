# The Craig Protocol

A standalone **installable PWA** version of the Craig Protocol home-fitness app —
kettlebell training rotation, AI meal-photo logging, an AI coach, Apple Health
sync, progress photos and blood-work reading. Originally a Claude artifact, now a
self-contained React app you can add to your iPhone home screen.

What changed from the artifact:

- **Storage** — Claude's artifact storage is replaced with the browser's
  `localStorage`. All data (workouts, food log, photos, chat, targets) lives on
  your device.
- **AI** — the AI features call the Anthropic API directly from your phone using
  **your own API key**, entered in **Plan → AI Connection**. The key is stored
  only in `localStorage` and sent only to `api.anthropic.com`.
- **Installable** — a web app manifest, service worker and iOS icons let you add
  it to the home screen and launch it fullscreen, offline-capable for the shell.

---

## 1. Run it locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed URL. To rebuild the app icons from the brand kettlebell mark:

```bash
npm run icons        # regenerates public/icons/*.png (pure Python, no deps)
```

Production build / preview:

```bash
npm run build
npm run preview
```

## 2. Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to the `main` branch:

   ```bash
   git init
   git add .
   git commit -m "The Craig Protocol PWA"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. In the repo, go to **Settings → Pages → Build and deployment** and set
   **Source** to **GitHub Actions**.

3. That's it. Every push to `main` runs `.github/workflows/deploy.yml`, which
   builds with the correct base path (`/<repo>/`, derived automatically from the
   repo name) and publishes to Pages. The live URL appears in the workflow's
   **deploy** step and under **Settings → Pages**:

   ```
   https://<you>.github.io/<repo>/
   ```

> No secrets are needed. Your Anthropic key is entered in the app on your phone,
> never in the repo or the build.

## 3. Add it to your iPhone home screen

1. Open the Pages URL in **Safari** on your iPhone.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the new icon — it runs fullscreen, no browser chrome.
4. Open the app, go to **Plan → AI Connection**, and paste your Anthropic API key
   (get one at <https://console.anthropic.com/settings/keys>).

## Notes

- **Model** — the app uses `claude-opus-4-8`. Change `MODEL` in
  [`src/App.jsx`](src/App.jsx) to use a different model (e.g. `claude-sonnet-5`
  for lower cost).
- **Your key, your bill** — calls are billed to your Anthropic account. The key
  lives only on the device; clear it any time with **Remove key**.
- **Backups** — use **Plan → Backup & Restore** to export/import all data as JSON
  (localStorage is per-device and cleared if you delete the app data).
- **Health data** — import a JSON export from the free *Health Auto Export* iPhone
  app under **Me → Health Sync**.
