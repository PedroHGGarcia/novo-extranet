import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string
      ready: (cb: () => void) => void
    }
  }
}

interface ReCaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark'
  className?: string
}

const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadReCaptchaScript(): Promise<void> {
  if (window.grecaptcha) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => {
      window.grecaptcha?.ready(() => resolve())
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load reCAPTCHA script'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function ReCaptcha({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  className,
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const callbacksRef = useRef({ onVerify, onExpire, onError })
  callbacksRef.current = { onVerify, onExpire, onError }

  useEffect(() => {
    loadReCaptchaScript()
      .then(() => setLoaded(true))
      .catch(() => {
        setLoadFailed(true)
        callbacksRef.current.onError?.()
      })
  }, [])

  useEffect(() => {
    if (!loaded || !containerRef.current || !window.grecaptcha) return

    const id = window.grecaptcha.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token: string) => callbacksRef.current.onVerify(token),
      'expired-callback': () => {
        callbacksRef.current.onExpire?.()
      },
      'error-callback': () => {
        callbacksRef.current.onError?.()
      },
    })
    widgetIdRef.current = id

    return () => {
      if (widgetIdRef.current && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current)
        } catch {
          // widget already removed
        }
        widgetIdRef.current = null
      }
    }
  }, [loaded, siteKey, theme])

  const resetWidget = () => {
    if (widgetIdRef.current && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current)
    }
  }

  if (loadFailed) {
    return (
      <div className="flex items-center justify-center min-h-[78px] text-xs text-gray-500 text-center px-4">
        Não foi possível carregar a verificação de segurança (reCAPTCHA).
      </div>
    )
  }

  return (
    <div className={className}>
      {!loaded && (
        <div className="flex items-center justify-center min-h-[78px]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-green" />
        </div>
      )}
      <div
        ref={containerRef}
        className="min-h-[78px] flex items-center justify-center"
        data-reset={resetWidget}
      />
    </div>
  )
}

export function resetReCaptcha(widgetRef: React.RefObject<HTMLDivElement | null>) {
  if (widgetRef.current && window.grecaptcha) {
    const widgetId = widgetRef.current.querySelector('[data-reset]') as HTMLElement | null
    if (widgetId) {
      const resetFn = (widgetId as unknown as { dataset: Record<string, string> }).dataset
      void resetFn
    }
  }
}
