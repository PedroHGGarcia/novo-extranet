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
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-50">
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
            <h2 className="text-2xl font-bold text-[#002845]">Recuperar Senha</h2>
            <p className="text-sm text-gray-500 mt-2">
              Informe seu e-mail para receber o link de recuperação.
            </p>
          </div>

          {status === 'success' ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm border border-green-200">
                Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.
              </div>
              <Link to="/login" className="block">
                <Button className="w-full bg-[#00704a] hover:bg-[#00704a]/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors">
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
                  className="h-12 rounded-full px-5 border-gray-200 focus-visible:ring-[#00704a]"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#00704a] hover:bg-[#00704a]/90 text-white uppercase text-sm h-12 rounded-full font-bold transition-colors"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar link'}
              </Button>
              <div className="text-center text-sm pt-2">
                <Link to="/login" className="text-[#00704a] hover:underline font-semibold">
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
