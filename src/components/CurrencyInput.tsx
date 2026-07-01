import { useRef, useEffect, useState } from 'react'

function getSeparators(currency: string) {
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[currency] || currency || 'BRL'
  return code === 'BRL' ? { decimal: ',', thousands: '.' } : { decimal: '.', thousands: ',' }
}

function formatDisplay(value: number, currency: string, maxDecimals: number) {
  const { decimal, thousands } = getSeparators(currency)
  const str = String(value || 0)
  const [intPart, decPart] = str.split('.')
  const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, thousands)
  if (decPart) {
    const trimmed = decPart.substring(0, maxDecimals)
    if (trimmed) return `${formattedInt}${decimal}${trimmed}`
  }
  return formattedInt
}

interface CurrencyInputProps {
  value: number
  currency: string
  onChange: (value: number) => void
  className?: string
  maxDecimals?: number
}

export function CurrencyInput({
  value,
  currency,
  onChange,
  className,
  maxDecimals = 2,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [display, setDisplay] = useState(() => formatDisplay(value, currency, maxDecimals))
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!isTypingRef.current) {
      setDisplay(formatDisplay(value, currency, maxDecimals))
    }
    isTypingRef.current = false
  }, [value, currency, maxDecimals])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true
    const input = e.target
    const raw = input.value
    const cursorPos = input.selectionStart ?? raw.length

    const { decimal, thousands } = getSeparators(currency)

    const cleaned = raw.split(thousands).join('')
    const sepIdx = cleaned.indexOf(decimal)

    let intPart: string
    let decPart = ''
    let hasDecimal = false

    if (sepIdx >= 0) {
      intPart = cleaned.substring(0, sepIdx).replace(/\D/g, '')
      decPart = cleaned.substring(sepIdx + 1).replace(/\D/g, '')
      hasDecimal = true
    } else {
      intPart = cleaned.replace(/\D/g, '')
    }

    intPart = intPart.replace(/^0+/, '') || '0'

    if (decPart.length > maxDecimals) {
      decPart = decPart.substring(0, maxDecimals)
    }

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands)
    const formatted = hasDecimal ? `${formattedInt}${decimal}${decPart}` : formattedInt

    const sigCharsBeforeCursor = raw.substring(0, cursorPos).split(thousands).join('').length
    let newPos = 0
    let sigCharsSeen = 0
    for (let i = 0; i < formatted.length; i++) {
      if (formatted[i] !== thousands) sigCharsSeen++
      if (sigCharsSeen >= sigCharsBeforeCursor) {
        newPos = i + 1
        break
      }
    }
    if (sigCharsSeen < sigCharsBeforeCursor) newPos = formatted.length

    setDisplay(formatted)

    const numStr = intPart + (decPart ? '.' + decPart : '')
    onChange(parseFloat(numStr) || 0)

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newPos, newPos)
    })
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      className={className}
    />
  )
}
