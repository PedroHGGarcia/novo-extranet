import { useState, useRef, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchEmailSuggestions } from '@/services/email-suggestions'

interface EmailTagInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(raw: string): string[] {
  if (!raw || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((s) => String(s).trim()).filter((s) => s.length > 0 && EMAIL_REGEX.test(s))
    }
  } catch {
    /* intentionally ignored */
  }
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && EMAIL_REGEX.test(s))
}

export function EmailTagInput({ value, onChange, className }: EmailTagInputProps) {
  const [tags, setTags] = useState<string[]>(() => parseEmails(value))
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [allEmails, setAllEmails] = useState<string[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    fetchEmailSuggestions()
      .then((emails) => {
        if (mounted) setAllEmails(emails)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const parsed = parseEmails(value)
    if (JSON.stringify(parsed) !== JSON.stringify(tags)) {
      setTags(parsed)
    }
  }, [value])

  useEffect(() => {
    if (!input.trim()) {
      setFilteredSuggestions([])
      return
    }
    const q = input.toLowerCase()
    setFilteredSuggestions(
      allEmails.filter((e) => e.toLowerCase().includes(q) && !tags.includes(e)).slice(0, 5),
    )
  }, [input, allEmails, tags])

  const updateTags = useCallback(
    (newTags: string[]) => {
      setTags(newTags)
      onChange(JSON.stringify(newTags))
    },
    [onChange],
  )

  const addTag = (email: string) => {
    const trimmed = email.trim()
    if (!trimmed) return
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Formato de e-mail inválido.')
      return
    }
    if (tags.includes(trimmed)) {
      setError('Este e-mail já foi adicionado.')
      return
    }
    setError('')
    updateTags([...tags, trimmed])
    setInput('')
  }

  const removeTag = (email: string) => {
    updateTags(tags.filter((t) => t !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleBlur = () => {
    if (input.trim()) {
      addTag(input)
    }
    setTimeout(() => setShowSuggestions(false), 150)
  }

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'w-full min-h-[38px] bg-background border border-input rounded-md px-2 py-1.5 flex flex-wrap gap-1 items-center transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-ring cursor-text',
          className,
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError('')
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? 'Digite um e-mail e pressione Enter...' : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="relative z-50">
          <div className="absolute w-full bg-white dark:bg-popover border border-input rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((email) => (
              <button
                key={email}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTag(email)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
              >
                {email}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
