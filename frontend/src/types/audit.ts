// Core domain types for the Axiom Financial Compliance RAG Engine dashboard.

export type DocType =
  | '10-K'
  | '10-Q'
  | '8-K'
  | 'SEC Filing'
  | 'Compliance Memo'
  | 'Audit Report'
  | 'Internal Policy'

export type RetentionClass = 'Public' | 'Confidential' | 'Restricted'

export interface DocumentMetadata {
  documentId: string
  fileName: string
  docType: DocType
  issuer: string
  fiscalYear: number
  fiscalPeriod: string
  pageCount: number
  uploadedAt: string
  uploadedBy: string
  checksumSha256: string
  retentionClass: RetentionClass
}

export interface BoundingBox {
  /** All values are percentages (0-100) relative to the rendered page. */
  x: number
  y: number
  width: number
  height: number
}

export interface Citation {
  citationId: string
  documentId: string
  fileName: string
  page: number
  boundingBox: BoundingBox
  excerpt: string
  confidence: number // 0-1
  verified: boolean
}

export type MetricStatus = 'pass' | 'fail' | 'warn' | 'neutral'

export interface MetricRow {
  label: string
  value: string
  delta?: string
  status?: MetricStatus
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface AuditMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  isStreaming?: boolean
  citations?: Citation[]
  metrics?: MetricRow[]
}

export type IngestionState =
  | 'queued'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexed'
  | 'failed'

export interface IngestionStatus {
  documentId: string
  fileName: string
  state: IngestionState
  progress: number // 0-100
  pagesProcessed: number
  totalPages: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
}
