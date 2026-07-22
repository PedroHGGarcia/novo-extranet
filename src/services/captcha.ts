import pb from '@/lib/pocketbase/client'

export interface CaptchaVerificationResult {
  success: boolean
  error?: string
  fallback?: boolean
}

export async function verifyCaptchaToken(token: string): Promise<CaptchaVerificationResult> {
  try {
    const res = await pb.send('/backend/v1/verify-turnstile', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
    })
    return {
      success: res.success === true,
      error: res.error,
      fallback: res.fallback,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao verificar CAPTCHA'
    return { success: false, error: message }
  }
}
