import { useState } from 'react'
import type { FormEvent } from 'react'
import { CornerDownLeft, Terminal, User } from 'lucide-react'
import type { AuditMessage, Citation } from '../types/audit'
import MetricTable from './MetricTable'
import CitationChip from './CitationChip'

interface AuditConsoleProps {
  messages: AuditMessage[]
  activeCitationId: string | null
  onSelectCitation: (citation: Citation) => void
  onSubmitQuery: (query: string) => void
  chunkCount: number
  documentCount: number
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function MessageBlock({
  message,
  activeCitationId,
  onSelectCitation,
}: {
  message: AuditMessage
  activeCitationId: string | null
  onSelectCitation: (citation: Citation) => void
}) {
  const isUser = message.role === 'user'

  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-800/70 px-4 py-3">
      <div className="flex items-center gap-2">
        {isUser ? (
          <User className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <Terminal className="h-3.5 w-3.5 text-emerald-500" />
        )}
        <span className="font-mono text-[10px] font-semibold tracking-widest text-slate-500">
          {isUser ? 'ANALYST' : 'AXIOM ENGINE'}
        </span>
        <span className="font-mono text-[10px] text-slate-600">{formatTime(message.timestamp)}</span>
        {message.isStreaming && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            STREAMING
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-slate-200">
        {message.content}
        {message.isStreaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-emerald-500 align-middle" />}
      </p>

      {message.metrics && message.metrics.length > 0 && (
        <div className="mt-1">
          <MetricTable rows={message.metrics} />
        </div>
      )}

      {message.citations && message.citations.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {message.citations.map((citation) => (
            <CitationChip
              key={citation.citationId}
              citation={citation}
              isActive={citation.citationId === activeCitationId}
              onSelect={onSelectCitation}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AuditConsole({
  messages,
  activeCitationId,
  onSelectCitation,
  onSubmitQuery,
  chunkCount,
  documentCount,
}: AuditConsoleProps) {
  const [draft, setDraft] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    onSubmitQuery(trimmed)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-100">AXIOM</span>
          <span className="font-mono text-[10px] text-slate-500">AUDIT CONSOLE</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>{documentCount} DOCS</span>
          <span className="text-slate-700">|</span>
          <span>{chunkCount.toLocaleString()} CHUNKS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <MessageBlock
            key={message.id}
            message={message}
            activeCitationId={activeCitationId}
            onSelectCitation={onSelectCitation}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 focus-within:border-emerald-600/60">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Query the compliance index — e.g. covenant breaches in FY2024"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-emerald-600/60 hover:text-emerald-400 disabled:opacity-40"
            disabled={!draft.trim()}
          >
            Run
            <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  )
}
