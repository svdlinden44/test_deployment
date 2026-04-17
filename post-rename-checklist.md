# Post-rename checklist (The Distillist / Railway `the-distillist`)

Personal notes from the deployment audit — **not committed** to the repo by default.

## Done (verified)

- [x] Git remote: `origin` → `github.com/svdlinden44/the-distillist.git`
- [x] `npm run build` succeeds
- [x] `npm run start` serves `dist` (200 on `/`)
- [x] Django `manage.py check` clean (after recreating `backend/.venv` — old venv pointed at a moved “Test Deployment Website” path)
- [x] Railway CLI linked: project **the-distillist**, **Frontend Service** deployment **SUCCESS**
- [x] Live checks: `https://thedistillist.com/`, `https://www.thedistillist.com/` → SPA 200; `https://api.thedistillist.com/health/` → `{"status":"ok"}`; admin login page 200

## Todo — Git

- [ ] **Push** `main` to `origin` whenever local is ahead (was 1 commit: README rename).

## Todo — Railway / Django

- [ ] **CSRF:** Backend service has `DJANGO_CSRF_TRUSTED_ORIGINS` set only to the `*.up.railway.app` URL. That **overrides** in-code defaults that include `thedistillist.com`, `www`, and `api`. Fix by expanding the env var to include at least:
  - `https://api.thedistillist.com`
  - `https://thedistillist.com`
  - `https://www.thedistillist.com`
  - plus the Railway URL if you still use it  
  Or remove the var and rely on `settings.py` defaults if that matches production.
- [ ] **Dead env:** `DJANGO_ALLOWED_HOSTS` in Railway is unused — `settings.py` uses `ALLOWED_HOSTS = ["*"]`. Either wire settings to read that env or remove the variable to avoid confusion.

## Todo — Frontend ↔ API

- [ ] **Relative `/api/*`:** Frontend has no `VITE_API_BASE_URL` in Railway; requests go to same origin (`thedistillist.com/api/...`), which currently serves the SPA shell, not Django.
- [ ] **Django routes:** `backend/config/urls.py` only exposes `health/` and `admin/` — no `/api/...` yet. To ship waitlist/auth/cocktails from the SPA, add Django URL routes (and views) **and/or** set `VITE_API_BASE_URL` at **build** time to `https://api.thedistillist.com` plus CORS/CSRF alignment.

## Todo — Third parties

- [ ] **Google Maps:** In Google Cloud Console, ensure HTTP referrer allowlist includes `https://thedistillist.com/*`, `https://www.thedistillist.com/*`, and any Railway preview hosts you use.
- [ ] **R2 (if enabled):** Confirm bucket CORS and `R2_PUBLIC_URL` match current domains/CDN.

## Todo — Security / hygiene

- [ ] If Railway variable dumps ever went through shared or logged tooling, consider **rotating** `DJANGO_SECRET_KEY` and database credentials after updating env vars in Railway.

## Reminder — project rename

- [ ] Search for old **`*.up.railway.app`** URLs in docs, env, and `DJANGO_CSRF_TRUSTED_ORIGINS` after service renames; custom domains (`thedistillist.com`) are unchanged by renaming the Railway **project**.
