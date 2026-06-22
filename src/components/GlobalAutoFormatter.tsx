import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export const formatCNPJ = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

export const formatCEP = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

export const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14)
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

const fillField = (matchers: string[], value: string) => {
  if (!value) return
  const inputs = Array.from(document.querySelectorAll('input'))
  const target = inputs.find((i) => {
    const label = i.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || ''
    const placeholder = i.placeholder.toLowerCase()
    return matchers.some((m) => label.includes(m) || placeholder.includes(m))
  })
  if (target) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set
    nativeSetter?.call(target, value)
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function GlobalAutoFormatter() {
  const fetchingRef = useRef<{ cnpj: string; cep: string }>({ cnpj: '', cep: '' })

  useEffect(() => {
    const handleInput = async (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.tagName !== 'INPUT') return

      const val = target.value
      const label = target.closest('div')?.querySelector('label')?.textContent?.toLowerCase() || ''
      const placeholder = target.placeholder.toLowerCase()

      let masked = val

      if (label.includes('cnpj') || placeholder.includes('cnpj') || label.includes('documento')) {
        masked = formatCNPJ(val)
        const digits = masked.replace(/\D/g, '')

        if (digits.length === 14 && fetchingRef.current.cnpj !== digits) {
          fetchingRef.current.cnpj = digits
          try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
            const data = await res.json()
            if (data.message || data.erro) {
              toast.error('CNPJ não encontrado. Preencha manualmente.')
            } else {
              fillField(['razão social', 'razao social'], data.razao_social || '')
              fillField(['fantasia'], data.nome_fantasia || data.razao_social || '')
              fillField(['cep'], data.cep ? formatCEP(data.cep) : '')
              fillField(['logradouro', 'endereço', 'endereco'], data.logradouro || '')
              fillField(['número', 'numero'], data.numero || '')
              fillField(['bairro'], data.bairro || '')
              fillField(['cidade', 'município', 'municipio'], data.municipio || '')
              fillField(['estado', 'uf'], data.uf || '')
              toast.success('Dados da empresa preenchidos automaticamente.')
            }
          } catch (error) {
            toast.error('Erro ao buscar CNPJ. Preencha manualmente.')
          }
        }
      } else if (label.includes('cep') || placeholder.includes('cep')) {
        masked = formatCEP(val)
        const digits = masked.replace(/\D/g, '')

        if (digits.length === 8 && fetchingRef.current.cep !== digits) {
          fetchingRef.current.cep = digits
          try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
            const data = await res.json()
            if (data.erro) {
              toast.error('CEP não encontrado. Preencha manualmente.')
            } else {
              fillField(['logradouro', 'endereço', 'endereco'], data.logradouro || '')
              fillField(['bairro'], data.bairro || '')
              fillField(['cidade', 'município', 'municipio'], data.localidade || '')
              fillField(['estado', 'uf'], data.uf || '')
              toast.success('Endereço preenchido automaticamente.')
            }
          } catch (error) {
            toast.error('Erro ao buscar CEP. Preencha manualmente.')
          }
        }
      } else if (
        label.includes('telefone') ||
        label.includes('celular') ||
        placeholder.includes('telefone') ||
        placeholder.includes('celular')
      ) {
        masked = formatPhone(val)
      }

      if (masked !== val) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set
        nativeSetter?.call(target, masked)
        target.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    document.addEventListener('input', handleInput, { capture: true })
    return () => document.removeEventListener('input', handleInput, { capture: true })
  }, [])

  return null
}
