import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logoIn from '@/assets/bener-thumb-c5c1b.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError('E-mail é obrigatório.')
      return false
    }
    if (!emailRegex.test(value)) {
      setEmailError('E-mail inválido')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Senha é obrigatória.')
      return false
    }
    if (value.length < 8) {
      setPasswordError('Senha muito curta')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) return

    const { error: err } = await signIn(email, password)
    if (err) setError('Email ou senha inválidos.')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-50 animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#00704a]/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#00704a]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] z-20 px-4">
        <div className="bg-white rounded-[32px] shadow-2xl p-8 sm:p-10 w-full space-y-8">
          <div className="text-center flex flex-col items-center justify-center">
            <img
              src={logoIn}
              alt="Bener Logo"
              className="w-auto h-20 sm:h-24 max-w-full mb-6 object-contain"
            />
            <h2 className="text-2xl font-bold text-[#002845]">Bem-vindo(a)</h2>
            <p className="text-sm text-gray-500 mt-2">Acesse sua conta para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) validateEmail(e.target.value)
                  }}
                  onBlur={() => validateEmail(email)}
                  required
                  className="h-12 rounded-full px-5 border-gray-200 focus-visible:ring-[#00704a]"
                />
                {emailError && <p className="text-red-500 text-xs mt-1 ml-4">{emailError}</p>}
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError) validatePassword(e.target.value)
                    }}
                    onBlur={() => validatePassword(password)}
                    required
                    className="h-12 rounded-full px-5 border-gray-200 focus-visible:ring-[#00704a] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-xs mt-1 ml-4">{passwordError}</p>}
              </div>
              <div className="flex justify-end px-2">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#00704a] hover:underline font-semibold"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-[#00704a] hover:bg-[#00704a]/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors"
            >
              Entrar
            </Button>
            <div className="text-center text-sm pt-2">
              <Link to="/signup" className="text-[#00704a] hover:underline font-semibold">
                Não tem uma conta? Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center z-20 px-4">
        <p className="text-xs text-gray-500">
          Desenvolvido por <span className="text-[#00704a] font-medium">Skip</span> e{' '}
          <span className="text-[#00704a] font-medium">Pedro Garcia</span>
        </p>
      </div>
    </div>
  )
}
