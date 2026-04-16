import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 1800, active: boolean) {
  const [count, setCount] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    if (!active || done.current) return
    done.current = true

    const step = target / (duration / 16)
    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [active, target, duration])

  return count
}
