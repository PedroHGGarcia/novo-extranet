import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, Navigate } from 'react-router-dom'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { signUp, isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    const { error: err } = await signUp(email, password, name)
    if (err) {
      const fieldErrors = extractFieldErrors(err)
      if (fieldErrors.email) {
        setError('Este email já está em uso ou é inválido.')
      } else {
        setError(getErrorMessage(err) || 'Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-green">
      <div className="bg-white p-8 rounded-md w-full max-w-sm shadow-lg">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-brand-green">BENER</span>
          <span className="mt-[2px] text-[10px] uppercase tracking-[0.2em] text-brand-green/80">
            Cadastre-se
          </span>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            minLength={8}
          />
          <Input
            type="password"
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-[#337ab7] hover:bg-blue-700 text-white uppercase text-xs h-10 font-bold"
          >
            Cadastrar
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-[#337ab7] hover:underline">
              Já tem uma conta? Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
