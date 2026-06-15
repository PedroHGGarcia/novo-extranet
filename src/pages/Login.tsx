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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-sm shadow-xl border border-slate-100">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <img
            src={logoIn}
            alt="Bener Logo"
            className="w-auto h-16 sm:h-20 max-w-full mb-2 object-contain"
          />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#337ab7] hover:bg-blue-700 text-white uppercase text-xs h-10 font-bold"
          >
            Entrar
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link to="/signup" className="text-[#337ab7] hover:underline">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
