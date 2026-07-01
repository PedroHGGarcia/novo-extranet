import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignaturePadProps {
  onConfirm: (blob: Blob) => void
  disabled?: boolean
  className?: string
}

export function SignaturePad({ onConfirm, disabled, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(rect.width, 100) * ratio
    canvas.height = Math.max(rect.height, 100) * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000'
    ctxRef.current = ctx
  }, [])

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    isDrawing.current = true
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing.current || disabled) return
    e.preventDefault()
    const ctx = ctxRef.current
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDraw = () => {
    isDrawing.current = false
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob)
    }, 'image/png')
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg bg-white touch-none cursor-crosshair"
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={stopDraw}
        onPointerLeave={stopDraw}
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || !hasSignature}
          className="gap-2"
        >
          <Eraser className="h-4 w-4" /> Limpar
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={disabled || !hasSignature}
          className="gap-2 bg-brand-success hover:bg-brand-success/90"
        >
          <Check className="h-4 w-4" /> Confirmar Assinatura
        </Button>
      </div>
    </div>
  )
}
