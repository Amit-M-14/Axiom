import { useEffect, useRef, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import type { AuditMessage, Citation } from '../types/audit'
import { initialMessages, mockDocuments, mockIngestionStatuses } from '../data/mockAudit'
import AuditConsole from './AuditConsole'
import DocumentInspector from './DocumentInspector'
import IngestionTicker from './IngestionTicker'

const DEMO_RESPONSE =
  'No material weaknesses were identified in the FY2024 internal control assessment. The audit committee confirmed remediation of the prior-year deficiency in revenue recognition controls, with testing evidence retained through Q4.'

function buildDemoMessage(query: string): AuditMessage {
  void query
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
    isStreaming: true,
    metrics: [
      { label: 'Material Weaknesses', value: '0', status: 'pass' },
      { label: 'Prior-Year Deficiencies Remediated', value: '1/1', status: 'pass' },
      { label: 'Control Testing Coverage', value: '94.2%', delta: '+2.6 pp', status: 'pass' },
    ],
    citations: [
      {
        citationId: `cit-${Date.now()}`,
        documentId: 'doc-audit-2024q4',
        fileName: 'INTERNAL_AUDIT_REPORT_Q4_2024.pdf',
        page: 9,
        boundingBox: { x: 10, y: 20, width: 66, height: 14 },
        excerpt:
          '…management remediated the previously disclosed deficiency in revenue recognition controls; no material weaknesses were identified as of the FY2024 assessment date…',
        confidence: 0.93,
        verified: true,
      },
    ],
  }
}

export default function AuditDashboard() {
  const [messages, setMessages] = useState<AuditMessage[]>(initialMessages)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(
    initialMessages[1]?.citations?.[0] ?? null,
  )
  const [currentPage, setCurrentPage] = useState<number>(activeCitation?.page ?? 1)
  const streamTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (streamTimer.current) window.clearInterval(streamTimer.current)
    }
  }, [])

  function handleSelectCitation(citation: Citation) {
    setActiveCitation(citation)
    setCurrentPage(citation.page)
  }

  function handleSubmitQuery(query: string) {
    const userMessage: AuditMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    const assistantMessage = buildDemoMessage(query)

    setMessages((prev) => [...prev, userMessage, assistantMessage])

    let charIndex = 0
    if (streamTimer.current) window.clearInterval(streamTimer.current)
    streamTimer.current = window.setInterval(() => {
      charIndex += 3
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: DEMO_RESPONSE.slice(0, charIndex),
                isStreaming: charIndex < DEMO_RESPONSE.length,
              }
            : message,
        ),
      )
      if (charIndex >= DEMO_RESPONSE.length && streamTimer.current) {
        window.clearInterval(streamTimer.current)
        streamTimer.current = null
        setActiveCitation(assistantMessage.citations?.[0] ?? null)
        setCurrentPage(assistantMessage.citations?.[0]?.page ?? 1)
      }
    }, 18)
  }

  const chunkCount = 12483
  const selectedDocument =
    mockDocuments.find((doc) => doc.documentId === activeCitation?.documentId) ?? null

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
          <div className="flex items-center gap-1.5 rounded-md border border-red-600/40 bg-red-500/5 px-2 py-1 font-mono text-[10px] text-red-400">
            <ShieldAlert className="h-3 w-3" />
            RESTRICTED ENVIRONMENT — AUDIT TRAIL ACTIVE
          </div>
          <span className="font-mono text-[10px] text-slate-500">sakshitownmanor@gmail.com</span>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-slate-950">
        <IngestionTicker statuses={mockIngestionStatuses} />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-[40%] min-w-[380px]">
          <AuditConsole
            messages={messages}
            activeCitationId={activeCitation?.citationId ?? null}
            onSelectCitation={handleSelectCitation}
            onSubmitQuery={handleSubmitQuery}
            chunkCount={chunkCount}
            documentCount={mockDocuments.length}
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
