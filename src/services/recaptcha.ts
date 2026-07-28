import pb from '@/lib/pocketbase/client'

export interface ReCaptchaVerificationResult {
  success: boolean
  error?: string
  fallback?: boolean
}

export async function verifyReCaptchaToken(token: string): Promise<ReCaptchaVerificationResult> {
  try {
    const res = await pb.send('/backend/v1/verify-recaptcha', {
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
    const message =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      (err as { response?: { data?: { error?: string } } }).response?.data?.error
        ? (err as { response: { data: { error: string } } }).response.data.error
        : 'Falha na verificação do reCAPTCHA. Por favor, tente novamente.'
    return { success: false, error: message }
  }
}
