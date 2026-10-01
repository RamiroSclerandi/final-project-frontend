import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000

let nowMs = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    nowMs = Date.now()
    timer = setInterval(() => {
      nowMs = Date.now()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(timer)
  }
}

const getSnapshot = () => nowMs

/** Current time in ms from one app-wide clock that ticks every 30 s while in use. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
