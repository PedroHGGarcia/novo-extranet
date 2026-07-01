import { useRef, useEffect, useState, useCallback } from 'react'
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
  WrapText,
  Square,
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

interface ResizeState {
  img: HTMLImageElement
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  handle: string
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [overlayPos, setOverlayPos] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const [draggedImg, setDraggedImg] = useState<HTMLImageElement | null>(null)
  const [dragCaretPos, setDragCaretPos] = useState<{
    x: number
    y: number
    height: number
  } | null>(null)
  const [imgAlign, setImgAlign] = useState<string>('')
  const [imgWrap, setImgWrap] = useState<string>('inline')
  const overlayRef = useRef<HTMLDivElement>(null)
  const shiftPressedRef = useRef(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const updateOverlay = useCallback(() => {
    if (selectedImg && editorRef.current) {
      const editorRect = editorRef.current.getBoundingClientRect()
      const imgRect = selectedImg.getBoundingClientRect()
      setOverlayPos({
        top: imgRect.top - editorRect.top + editorRef.current.scrollTop,
        left: imgRect.left - editorRect.left + editorRef.current.scrollLeft,
        width: imgRect.width,
        height: imgRect.height,
      })
    } else {
      setOverlayPos(null)
    }
  }, [selectedImg])

  useEffect(() => {
    updateOverlay()
  }, [updateOverlay, selectedImg])

  useEffect(() => {
    const handleScroll = () => updateOverlay()
    const editor = editorRef.current
    if (editor) {
      editor.addEventListener('scroll', handleScroll)
    }
    window.addEventListener('resize', handleScroll)
    return () => {
      if (editor) editor.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [updateOverlay])

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

  const alignImage = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImg) return
    selectedImg.style.float = ''
    selectedImg.style.display = ''
    selectedImg.style.margin = ''
    selectedImg.style.verticalAlign = ''
    if (alignment === 'left') {
      selectedImg.style.float = 'left'
      selectedImg.style.margin = '0.5em 10px 0.5em 0'
      selectedImg.setAttribute('data-align', 'left')
    } else if (alignment === 'center') {
      selectedImg.style.display = 'block'
      selectedImg.style.margin = '0.5em auto'
      selectedImg.setAttribute('data-align', 'center')
    } else {
      selectedImg.style.float = 'right'
      selectedImg.style.margin = '0.5em 0 0.5em 10px'
      selectedImg.setAttribute('data-align', 'right')
    }
    selectedImg.setAttribute('data-wrap', 'inline')
    setImgAlign(alignment)
    setImgWrap('inline')
    updateOverlay()
    handleInput()
  }

  const toggleWrapping = (mode: 'inline' | 'block') => {
    if (!selectedImg) return
    if (mode === 'block') {
      selectedImg.style.display = 'block'
      selectedImg.style.float = ''
      selectedImg.style.margin = '0.5em auto'
      selectedImg.style.verticalAlign = ''
      selectedImg.setAttribute('data-wrap', 'block')
      selectedImg.removeAttribute('data-align')
      setImgWrap('block')
      setImgAlign('')
    } else {
      selectedImg.style.display = 'inline-block'
      selectedImg.style.float = ''
      selectedImg.style.margin = '0 5px'
      selectedImg.style.verticalAlign = 'middle'
      selectedImg.setAttribute('data-wrap', 'inline')
      setImgWrap('inline')
    }
    updateOverlay()
    handleInput()
  }

  const getCaretRangeFromPoint = (x: number, y: number): Range | null => {
    const doc = editorRef.current?.ownerDocument
    if (!doc) return null
    if ('caretRangeFromPoint' in doc) {
      return (doc as any).caretRangeFromPoint(x, y)
    }
    if ('caretPositionFromPoint' in doc) {
      const pos = (doc as any).caretPositionFromPoint(x, y)
      if (pos) {
        const range = doc.createRange()
        range.setStart(pos.offsetNode, pos.offset)
        range.collapse(true)
        return range
      }
    }
    return null
  }

  const handleImgDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      setDraggedImg(target as HTMLImageElement)
      clearSelection()
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', target.id || 'img')
    }
  }

  const handleImgDragOver = (e: React.DragEvent) => {
    if (!draggedImg) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const range = getCaretRangeFromPoint(e.clientX, e.clientY)
    if (range && editorRef.current) {
      const rect = range.getBoundingClientRect()
      const editorRect = editorRef.current.getBoundingClientRect()
      setDragCaretPos({
        x: rect.left - editorRect.left + editorRef.current.scrollLeft,
        y: rect.top - editorRect.top + editorRef.current.scrollTop,
        height: rect.height || 20,
      })
    }
  }

  const handleImgDrop = (e: React.DragEvent) => {
    if (!draggedImg) return
    e.preventDefault()
    const range = getCaretRangeFromPoint(e.clientX, e.clientY)
    if (range) {
      range.deleteContents()
      if (draggedImg.parentNode) draggedImg.remove()
      range.insertNode(draggedImg)
      clearSelection()
      setSelectedImg(draggedImg)
      setImgAlign(draggedImg.getAttribute('data-align') || '')
      setImgWrap(draggedImg.getAttribute('data-wrap') || 'inline')
    }
    setDraggedImg(null)
    setDragCaretPos(null)
    handleInput()
  }

  const handleImgDragEnd = () => {
    setDraggedImg(null)
    setDragCaretPos(null)
  }

  const clearSelection = useCallback(() => {
    setSelectedImg(null)
    setOverlayPos(null)
    setImgAlign('')
    setImgWrap('inline')
  }, [])

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      e.preventDefault()
      e.stopPropagation()
      if (selectedImg && selectedImg !== target) {
        clearSelection()
      }
      setSelectedImg(target as HTMLImageElement)
      setImgAlign(target.getAttribute('data-align') || '')
      setImgWrap(target.getAttribute('data-wrap') || 'inline')
    } else {
      clearSelection()
    }
  }

  const handleEditorKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Shift') shiftPressedRef.current = true
    if (selectedImg && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault()
      const img = selectedImg
      clearSelection()
      img.remove()
      handleInput()
    }
    if (selectedImg && e.key === 'Escape') clearSelection()
  }

  const handleEditorKeyup = (e: React.KeyboardEvent) => {
    if (e.key === 'Shift') shiftPressedRef.current = false
  }

  const startResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedImg) return
    setResizeState({
      img: selectedImg,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedImg.offsetWidth,
      startHeight: selectedImg.offsetHeight,
      handle,
    })
  }

  useEffect(() => {
    if (!resizeState) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeState) return
      const { img, startX, startY, startWidth, startHeight, handle } = resizeState
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      let newWidth = startWidth
      let newHeight = startHeight
      const aspectRatio = startWidth / startHeight
      const keepProportional = !shiftPressedRef.current
      if (handle.includes('e') || handle.includes('w')) {
        newWidth = handle.includes('w') ? startWidth - deltaX : startWidth + deltaX
        if (keepProportional) newHeight = newWidth / aspectRatio
      }
      if (handle.includes('n') || handle.includes('s')) {
        newHeight = handle.includes('n') ? startHeight - deltaY : startHeight + deltaY
        if (keepProportional) newWidth = newHeight * aspectRatio
      }
      newWidth = Math.max(30, Math.round(newWidth))
      newHeight = Math.max(30, Math.round(newHeight))
      img.style.width = `${newWidth}px`
      img.style.height = `${newHeight}px`
      img.setAttribute('width', String(newWidth))
      img.setAttribute('height', String(newHeight))
      updateOverlay()
    }
    const handleMouseUp = () => {
      handleInput()
      setResizeState(null)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizeState, shiftPressedRef])

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
      setTimeout(() => {
        const imgs = editorRef.current?.querySelectorAll('img')
        if (imgs && imgs.length > 0) {
          const lastImg = imgs[imgs.length - 1] as HTMLImageElement
          lastImg.style.maxWidth = '100%'
          lastImg.style.height = 'auto'
          lastImg.setAttribute('draggable', 'true')
          setSelectedImg(lastImg)
          setImgAlign('')
          setImgWrap('inline')
        }
        handleInput()
      }, 100)
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

  const handleHeadingChange = (val: string) => execCommand('formatBlock', val)

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

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    background: '#2A75D3',
    border: '1.5px solid white',
    borderRadius: '2px',
    cursor: 'pointer',
    zIndex: 10,
  }

  const toolbarTop = overlayPos
    ? overlayPos.top > 40
      ? overlayPos.top - 38
      : overlayPos.top + overlayPos.height + 4
    : 0

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
          className="relative"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) clearSelection()
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            spellCheck={false}
            onInput={handleInput}
            onBlur={handleInput}
            onKeyUp={(e) => {
              updateActiveFormats()
              handleEditorKeyup(e)
            }}
            onMouseUp={updateActiveFormats}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeydown}
            onDragStart={handleImgDragStart}
            onDragOver={handleImgDragOver}
            onDrop={handleImgDrop}
            onDragEnd={handleImgDragEnd}
            className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none text-sm text-slate-800 rich-text-content"
            style={{ outline: 'none' }}
          />
          {draggedImg && dragCaretPos && (
            <div
              className="pointer-events-none absolute z-30"
              style={{
                top: dragCaretPos.y,
                left: dragCaretPos.x,
                height: dragCaretPos.height,
                width: '2px',
                background: '#2A75D3',
              }}
            />
          )}
          {selectedImg && overlayPos && (
            <div
              className="absolute z-20 flex items-center gap-0.5 bg-white border border-slate-200 rounded shadow-lg p-1"
              style={{ top: toolbarTop, left: overlayPos.left }}
            >
              <button
                type="button"
                onClick={() => alignImage('left')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  imgAlign === 'left'
                    ? 'bg-blue-100 text-[#2A75D3]'
                    : 'hover:bg-slate-100 text-slate-600',
                )}
                title="Alinhar à Esquerda"
              >
                <AlignLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => alignImage('center')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  imgAlign === 'center'
                    ? 'bg-blue-100 text-[#2A75D3]'
                    : 'hover:bg-slate-100 text-slate-600',
                )}
                title="Centralizar"
              >
                <AlignCenter size={14} />
              </button>
              <button
                type="button"
                onClick={() => alignImage('right')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  imgAlign === 'right'
                    ? 'bg-blue-100 text-[#2A75D3]'
                    : 'hover:bg-slate-100 text-slate-600',
                )}
                title="Alinhar à Direita"
              >
                <AlignRight size={14} />
              </button>
              <div className="w-px h-5 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={() => toggleWrapping('inline')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  imgWrap !== 'block'
                    ? 'bg-blue-100 text-[#2A75D3]'
                    : 'hover:bg-slate-100 text-slate-600',
                )}
                title="Texto ao Redor (Inline)"
              >
                <WrapText size={14} />
              </button>
              <button
                type="button"
                onClick={() => toggleWrapping('block')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  imgWrap === 'block'
                    ? 'bg-blue-100 text-[#2A75D3]'
                    : 'hover:bg-slate-100 text-slate-600',
                )}
                title="Bloco (Texto Abaixo)"
              >
                <Square size={14} />
              </button>
            </div>
          )}
          {selectedImg && overlayPos && (
            <div
              ref={overlayRef}
              className="pointer-events-none absolute"
              style={{
                top: overlayPos.top,
                left: overlayPos.left,
                width: overlayPos.width,
                height: overlayPos.height,
                border: '2px solid #2A75D3',
                boxSizing: 'border-box',
              }}
            >
              <div
                className="pointer-events-auto"
                style={{ ...handleStyle, top: '-6px', left: '-6px', cursor: 'nwse-resize' }}
                onMouseDown={(e) => startResize(e, 'nw')}
                title="Arraste para redimensionar (Shift para distorcer)"
              />
              <div
                className="pointer-events-auto"
                style={{ ...handleStyle, top: '-6px', right: '-6px', cursor: 'nesw-resize' }}
                onMouseDown={(e) => startResize(e, 'ne')}
                title="Arraste para redimensionar (Shift para distorcer)"
              />
              <div
                className="pointer-events-auto"
                style={{ ...handleStyle, bottom: '-6px', left: '-6px', cursor: 'nesw-resize' }}
                onMouseDown={(e) => startResize(e, 'sw')}
                title="Arraste para redimensionar (Shift para distorcer)"
              />
              <div
                className="pointer-events-auto"
                style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }}
                onMouseDown={(e) => startResize(e, 'se')}
                title="Arraste para redimensionar (Shift para distorcer)"
              />
              <div
                className="pointer-events-auto"
                style={{
                  ...handleStyle,
                  top: '50%',
                  left: '-6px',
                  transform: 'translateY(-50%)',
                  cursor: 'ew-resize',
                  width: '8px',
                  height: '20px',
                }}
                onMouseDown={(e) => startResize(e, 'w')}
                title="Arraste para redimensionar"
              />
              <div
                className="pointer-events-auto"
                style={{
                  ...handleStyle,
                  top: '50%',
                  right: '-6px',
                  transform: 'translateY(-50%)',
                  cursor: 'ew-resize',
                  width: '8px',
                  height: '20px',
                }}
                onMouseDown={(e) => startResize(e, 'e')}
                title="Arraste para redimensionar"
              />
              <div
                className="pointer-events-auto"
                style={{
                  ...handleStyle,
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'ns-resize',
                  width: '20px',
                  height: '8px',
                }}
                onMouseDown={(e) => startResize(e, 'n')}
                title="Arraste para redimensionar"
              />
              <div
                className="pointer-events-auto"
                style={{
                  ...handleStyle,
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'ns-resize',
                  width: '20px',
                  height: '8px',
                }}
                onMouseDown={(e) => startResize(e, 's')}
                title="Arraste para redimensionar"
              />
              <div className="pointer-events-none absolute top-0 left-0 -translate-y-full mt-[-4px] bg-[#2A75D3] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                {Math.round(overlayPos.width)} × {Math.round(overlayPos.height)}px
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
