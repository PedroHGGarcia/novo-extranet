import pb from '@/lib/pocketbase/client'

export interface KmlImportResult {
  processed: number
  updated: string[]
  notFound: string[]
}

export const importKml = (kmlContent: string): Promise<KmlImportResult> =>
  pb.send('/backend/v1/kml-import', {
    method: 'POST',
    body: JSON.stringify({ kml: kmlContent }),
    headers: { 'Content-Type': 'application/json' },
  })
