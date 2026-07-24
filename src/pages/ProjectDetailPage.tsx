import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProjeto, type Projeto } from '@/services/projetos'
import { ProjectDetail } from '@/components/ProjectDetail'
import { ProjectForm } from '@/components/ProjectForm'
import { Loader2 } from 'lucide-react'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const loadData = useCallback(() => {
    if (!id) return
    setLoading(true)
    getProjeto(id)
      .then(setProjeto)
      .catch(() => navigate('/projetos'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading && !projeto) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#337ab7]" />
      </div>
    )
  }

  if (!projeto) return null

  if (isEditing) {
    return (
      <ProjectForm
        projeto={projeto}
        onBack={() => {
          setIsEditing(false)
          loadData()
        }}
      />
    )
  }

  return (
    <ProjectDetail
      projeto={projeto}
      onBack={() => navigate('/projetos')}
      onEdit={() => setIsEditing(true)}
    />
  )
}
