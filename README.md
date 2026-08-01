# Forza Paint Archive — build 2026-08-02.1

Installs on Android and desktop Chrome from the same URL.

## 1. Host it (free, no deploy quota)

1. New GitHub repo. Push **the contents of this folder to the repo root** —
   `index.html`, `sw.js`, `manifest.webmanifest`, the icons and `env-*.jpg`
   must all sit beside each other.
2. Settings → Pages → Build and deployment → **GitHub Actions**.
3. `.github/workflows/pages.yml` deploys on every push to `main`.

You get `https://<user>.github.io/<repo>/`. HTTPS is required for install and
Pages provides it.

`.nojekyll` is present because Jekyll drops files starting with an underscore.
The manifest uses relative `./` paths so a `/<repo>/` subpath works.

## 2. Install

**Android Chrome** — open the URL, ⋮ menu → *Add to Home screen* / *Install app*.
It gets its own launcher icon and opens without browser chrome.

**Desktop Chrome** — open the same URL, install icon in the address bar, or
⋮ → *Cast, save and share* → *Install page as app*. It opens in its own window.

If no install option appears, visit `chrome://flags` … no — check instead that
the URL is https, and open DevTools → Application → Manifest, which lists any
unmet criterion directly.

## 3. Share data between them

Installs are separate: each device has its own storage. **More → Cloud sync**
puts the archive in a secret GitHub gist. Push from one, pull on the other.
A fine-grained token needs only **Gists: read and write**.

## Storage

The app persists to **IndexedDB**, falling back to localStorage where
IndexedDB is blocked. Before build 2026-08-02.1 it wrote to an API that only
exists inside the Claude sandbox, so a deployed copy silently kept nothing —
every reload started from the seed data.

Local test: `python3 -m http.server 8000` → http://localhost:8000
Service workers are allowed on localhost without HTTPS.
