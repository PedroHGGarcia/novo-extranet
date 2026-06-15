import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, Navigate } from 'react-router-dom'
import logoIn from '@/assets/bener-thumb-c5c1b.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) setError('Email ou senha inválidos.')
  }

  return (
    <div className="min-h-screen w-full flex lg:grid lg:grid-cols-2 relative">
      <div className="absolute inset-0 lg:relative lg:block z-0 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary/60 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img
          src="https://img.usecurling.com/p/800/1000?q=industrial%20machinery"
          alt="Industrial machinery"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="flex w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-20 bg-transparent lg:bg-slate-50 min-h-screen lg:min-h-0 relative">
        <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-xl shadow-2xl border border-slate-100">
          <div className="text-center flex flex-col items-center justify-center">
            <img
              src={logoIn}
              alt="Bener Logo"
              className="w-auto h-16 sm:h-20 max-w-full mb-2 object-contain"
            />
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Bem-vindo(a)</h2>
            <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-primary"
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white uppercase text-xs h-10 font-bold"
            >
              Entrar
            </Button>
            <div className="mt-4 text-center text-sm">
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Não tem uma conta? Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
