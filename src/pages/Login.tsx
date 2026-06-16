import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signIn } = useAuth()
  const navigate = useNavigate()

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

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: 'Credenciais inválidas',
        variant: 'destructive',
      })
    } else {
      navigate('/')
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
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 h-11 focus-visible:ring-[#00704a] focus-visible:border-[#00704a] ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 pr-10 h-11 focus-visible:ring-[#00704a] focus-visible:border-[#00704a] ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
              className="text-xs font-medium text-[#00704a] hover:underline select-none"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#00704a] hover:bg-[#005a3b] text-white font-medium rounded-md tracking-wide"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin select-none" draggable={false} />
            ) : (
              'ENTRAR'
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link
            to="/signup"
            draggable={false}
            className="font-medium text-[#00704a] hover:underline select-none"
          >
            Cadastre-se
          </Link>
        </div>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500 select-none">
        <p>
          Desenvolvido por <span className="text-[#00704a] font-medium">Skip</span> e{' '}
          <span className="text-[#00704a] font-medium">Pedro Garcia</span>
        </p>
      </footer>
    </div>
  )
}
