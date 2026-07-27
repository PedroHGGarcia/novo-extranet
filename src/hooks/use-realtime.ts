import { useEffect, useRef, useState } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

function forceRealtimeReconnect() {
  try {
    const rt = (pb as any).realtime
    if (rt && typeof rt.disconnect === 'function') {
      rt.disconnect()
    }
  } catch {
    // best effort — ignore
  }
}

export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const [connectionError, setConnectionError] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false
    let retryCount = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const attemptSubscribe = () => {
      if (cancelled) return

      pb.collection<TRecord>(collectionName)
        .subscribe('*', (e) => {
          callbackRef.current(e)
        })
        .then((fn) => {
          if (cancelled) {
            fn().catch(() => {})
            return
          }
          unsubscribeFn = fn
          retryCount = 0
          setConnectionError(false)
        })
        .catch(() => {
          if (cancelled) return
          retryCount++
          if (retryCount <= MAX_RETRIES) {
            forceRealtimeReconnect()
            const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1)
            timeoutId = setTimeout(() => attemptSubscribe(), delay)
          } else {
            setConnectionError(true)
          }
        })
    }

    attemptSubscribe()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])

  return { connectionError }
}

export default useRealtime
