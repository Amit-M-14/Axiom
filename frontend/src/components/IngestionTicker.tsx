import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import type { IngestionState, IngestionStatus } from '../types/audit'

const STATE_LABEL: Record<IngestionState, string> = {
  queued: 'QUEUED',
  parsing: 'PARSING',
  chunking: 'CHUNKING',
  embedding: 'EMBEDDING',
  indexed: 'INDEXED',
  failed: 'FAILED',
}

function StateIcon({ state }: { state: IngestionState }) {
  if (state === 'indexed') {
    return <CheckCircle2 className="h-3 w-3 text-emerald-500" />
  }
  if (state === 'failed') {
    return <AlertTriangle className="h-3 w-3 text-red-500" />
  }
  return <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
}

function IngestionPill({ status }: { status: IngestionStatus }) {
  const isFailed = status.state === 'failed'
  const isIndexed = status.state === 'indexed'

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1"
      title={status.errorMessage ?? status.fileName}
    >
      <StateIcon state={status.state} />
      <span className="max-w-[180px] truncate font-mono text-[11px] text-slate-400">
        {status.fileName}
      </span>
      <span
        className={
          'font-mono text-[10px] font-semibold tracking-wide ' +
          (isFailed ? 'text-red-400' : isIndexed ? 'text-emerald-500' : 'text-amber-400')
        }
      >
        {STATE_LABEL[status.state]}
      </span>
      {!isIndexed && !isFailed && (
        <span className="font-mono text-[10px] text-slate-500">
          {status.pagesProcessed}/{status.totalPages}p
        </span>
      )}
    </div>
  )
}

export default function IngestionTicker({ statuses }: { statuses: IngestionStatus[] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
      <span className="shrink-0 font-mono text-[10px] font-semibold tracking-widest text-slate-500">
        INGESTION PIPELINE
      </span>
      <div className="flex items-center gap-2">
        {statuses.map((status) => (
          <IngestionPill key={status.documentId} status={status} />
        ))}
      </div>
    </div>
  )
}
