import { useState, useEffect } from 'react'

export const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[currency] || currency || 'BRL'
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${code} ${value}`
  }
}

export const mapCurrencyCode = (m?: string): string => {
  if (m === 'Dolar' || m === 'US$') return 'USD'
  if (m === 'Real') return 'BRL'
  if (m === 'Euro') return 'EUR'
  return m || 'USD'
}

interface CurrencyInputProps {
  value: number | undefined
  onChange: (val: number) => void
  currency: string
  className: string
  readOnly?: boolean
  onClick?: () => void
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  className,
  readOnly,
  onClick,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState('')

  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null) {
        setLocalValue('')
      } else {
        setLocalValue(formatCurrency(value, currency))
      }
    }
  }, [value, currency, isFocused])

  return (
    <input
      type={isFocused && !readOnly ? 'number' : 'text'}
      className={className}
      value={isFocused && !readOnly ? (value ?? '') : localValue}
      onFocus={() => !readOnly && setIsFocused(true)}
      onBlur={() => !readOnly && setIsFocused(false)}
      onChange={(e) => {
        if (readOnly) return
        const val = parseFloat(e.target.value)
        onChange(isNaN(val) ? 0 : val)
      }}
      readOnly={readOnly}
      onClick={onClick}
      step="0.01"
    />
  )
}
