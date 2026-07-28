import { useState, useEffect, useCallback, useRef } from 'react'
import { requestPasswordReset } from '@/services/password-reset'

export type ResetStatus = 'idle' | 'loading' | 'success'
export type ResendState = 'countdown_short' | 'ready' | 'countdown_long' | 'sending'

export function usePasswordReset() {
  const [status, setStatus] = useState<ResetStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sendCount, setSendCount] = useState(0)
  const [resendState, setResendState] = useState<ResendState>('countdown_short')
  const [countdown, setCountdown] = useState(0)
  const [emailAddr, setEmailAddr] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startCountdown = useCallback(
    (seconds: number, type: 'short' | 'long') => {
      clearTimer()
      setCountdown(seconds)
      setResendState(type === 'short' ? 'countdown_short' : 'countdown_long')
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimer()
            setResendState('ready')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [clearTimer],
  )

  const submit = useCallback(
    async (email: string, captchaToken: string) => {
      setStatus('loading')
      setErrorMessage(null)
      const result = await requestPasswordReset(email, captchaToken)

      if (result.success) {
        const sc = result.send_count || 1
        setEmailAddr(email)
        setSendCount(sc)
        setStatus('success')
        if (sc >= 3) startCountdown(15 * 60, 'long')
        else startCountdown(60, 'short')
      } else if (result.cooldown_type === 'long' && result.cooldown_remaining_seconds) {
        setEmailAddr(email)
        setSendCount(result.send_count || 3)
        setStatus('success')
        startCountdown(result.cooldown_remaining_seconds, 'long')
      } else if (result.cooldown_type === 'short' && result.cooldown_remaining_seconds) {
        setEmailAddr(email)
        setSendCount(result.send_count || 1)
        setStatus('success')
        startCountdown(result.cooldown_remaining_seconds, 'short')
      } else {
        setStatus('idle')
        setErrorMessage(result.error || 'Ocorreu um erro. Tente novamente.')
      }
    },
    [startCountdown],
  )

  const resend = useCallback(
    async (captchaToken: string) => {
      setResendState('sending')
      setErrorMessage(null)
      const result = await requestPasswordReset(emailAddr, captchaToken)

      if (result.success) {
        const sc = result.send_count || 1
        setSendCount(sc)
        if (sc >= 3) startCountdown(15 * 60, 'long')
        else startCountdown(60, 'short')
      } else if (result.cooldown_type === 'long' && result.cooldown_remaining_seconds) {
        setSendCount(result.send_count || 3)
        startCountdown(result.cooldown_remaining_seconds, 'long')
      } else if (result.cooldown_type === 'short' && result.cooldown_remaining_seconds) {
        setSendCount(result.send_count || sendCount)
        startCountdown(result.cooldown_remaining_seconds, 'short')
      } else {
        setResendState('ready')
        setErrorMessage(result.error || 'Ocorreu um erro ao reenviar. Tente novamente.')
      }
    },
    [emailAddr, sendCount, startCountdown],
  )

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    status,
    errorMessage,
    sendCount,
    resendState,
    countdown,
    email: emailAddr,
    submit,
    resend,
  }
}
