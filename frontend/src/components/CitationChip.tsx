import { FileCheck2, ShieldQuestion } from 'lucide-react'
import type { Citation } from '../types/audit'

interface CitationChipProps {
  citation: Citation
  isActive: boolean
  onSelect: (citation: Citation) => void
}

export default function CitationChip({ citation, isActive, onSelect }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(citation)}
      className={
        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ' +
        (isActive
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200')
      }
      title={citation.excerpt}
    >
      {citation.verified ? (
        <FileCheck2 className="h-3 w-3" />
      ) : (
        <ShieldQuestion className="h-3 w-3 text-amber-400" />
      )}
      <span className="max-w-[140px] truncate font-mono">{citation.fileName}</span>
      <span className="font-mono text-slate-500">p.{citation.page}</span>
      <span className="font-mono text-slate-500">{Math.round(citation.confidence * 100)}%</span>
    </button>
  )
}
