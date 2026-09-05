const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export interface RawCitation {
  source: string
  page: number
  char_count?: number
  excerpt: string
}

export interface QueryResponse {
  success: boolean
  query: string
  answer: string
  citations: RawCitation[]
}

export interface UploadResponse {
  success: boolean
  message: string
  filename: string
  storedPath: string
  logs: string[]
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return body.error || body.details || fallback
  } catch {
    return fallback
  }
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('pdf', file)

  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Upload failed'))
  }
  return res.json()
}

export function getDocumentFileUrl(fileName: string): string {
  return `${API_BASE}/api/documents/file/${encodeURIComponent(fileName)}`
}

export async function queryDocuments(query: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/documents/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    throw new Error(await parseError(res, 'Query failed'))
  }
  return res.json()
}
