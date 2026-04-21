import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createMemberRecipe, previewRecipeImage } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import p from '@/pages/Profile/Profile.module.scss'
import c from '@/pages/MyRecipes/CreateRecipe.module.scss'

export function CreateRecipe() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null)
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null)
  const [previewPipeline, setPreviewPipeline] = useState<'rembg' | 'passthrough' | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const processedUrlRef = useRef<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!imageFile) {
      setOriginalPreviewUrl(null)
      setProcessedPreviewUrl(null)
      setPreviewPipeline(null)
      setPreviewError(null)
      setPreviewLoading(false)
      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current)
        processedUrlRef.current = null
      }
      return
    }

    const originalUrl = URL.createObjectURL(imageFile)
    setOriginalPreviewUrl(originalUrl)

    const ac = new AbortController()
    setPreviewLoading(true)
    setPreviewError(null)
    setProcessedPreviewUrl(null)
    setPreviewPipeline(null)
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current)
      processedUrlRef.current = null
    }

    previewRecipeImage(imageFile, ac.signal)
      .then(({ blob, pipeline }) => {
        if (ac.signal.aborted) return
        const u = URL.createObjectURL(blob)
        processedUrlRef.current = u
        setProcessedPreviewUrl(u)
        setPreviewPipeline(pipeline)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setPreviewError(err instanceof ApiError ? err.message : 'Could not build preview.')
      })
      .finally(() => {
        if (!ac.signal.aborted) setPreviewLoading(false)
      })

    return () => {
      ac.abort()
      URL.revokeObjectURL(originalUrl)
      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current)
        processedUrlRef.current = null
      }
    }
  }, [imageFile])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const t = title.trim()
    const d = description.trim()
    const i = instructions.trim()
    if (!t || !d || !i) {
      setError('Please fill in title, description, and instructions.')
      return
    }
    setSubmitting(true)
    try {
      const payload =
        imageFile !== null
          ? (() => {
              const fd = new FormData()
              fd.append('title', t)
              fd.append('description', d)
              fd.append('instructions', i)
              fd.append('image', imageFile)
              return fd
            })()
          : { title: t, description: d, instructions: i }
      const created = await createMemberRecipe(payload)
      navigate(`/recipes/${created.slug}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save recipe.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={p.page}>
      <div className={p.inner}>
        <header className={p.header}>
          <span className={p.label}>Personal</span>
          <h1 className={p.heading}>
            New <em>recipe</em>
          </h1>
          <p className={p.email}>
            A minimal draft — title, description, and how to build it. You can refine this flow later.
          </p>
          <p className={p.fieldHint}>
            <Link to="/my-recipes" className={p.inlineLink}>
              Back to My Recipes
            </Link>
          </p>
        </header>

        <div className={p.card}>
          <h2 className={p.cardTitle}>Details</h2>
          {error ? <p className={p.formError}>{error}</p> : null}
          <form className={p.form} onSubmit={(e) => void onSubmit(e)}>
            <div className={p.field}>
              <label className={p.fieldLabel} htmlFor="recipe-title">
                Title
              </label>
              <input
                id="recipe-title"
                className={p.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
                disabled={submitting}
                maxLength={200}
              />
            </div>
            <div className={p.field}>
              <label className={p.fieldLabel} htmlFor="recipe-description">
                Description
              </label>
              <textarea
                id="recipe-description"
                className={p.input}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className={p.field}>
              <label className={p.fieldLabel} htmlFor="recipe-instructions">
                Instructions
              </label>
              <textarea
                id="recipe-instructions"
                className={p.input}
                rows={8}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={submitting}
                placeholder="One step per line works well."
              />
            </div>
            <div className={p.field}>
              <label className={p.fieldLabel} htmlFor="recipe-image">
                Photo <span className={p.fieldHint}>(optional)</span>
              </label>
              <input
                id="recipe-image"
                className={p.input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={submitting}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setImageFile(f ?? null)
                }}
              />
              {originalPreviewUrl ? (
                <div className={c.previewWrap}>
                  <div className={c.previewCompare}>
                    <div className={c.previewPane}>
                      <p className={c.previewCaption}>Original upload</p>
                      <div className={c.previewFrame}>
                        <img
                          className={c.previewImg}
                          src={originalPreviewUrl}
                          alt=""
                        />
                      </div>
                    </div>
                    <div className={c.previewPane}>
                      <p className={c.previewCaption}>Preview (before save)</p>
                      <div
                        className={`${c.previewFrame} ${c.previewFrameTransparent}`}
                      >
                        {previewLoading ? (
                          <span className={c.previewLoading}>Building preview…</span>
                        ) : previewError ? (
                          <span className={c.previewLoading}>{previewError}</span>
                        ) : processedPreviewUrl ? (
                          <img
                            className={c.previewImg}
                            src={processedPreviewUrl}
                            alt=""
                          />
                        ) : null}
                      </div>
                      {previewPipeline === 'passthrough' && processedPreviewUrl && !previewError ? (
                        <p className={c.previewHint}>
                          Background is not removed in this preview. Install{' '}
                          <code style={{ fontSize: '0.85em' }}>rembg</code> on the API server for
                          cutout previews that match the save-time pipeline.
                        </p>
                      ) : null}
                      {previewPipeline === 'rembg' && processedPreviewUrl && !previewError ? (
                        <p className={c.previewHint}>
                          Checkerboard indicates transparency — compare with the original on the left.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${p.inlineLink} ${c.previewRemoveBtn}`}
                    onClick={() => setImageFile(null)}
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>
            <button type="submit" className={p.submitBtn} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save recipe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
