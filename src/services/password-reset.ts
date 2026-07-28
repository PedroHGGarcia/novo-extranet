import pb from '@/lib/pocketbase/client'

export interface PasswordResetResult {
  success: boolean
  send_count?: number
  max_sends?: number
  error?: string
  cooldown_type?: 'short' | 'long'
  cooldown_remaining_seconds?: number
}

export async function requestPasswordReset(
  email: string,
  captchaToken: string,
): Promise<PasswordResetResult> {
  try {
    const res = await pb.send('/backend/v1/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email, recaptcha_token: captchaToken }),
      headers: { 'Content-Type': 'application/json' },
    })
    return {
      success: res.success === true,
      send_count: res.send_count,
      max_sends: res.max_sends,
      error: res.error,
      cooldown_type: res.cooldown_type,
      cooldown_remaining_seconds: res.cooldown_remaining_seconds,
    }
  } catch (err: unknown) {
    const e = err as {
      response?: {
        data?: {
          error?: string
          cooldown_type?: string
          cooldown_remaining_seconds?: number
          send_count?: number
        }
      }
    }
    const data = e?.response?.data
    return {
      success: false,
      error: data?.error || 'Ocorreu um erro. Tente novamente.',
      cooldown_type: data?.cooldown_type as 'short' | 'long' | undefined,
      cooldown_remaining_seconds: data?.cooldown_remaining_seconds,
      send_count: data?.send_count,
    }
  }
}
