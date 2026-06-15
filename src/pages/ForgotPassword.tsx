import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import logoIn from '@/assets/bener-thumb-c5c1b.png'
import pb from '@/lib/pocketbase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await pb.collection('users').requestPasswordReset(email)
      setStatus('success')
    } catch {
      setStatus('success')
    }
  }

  return (
    <div className="min-h-screen w-full flex lg:grid lg:grid-cols-2 relative">
      <div className="absolute inset-0 lg:relative lg:block z-0 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary/60 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img
          src="https://img.usecurling.com/p/800/1000?q=cnc%20machinery"
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
              className="w-auto h-16 sm:h-20 max-w-full mb-4 object-contain"
            />
            <h2 className="text-2xl font-bold text-gray-900">Recuperar Senha</h2>
            <p className="text-sm text-gray-500 mt-2">
              Informe seu e-mail para receber o link de recuperação.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 text-green-800 p-4 rounded-md text-sm border border-green-200">
                Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.
              </div>
              <Link to="/login" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white uppercase text-xs h-10 font-bold">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="focus-visible:ring-primary"
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white uppercase text-xs h-10 font-bold"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
              <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Voltar para o Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
