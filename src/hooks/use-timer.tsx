import { useState, useEffect, useRef } from "react"

const KEY_START   = "timer_start"
const KEY_ELAPSED = "timer_elapsed"
const KEY_RUNNING = "timer_running"

export function useTimer() {
  const [elapsed, setElapsed] = useState(() => {
    const saved = localStorage.getItem(KEY_ELAPSED)
    return saved ? Number(saved) : 0
  })

  const [running, setRunning] = useState(
    () => localStorage.getItem(KEY_RUNNING) === "true"
  )

  const exceeded = elapsed > 10 * 60 * 60 * 1000
  const rafRef = useRef<number | null>(null)

  const start = () => {
    const startTime = Date.now() - elapsed          // desconta o já acumulado
    localStorage.setItem(KEY_START,   String(startTime))
    localStorage.setItem(KEY_RUNNING, "true")
    setRunning(true)
  }

  const pause = () => {
    //persiste o elapsed ATUAL antes de parar
    localStorage.setItem(KEY_ELAPSED, String(elapsed))
    localStorage.setItem(KEY_RUNNING, "false")
    setRunning(false)
  }

  const reset = () => {
    localStorage.removeItem(KEY_START)
    localStorage.removeItem(KEY_ELAPSED)
    localStorage.setItem(KEY_RUNNING, "false")
    setElapsed(0)
    setRunning(false)
  }

  //elapsed FORA das deps — lê o startTime do localStorage diretamente
  useEffect(() => {
    if (!running) return

    const tick = () => {
      const raw = localStorage.getItem(KEY_START)
      if (raw) setElapsed(Date.now() - Number(raw))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [running])  // ← só "running", sem "elapsed"

  // sincroniza entre abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_ELAPSED) setElapsed(e.newValue ? Number(e.newValue) : 0)
      if (e.key === KEY_RUNNING) setRunning(e.newValue === "true")
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])  // ← sem "exceeded" nas deps (não era necessário)

  return { elapsed, running, start, pause, reset, exceeded }
}