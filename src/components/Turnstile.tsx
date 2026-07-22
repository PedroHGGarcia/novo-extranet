import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
  }
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  className?: string
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Turnstile script'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const callbacksRef = useRef({ onVerify, onExpire, onError })
  callbacksRef.current = { onVerify, onExpire, onError }

  useEffect(() => {
    loadTurnstileScript()
      .then(() => setLoaded(true))
      .catch(() => {
        setLoadFailed(true)
        callbacksRef.current.onError?.()
      })
  }, [])

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile) return

    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token: string) => callbacksRef.current.onVerify(token),
      'expired-callback': () => callbacksRef.current.onExpire?.(),
      'error-callback': () => callbacksRef.current.onError?.(),
    })
    widgetIdRef.current = id

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [loaded, siteKey, theme])

  if (loadFailed) {
    return (
      <div className="flex items-center justify-center min-h-[65px] text-xs text-gray-500 text-center px-4">
        Não foi possível carregar a verificação de segurança.
      </div>
    )
  }

  return (
    <div className={className}>
      {!loaded && (
        <div className="flex items-center justify-center min-h-[65px]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-green" />
        </div>
      )}
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
    </div>
  )
}
