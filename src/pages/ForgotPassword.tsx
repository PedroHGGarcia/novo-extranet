import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { ReCaptcha } from '@/components/ReCaptcha'
import { usePasswordReset } from '@/hooks/use-password-reset'

const SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc-xGktAAAAABkxZBa7Sbd1-dU3QHRJbR6D6C21'

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [resendToken, setResendToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)

  const { status, errorMessage, sendCount, resendState, countdown, submit, resend } =
    usePasswordReset()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return
    await submit(email, captchaToken)
    setCaptchaToken(null)
  }

  const handleResend = async () => {
    if (!resendToken) return
    await resend(resendToken)
    setResendToken(null)
    setCaptchaKey((k) => k + 1)
  }

  const remainingResends = Math.max(0, 3 - sendCount)
  const resendDisabled = resendState !== 'ready' || !resendToken

  const resendLabel =
    resendState === 'countdown_short'
      ? `Aguarde ${countdown}s para reenviar`
      : resendState === 'countdown_long'
        ? `Limite atingido. Tente em ${formatMMSS(countdown)}`
        : resendState === 'sending'
          ? 'Enviando...'
          : 'Reenviar Email'

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-50">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brand-green/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] z-20 px-4">
        <div className="bg-white rounded-[32px] shadow-2xl p-8 sm:p-10 w-full space-y-6">
          <div className="text-center flex flex-col items-center justify-center pt-2">
            <div className="flex flex-col items-center justify-center mb-6 select-none text-brand-green">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Extranet Gourmet
              </h1>
              <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-brand-green mt-1">
                Portal de Vendas & Gestão
              </p>
            </div>
            {status !== 'success' ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900">Recuperar Senha</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Informe seu e-mail para receber o link de recuperação.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-900">E-mail Enviado</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </>
            )}
          </div>

          {status !== 'success' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-medium border border-red-200 text-center animate-fade-in">
                  {errorMessage}
                </div>
              )}
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="h-12 rounded-full px-5 border-gray-200 focus-visible:ring-brand-green"
              />
              <div className="flex justify-center py-2 min-h-[78px]">
                <ReCaptcha
                  siteKey={SITE_KEY}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors disabled:opacity-50"
                disabled={!captchaToken || status === 'loading'}
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link'}
              </Button>
              <div className="text-center text-sm pt-1">
                <Link to="/login" className="text-brand-green hover:underline font-semibold">
                  Voltar para o Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-green-50 text-green-800 p-4 rounded-2xl text-sm border border-green-200 leading-relaxed">
                Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.
              </div>

              {remainingResends > 0 && resendState !== 'countdown_long' && (
                <p className="text-center text-xs text-slate-500">
                  Reenvios restantes: {remainingResends}
                </p>
              )}

              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs font-medium border border-red-200 text-center animate-fade-in">
                  {errorMessage}
                </div>
              )}

              {resendState !== 'countdown_long' && (
                <div className="flex justify-center py-2 min-h-[78px]">
                  <ReCaptcha
                    key={captchaKey}
                    siteKey={SITE_KEY}
                    onVerify={(token) => setResendToken(token)}
                    onExpire={() => setResendToken(null)}
                    onError={() => setResendToken(null)}
                  />
                </div>
              )}

              <Button
                onClick={handleResend}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={resendDisabled}
              >
                {resendLabel}
              </Button>

              <div className="text-center text-sm pt-1">
                <Link to="/login" className="text-brand-green hover:underline font-semibold">
                  Voltar para o Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
