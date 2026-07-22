import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProjeto, type Projeto } from '@/services/projetos'
import { ProjectDetail } from '@/components/ProjectDetail'
import { Loader2 } from 'lucide-react'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getProjeto(id)
      .then(setProjeto)
      .catch(() => navigate('/projetos'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#337ab7]" />
      </div>
    )
  }

  if (!projeto) return null

  return (
    <ProjectDetail
      projeto={projeto}
      onBack={() => navigate('/projetos')}
      onEdit={() => navigate('/projetos')}
    />
  )
}
