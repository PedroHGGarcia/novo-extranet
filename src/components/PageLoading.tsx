import { Loader2 } from 'lucide-react'

export function PageLoading() {
  return (
    <div className="flex h-[calc(100vh-5rem)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
