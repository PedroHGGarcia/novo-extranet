import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Strikethrough, Highlighter, Code } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    if (editorRef.current) editorRef.current.focus()
    handleInput()
  }

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-500 mb-1">{label}</label>}
      <div className="border border-gray-300 rounded-sm bg-white overflow-hidden flex flex-col">
        <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Underline"
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Bullet List"
          >
            <Highlighter size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'PRE')}
            className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Code Block"
          >
            <Code size={14} />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="p-3 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none text-sm text-gray-800"
          style={{ outline: 'none' }}
        />
      </div>
    </div>
  )
}
