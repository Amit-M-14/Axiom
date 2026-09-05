import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ShieldAlert, UploadCloud } from 'lucide-react'
import type {
  AuditMessage,
  Citation,
  DocumentMetadata,
  IngestionStatus,
} from '../types/audit'
import { queryDocuments, uploadDocument, type RawCitation } from '../api/axiomApi'
import AuditConsole from './AuditConsole'
import DocumentInspector from './DocumentInspector'
import IngestionTicker from './IngestionTicker'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function extractPageCount(logs: string[]): number {
  for (const line of logs) {
    const match = line.match(/Loaded (\d+) pages/)
    if (match) return Number(match[1])
  }
  return 1
}

function extractChunkCount(logs: string[]): number {
  for (const line of logs) {
    const match = line.match(/Split into (\d+) contextual chunks/)
    if (match) return Number(match[1])
  }
  return 0
}

function toCitations(raw: RawCitation[], documents: DocumentMetadata[]): Citation[] {
  return raw.map((item, idx) => {
    const doc = documents.find((d) => d.fileName === item.source)
    return {
      citationId: `cit-${Date.now()}-${idx}`,
      documentId: doc?.documentId ?? `doc-${slugify(item.source)}`,
      fileName: item.source,
      page: item.page,
      boundingBox: { x: 10, y: 15 + (idx % 4) * 18, width: 72, height: 12 },
      excerpt: item.excerpt,
      confidence: 0.9,
      verified: true,
    }
  })
}

export default function AuditDashboard() {
  const [messages, setMessages] = useState<AuditMessage[]>([])
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [ingestionStatuses, setIngestionStatuses] = useState<IngestionStatus[]>([])
  const [chunkCount, setChunkCount] = useState(0)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isQuerying, setIsQuerying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleSelectCitation(citation: Citation) {
    setActiveCitation(citation)
    setCurrentPage(citation.page)
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const documentId = `doc-${slugify(file.name)}-${Date.now()}`
    const startedAt = new Date().toISOString()

    setIngestionStatuses((prev) => [
      ...prev,
      {
        documentId,
        fileName: file.name,
        state: 'embedding',
        progress: 50,
        pagesProcessed: 0,
        totalPages: 0,
        startedAt,
      },
    ])

    try {
      const result = await uploadDocument(file)
      const pageCount = extractPageCount(result.logs)
      setChunkCount((prev) => prev + extractChunkCount(result.logs))

      setDocuments((prev) => [
        ...prev,
        {
          documentId,
          fileName: file.name,
          docType: 'SEC Filing',
          issuer: 'Unknown Issuer',
          fiscalYear: new Date().getFullYear(),
          fiscalPeriod: 'N/A',
          pageCount,
          uploadedAt: startedAt,
          uploadedBy: 'sakshitownmanor@gmail.com',
          checksumSha256: 'pending',
          retentionClass: 'Confidential',
        },
      ])

      setIngestionStatuses((prev) =>
        prev.map((status) =>
          status.documentId === documentId
            ? {
                ...status,
                state: 'indexed',
                progress: 100,
                pagesProcessed: pageCount,
                totalPages: pageCount,
                completedAt: new Date().toISOString(),
              }
            : status,
        ),
      )
    } catch (error) {
      setIngestionStatuses((prev) =>
        prev.map((status) =>
          status.documentId === documentId
            ? {
                ...status,
                state: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Upload failed',
              }
            : status,
        ),
      )
    }
  }

  async function handleSubmitQuery(query: string) {
    const userMessage: AuditMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    const pendingId = `msg-${Date.now()}-a`
    const pendingMessage: AuditMessage = {
      id: pendingId,
      role: 'assistant',
      content: 'Querying compliance index…',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, pendingMessage])
    setIsQuerying(true)

    try {
      const result = await queryDocuments(query)
      const citations = toCitations(result.citations, documents)

      // Register any citation's source document that isn't tracked yet, deduped by
      // documentId (multiple citations commonly share the same source document).
      setDocuments((prev) => {
        const known = new Set(prev.map((d) => d.documentId))
        const additions = new Map<string, DocumentMetadata>()
        for (const c of citations) {
          if (known.has(c.documentId)) continue
          const existing = additions.get(c.documentId)
          if (existing) {
            existing.pageCount = Math.max(existing.pageCount, c.page)
          } else {
            additions.set(c.documentId, {
              documentId: c.documentId,
              fileName: c.fileName,
              docType: 'SEC Filing',
              issuer: 'Unknown Issuer',
              fiscalYear: new Date().getFullYear(),
              fiscalPeriod: 'N/A',
              pageCount: c.page,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'sakshitownmanor@gmail.com',
              checksumSha256: 'pending',
              retentionClass: 'Confidential',
            })
          }
        }
        return additions.size > 0 ? [...prev, ...additions.values()] : prev
      })

      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingId
            ? { ...message, content: result.answer, isStreaming: false, citations }
            : message,
        ),
      )

      if (citations[0]) {
        setActiveCitation(citations[0])
        setCurrentPage(citations[0].page)
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `Query failed: ${error.message}`
                    : 'Query failed: unknown error',
                isStreaming: false,
              }
            : message,
        ),
      )
    } finally {
      setIsQuerying(false)
    }
  }

  const selectedDocument =
    documents.find((doc) => doc.documentId === activeCitation?.documentId) ?? null

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-xs font-bold text-slate-950">
            A
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-slate-100">Axiom</p>
            <p className="font-mono text-[9px] leading-none text-slate-500">FINANCIAL COMPLIANCE RAG ENGINE</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChosen}
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-300 hover:border-emerald-600/60 hover:text-emerald-400"
          >
            <UploadCloud className="h-3 w-3" />
            UPLOAD FILING
          </button>
          <div className="flex items-center gap-1.5 rounded-md border border-red-600/40 bg-red-500/5 px-2 py-1 font-mono text-[10px] text-red-400">
            <ShieldAlert className="h-3 w-3" />
            RESTRICTED ENVIRONMENT — AUDIT TRAIL ACTIVE
          </div>
          <span className="font-mono text-[10px] text-slate-500">sakshitownmanor@gmail.com</span>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-slate-950">
        <IngestionTicker statuses={ingestionStatuses} />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-[40%] min-w-[380px]">
          <AuditConsole
            messages={messages}
            activeCitationId={activeCitation?.citationId ?? null}
            onSelectCitation={handleSelectCitation}
            onSubmitQuery={handleSubmitQuery}
            chunkCount={chunkCount}
            documentCount={documents.length}
            isQuerying={isQuerying}
          />
        </div>
        <div className="w-[60%] flex-1">
          <DocumentInspector
            document={selectedDocument}
            citation={activeCitation}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}
