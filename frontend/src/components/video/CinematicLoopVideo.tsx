import { useEffect, useRef } from 'react'
import styles from './CinematicLoopVideo.module.scss'

/** Same tuning as Coming Soon hero */
const FADE_IN_SEC = 0.55
const FADE_OUT_SEC = 0.55
const PLAYBACK_RATE = 0.62

type Props = {
  src: string
  /** When false, only the video stack is rendered (caller supplies overlay). Default true. */
  includeOverlay?: boolean
}

export function CinematicLoopVideo({ src, includeOverlay = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fadeInSecRef = useRef(FADE_IN_SEC)
  const fadeOutSecRef = useRef(FADE_OUT_SEC)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      if (mq.matches) {
        fadeInSecRef.current = 0.22
        fadeOutSecRef.current = 0.22
      } else {
        fadeInSecRef.current = FADE_IN_SEC
        fadeOutSecRef.current = FADE_OUT_SEC
      }
      const v = videoRef.current
      if (v) v.playbackRate = mq.matches ? 1 : PLAYBACK_RATE
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let raf = 0
    const tick = () => {
      const v = videoRef.current
      if (v?.duration && Number.isFinite(v.duration)) {
        const d = v.duration
        const t = v.currentTime
        const maxSeg = d * 0.38
        const fin = Math.min(fadeInSecRef.current, maxSeg)
        const fout = Math.min(fadeOutSecRef.current, maxSeg)

        let op = 1
        if (t < fin) op = fin > 0 ? t / fin : 1
        else if (t > d - fout) op = fout > 0 ? (d - t) / fout : 1
        op = Math.max(0, Math.min(1, op))
        wrap.style.opacity = String(op)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div ref={wrapRef} className={styles.videoWrap} aria-hidden>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster=""
          onLoadedMetadata={(e) => {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            e.currentTarget.playbackRate = reduced ? 1 : PLAYBACK_RATE
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
      {includeOverlay ? <div className={styles.overlay} aria-hidden /> : null}
    </>
  )
}
