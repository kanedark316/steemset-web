# Deploy steemset-web on Cloudflare Pages

This repo is a GPLv2 SteemSet copy of [stremio/stremio-web](https://github.com/stremio/stremio-web). Cloudflare Pages hosts the **static UI only**.

It does **not** replace:

- A [Stremio](https://www.stremio.com) account (library / sync)
- Addons you install yourself (official / legitimate only — do not add pirate addons here)
- The desktop Stremio **streaming server** (default `http://127.0.0.1:11470/`) for torrents and some local/LAN playback

Official live app for comparison: [web.stremio.com](https://web.stremio.com).

## Why Cloudflare Pages (vs Vercel)

| | Cloudflare Pages | Vercel |
|---|---|---|
| Fit | Static SPA + large WASM / Workbox assets | Also fine for SPAs, but heavier serverless focus |
| Free tier | Generous bandwidth for static assets; good CDN edge | Free hobby tier with different limits |
| Config in-repo | `_redirects` in `build/`, optional `wrangler.toml` | `vercel.json` |
| Recommendation here | **Prefer Pages** for this webpack → `build/` SPA | Use only if you already standardize on Vercel |

No COOP/COEP headers are set: upstream `http_server.js` / webpack do not require them for the WASM core.

## Prerequisites

- Node.js ≥ 22 (`.nvmrc` = `22`)
- pnpm ≥ 11 (`packageManager`: `pnpm@11.8.0`)
- GitHub repo: [kanedark316/steemset-web](https://github.com/kanedark316/steemset-web)

Local verify:

```powershell
cd C:\Users\shash\.cursor-tutor\steemset-web
pnpm install
pnpm run build
# output → build/  (includes _redirects copied by webpack)
```

## Cloudflare dashboard steps

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and select **`kanedark316/steemset-web`**.
3. Project settings:
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** `pnpm run build`
   - **Build output directory:** `build`
   - **Root directory:** `/` (default)
4. **Environment variables** (Production + Preview if you use previews):
   - `NODE_VERSION` = `22`  
     (Pages also reads `.nvmrc`; setting the env var makes the version explicit.)
5. Save / **Save and Deploy**. First deploy runs `pnpm install` (from lockfile) then the build command.
6. After success, open the `*.pages.dev` URL. App routes use hashes (`#/board`, `#/links`, etc.).

### SPA rewrite

`_redirects` in the repo root is copied into `build/` by webpack:

```text
/*    /index.html   200
```

Routing is already **HashRouter**, so deep links normally never leave `index.html`; the rewrite is a safety net.

### Optional Wrangler CLI

`wrangler.toml` sets `pages_build_output_dir = "build"`. After a local `pnpm run build`:

```bash
npx wrangler pages deploy build --project-name=steemset-web
```

(Requires a free Cloudflare account login via `wrangler login`. Prefer Git-connected deploys for day-to-day.)

## When to push from GitHub Desktop

Agents commit **locally only** (Project preference). Cloudflare’s Git integration builds from GitHub, so a deploy starts only after **you** push:

1. Open the repo in **GitHub Desktop** (`C:\Users\shash\.cursor-tutor\steemset-web`).
2. Confirm remote **origin** → `https://github.com/kanedark316/steemset-web.git` (not `upstream` / stremio).
3. Confirm branch **main** and the Cloudflare Pages commit is listed.
4. Click **Push origin**.
5. Watch the deploy under Cloudflare → Workers & Pages → your project → **Deployments**.

Do **not** push to the `upstream` remote (`stremio/stremio-web`).

## After deploy checklist

- [ ] UI loads on the Pages URL
- [ ] Sign-in / library uses your Stremio account (upstream APIs)
- [ ] Links page: `#/links` (official YouTube embeds only)
- [ ] Torrents / local streams: run desktop Stremio streaming server if needed — Pages alone is not enough
