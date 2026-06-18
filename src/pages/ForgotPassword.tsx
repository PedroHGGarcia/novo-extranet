import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'

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
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-50">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brand-green/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] z-20 px-4">
        <div className="bg-white rounded-[32px] shadow-2xl p-8 sm:p-10 w-full space-y-8">
          <div className="text-center flex flex-col items-center justify-center pt-4">
            <div className="flex flex-col items-center justify-center mb-8 select-none text-brand-green">
              <h1 className="text-4xl font-black tracking-widest">BENER</h1>
              <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase mt-1">
                Máquinas que transformam
              </p>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Recuperar Senha</h2>
            <p className="text-sm text-slate-500 mt-2">
              Informe seu e-mail para receber o link de recuperação.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm border border-green-200">
                Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.
              </div>
              <Link to="/login" className="block">
                <Button className="w-full bg-brand-green hover:bg-brand-green/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  className="h-12 rounded-full px-5 border-gray-200 focus-visible:ring-brand-green"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link'}
              </Button>
              <div className="text-center text-sm pt-2">
                <Link to="/login" className="text-brand-green hover:underline font-semibold">
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
