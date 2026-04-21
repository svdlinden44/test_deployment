/** Load Facebook JS SDK once and init — avoids React Strict Mode wiping `fbAsyncInit`. */

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string
        cookie: boolean
        xfbml: boolean
        version: string
      }) => void
      login: (
        cb: (r: {
          status?: string
          authResponse?: { accessToken?: string }
        }) => void,
        opts?: { scope: string },
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

const SCRIPT_ID = 'facebook-jssdk'
const SDK_VERSION = 'v21.0'

let loadPromise: Promise<void> | null = null

export function ensureFacebookSdk(appId: string): Promise<void> {
  const id = appId.trim()
  if (!id) return Promise.reject(new Error('Missing Facebook App ID'))

  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const fail = (msg: string) => {
      if (settled) return
      settled = true
      loadPromise = null
      reject(new Error(msg))
    }

    const tryInit = (): boolean => {
      if (!window.FB) return false
      try {
        window.FB.init({
          appId: id,
          cookie: true,
          xfbml: false,
          version: SDK_VERSION,
        })
      } catch {
        /* duplicate init on remount — ignore */
      }
      finish()
      return true
    }

    const prevAsync = window.fbAsyncInit
    window.fbAsyncInit = () => {
      try {
        prevAsync?.()
      } catch {
        /* ignore */
      }
      if (!window.FB) {
        fail('Facebook SDK did not expose FB')
        return
      }
      tryInit()
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      if (tryInit()) return
      let attempts = 0
      const poll = window.setInterval(() => {
        attempts += 1
        if (tryInit()) {
          window.clearInterval(poll)
          return
        }
        if (attempts > 400) {
          window.clearInterval(poll)
          fail('Facebook SDK did not become ready in time')
        }
      }, 50)
      return
    }

    const js = document.createElement('script')
    js.id = SCRIPT_ID
    js.async = true
    js.src = 'https://connect.facebook.net/en_US/sdk.js'
    js.onerror = () => fail('Could not load Facebook SDK script')
    document.body.appendChild(js)
  })

  return loadPromise
}
