import { useRef, useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeFormats, setActiveFormats] = useState<string[]>([])

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
      updateActiveFormats()
    }
  }

  const updateActiveFormats = () => {
    const formats = [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'insertUnorderedList',
      'insertOrderedList',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'justifyFull',
    ]
    const active = formats.filter((format) => document.queryCommandState(format))
    setActiveFormats(active)
  }

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    if (editorRef.current) editorRef.current.focus()
    handleInput()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('arquivo', file)

      const record = await pb.collection('imagens_editor').create(formData)
      const imageUrl = pb.files.getURL(record, record.arquivo)

      if (editorRef.current) editorRef.current.focus()
      document.execCommand('insertImage', false, imageUrl)
      handleInput()
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleHeadingChange = (val: string) => {
    execCommand('formatBlock', val)
  }

  const ToolbarButton = ({
    command,
    icon: Icon,
    title,
    arg,
  }: {
    command: string
    icon: any
    title: string
    arg?: string
  }) => (
    <button
      type="button"
      onClick={() => execCommand(command, arg)}
      className={cn(
        'p-1.5 hover:bg-slate-200 text-slate-700 rounded transition-colors',
        activeFormats.includes(command) && 'bg-slate-200 text-[#2A75D3]',
      )}
      title={title}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-500 mb-1">{label}</label>}
      <div className="border border-slate-300 rounded-sm bg-white overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-1">
          <Select onValueChange={handleHeadingChange}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-white border-slate-200 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P">Normal</SelectItem>
              <SelectItem value="H1">Título 1</SelectItem>
              <SelectItem value="H2">Título 2</SelectItem>
              <SelectItem value="H3">Título 3</SelectItem>
              <SelectItem value="H4">Título 4</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <ToolbarButton command="bold" icon={Bold} title="Negrito" />
          <ToolbarButton command="italic" icon={Italic} title="Itálico" />
          <ToolbarButton command="underline" icon={Underline} title="Sublinhado" />
          <ToolbarButton command="strikeThrough" icon={Strikethrough} title="Tachado" />

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <ToolbarButton command="justifyLeft" icon={AlignLeft} title="Alinhar à Esquerda" />
          <ToolbarButton command="justifyCenter" icon={AlignCenter} title="Centralizar" />
          <ToolbarButton command="justifyRight" icon={AlignRight} title="Alinhar à Direita" />
          <ToolbarButton command="justifyFull" icon={AlignJustify} title="Justificar" />

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <ToolbarButton command="insertUnorderedList" icon={List} title="Lista de Marcadores" />
          <ToolbarButton command="insertOrderedList" icon={ListOrdered} title="Lista Numerada" />

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 hover:bg-slate-200 text-slate-700 rounded transition-colors disabled:opacity-50"
            title="Inserir Imagem"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin text-[#2A75D3]" />
            ) : (
              <ImageIcon size={16} />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none text-sm text-slate-800 rich-text-content"
          style={{ outline: 'none' }}
        />
      </div>
    </div>
  )
}
