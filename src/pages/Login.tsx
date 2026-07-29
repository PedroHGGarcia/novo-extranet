import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReCaptcha } from '@/components/ReCaptcha'
import { verifyReCaptchaToken } from '@/services/recaptcha'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc-xGktAAAAABkxZBa7Sbd1-dU3QHRJbR6D6C21'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaError, setCaptchaError] = useState(false)
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const validateField = (field: 'email' | 'password', value: string) => {
    const data = { email, password, [field]: value }
    const result = loginSchema.safeParse(data)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field)
      setErrors((prev) => ({ ...prev, [field]: issue ? issue.message : '' }))
    } else {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    validateField('email', e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    validateField('password', e.target.value)
  }

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError(false)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken('')
    toast({
      title: 'reCAPTCHA expirado',
      description:
        'A verificação de segurança expirou. Por favor, marque "Não sou um robô" novamente.',
      variant: 'destructive',
    })
  }

  const handleCaptchaError = () => {
    setCaptchaToken('')
    setCaptchaError(true)
    toast({
      title: 'Erro no reCAPTCHA',
      description:
        'Não foi possível carregar a verificação de segurança. Recarregue a página e tente novamente.',
      variant: 'destructive',
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if (!captchaToken) {
      toast({
        title: 'Verificação de segurança obrigatória',
        description: 'Por favor, marque a caixa "Não sou um robô" para continuar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const captchaResult = await verifyReCaptchaToken(captchaToken)
    if (!captchaResult.success) {
      setLoading(false)
      setCaptchaToken('')
      toast({
        title: 'Falha na verificação do reCAPTCHA',
        description:
          captchaResult.error || 'Falha na verificação do reCAPTCHA. Por favor, tente novamente.',
        variant: 'destructive',
      })
      return
    }

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      let desc = 'Credenciais inválidas'
      if (error?.message) {
        if (error.message.includes('password')) desc = 'Senha incorreta'
        if (error.message.includes('user') || error.message.includes('record'))
          desc = 'Usuário não encontrado'
      }
      toast({
        title: 'Erro ao fazer login',
        description: desc,
        variant: 'destructive',
      })
      setCaptchaToken('')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mt-2">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4 select-none" draggable={false} />
              </div>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`pl-10 h-11 focus-visible:ring-brand-green focus-visible:border-brand-green ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4 select-none" draggable={false} />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className={`pl-10 pr-10 h-11 focus-visible:ring-brand-green focus-visible:border-brand-green ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 select-none" draggable={false} />
                ) : (
                  <Eye className="h-4 w-4 select-none" draggable={false} />
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              draggable={false}
              className="text-xs font-medium text-brand-green hover:underline select-none"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
              Verificação de segurança
            </label>
            <div
              ref={captchaContainerRef}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 overflow-hidden"
            >
              <ReCaptcha
                siteKey={RECAPTCHA_SITE_KEY}
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaError}
                theme="light"
                className="flex justify-center max-w-full overflow-x-auto"
              />
              {captchaError && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Não foi possível carregar a verificação reCAPTCHA. Recarregue a página.
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full h-11 bg-brand-green hover:bg-brand-green/90 text-white font-medium rounded-md tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin select-none" draggable={false} />
            ) : (
              'ENTRAR'
            )}
          </Button>
        </form>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500 select-none">
        <p>
          Desenvolvido por <span className="text-brand-green font-medium">Skip</span> e{' '}
          <span className="text-brand-green font-medium">Pedro Garcia</span>
        </p>
      </footer>
    </div>
  )
}
