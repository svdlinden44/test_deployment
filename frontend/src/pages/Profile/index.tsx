import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  apiChangePassword,
  apiUpdateProfile,
  apiUpdateProfileJson,
} from '@/lib/api/auth'
import { getAuthErrorMessage, useAuth } from '@/contexts/AuthContext'
import s from './Profile.module.scss'

function initials(name: string, email: string): string {
  const raw = name?.trim() || email.split('@')[0] || '?'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return raw.slice(0, 2).toUpperCase()
}

export function Profile() {
  const { user, applyMemberProfile } = useAuth()

  const [displayName, setDisplayName] = useState(user?.name ?? '')
  useEffect(() => {
    if (user?.name != null) setDisplayName(user.name)
  }, [user?.name])

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null)

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const [profileSaving, setProfileSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [pwError, setPwError] = useState('')
  const [profileOk, setProfileOk] = useState('')
  const [pwOk, setPwOk] = useState('')

  useEffect(() => {
    if (!avatarFile) {
      setAvatarBlobUrl(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const avatarPreviewSrc = avatarBlobUrl ?? user?.avatar_url ?? undefined

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setProfileError('')
    setProfileOk('')
    setProfileSaving(true)
    try {
      const form = new FormData()
      form.append('name', displayName.trim() || user.name)
      if (avatarFile) form.append('avatar', avatarFile)
      const profile = await apiUpdateProfile(form)
      applyMemberProfile(profile)
      setAvatarFile(null)
      setProfileOk('Profile saved.')
    } catch (err) {
      setProfileError(getAuthErrorMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleRemoveAvatar() {
    setProfileError('')
    setProfileOk('')
    setProfileSaving(true)
    try {
      const profile = await apiUpdateProfileJson({ avatar: null })
      applyMemberProfile(profile)
      setAvatarFile(null)
      setProfileOk('Profile photo removed.')
    } catch (err) {
      setProfileError(getAuthErrorMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwOk('')
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      await apiChangePassword(pwCurrent, pwNew)
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
      setPwOk('Password updated.')
    } catch (err) {
      setPwError(getAuthErrorMessage(err))
    } finally {
      setPwSaving(false)
    }
  }

  const email = user?.email ?? ''

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <span className={s.label}>My Profile</span>
          <h1 className={s.heading}>
            Welcome, <em>{user?.name}</em>
          </h1>
          <p className={s.email}>{email}</p>
        </div>

        <section className={s.card} aria-labelledby="profile-settings-heading">
          <h2 id="profile-settings-heading" className={s.cardTitle}>
            Account
          </h2>
          {profileError ? <p className={s.formError}>{profileError}</p> : null}
          {profileOk ? <p className={s.formOk}>{profileOk}</p> : null}

          <form onSubmit={handleProfileSave} className={s.form}>
            <div className={s.avatarRow}>
              <div className={s.avatarPreview}>
                {avatarPreviewSrc ? (
                  <img src={avatarPreviewSrc} alt="" className={s.avatarImg} />
                ) : (
                  <span className={s.avatarFallback}>
                    {initials(displayName || user?.name || '', email)}
                  </span>
                )}
              </div>
              <div className={s.avatarActions}>
                <label className={s.filePick}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className={s.fileInput}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      setAvatarFile(f ?? null)
                    }}
                  />
                  Choose photo
                </label>
                {(user?.avatar_url || avatarFile) && (
                  <button
                    type="button"
                    className={s.textBtn}
                    onClick={() => {
                      if (avatarFile) {
                        setAvatarFile(null)
                        return
                      }
                      void handleRemoveAvatar()
                    }}
                    disabled={profileSaving}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="profile-name">
                Display name
              </label>
              <input
                id="profile-name"
                className={s.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                className={s.inputMuted}
                value={email}
                readOnly
                tabIndex={-1}
              />
              <span className={s.fieldHint}>Email cannot be changed here.</span>
            </div>

            <button type="submit" className={s.submitBtn} disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className={s.card} aria-labelledby="password-heading">
          <h2 id="password-heading" className={s.cardTitle}>
            Password
          </h2>
          {pwError ? <p className={s.formError}>{pwError}</p> : null}
          {pwOk ? <p className={s.formOk}>{pwOk}</p> : null}

          <form onSubmit={handlePasswordSave} className={s.form}>
            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="pw-current">
                Current password
              </label>
              <input
                id="pw-current"
                type="password"
                className={s.input}
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="pw-new">
                New password
              </label>
              <input
                id="pw-new"
                type="password"
                className={s.input}
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className={s.field}>
              <label className={s.fieldLabel} htmlFor="pw-confirm">
                Confirm new password
              </label>
              <input
                id="pw-confirm"
                type="password"
                className={s.input}
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button type="submit" className={s.submitBtn} disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <p className={s.hint}>
          Bottle inventory lives on{' '}
          <Link to="/cabinet">My Cabinet</Link>.
        </p>
      </div>
    </div>
  )
}
