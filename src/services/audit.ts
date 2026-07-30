import pb from '@/lib/pocketbase/client'

export interface AuditLogData {
  userId: string
  action: string
  table: string
  recordId: string
  data: Record<string, unknown>
}

export async function logAudit({
  userId,
  action,
  table,
  recordId,
  data,
}: AuditLogData): Promise<void> {
  if (!userId) return
  try {
    await pb.collection('auditoria').create({
      user: userId,
      acao: action,
      tabela: table,
      registro_id: recordId,
      dados: data,
    })
  } catch (e) {
    console.error('Failed to log audit:', e)
  }
}

export function getCurrentUserId(): string {
  return pb.authStore.record?.id || ''
}
