/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** When `true` or `1`, all routes send visitors to `/coming-soon` unless bypassed. */
  readonly VITE_COMING_SOON_MODE?: string
  /** Same value as query `?csbypass=` once per browser unlocks the full app while mode is on. */
  readonly VITE_COMING_SOON_BYPASS_SECRET?: string
  /** API origin (e.g. `https://api.example.com`). Leave empty in dev to use Vite `/api` proxy. */
  readonly VITE_API_BASE_URL?: string
  /** When `true`, `npm run dev` uses `VITE_API_BASE_URL` instead of the local Vite proxy. */
  readonly VITE_ALLOW_REMOTE_API_IN_DEV?: string
  /** Google OAuth Web client ID for Sign in with Google (GIS). */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Facebook Login — Meta app ID (same app as backend FACEBOOK_APP_ID). */
  readonly VITE_FACEBOOK_APP_ID?: string
}
