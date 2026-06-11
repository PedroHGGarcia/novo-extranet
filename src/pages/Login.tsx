import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navigate } from 'react-router-dom'

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
    <div className="min-h-screen flex items-center justify-center bg-brand-green">
      <div className="bg-white p-8 rounded-md w-full max-w-sm shadow-lg">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-brand-green">BENER</span>
          <span className="mt-[2px] text-[10px] uppercase tracking-[0.2em] text-brand-green/80">
            Máquinas que transformam
          </span>
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
        </form>
      </div>
    </div>
  )
}
