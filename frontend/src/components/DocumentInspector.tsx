import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Lock, ShieldCheck } from 'lucide-react'
import type { Citation, DocumentMetadata, RetentionClass } from '../types/audit'
import { getDocumentFileUrl } from '../api/axiomApi'

interface DocumentInspectorProps {
  document: DocumentMetadata | null
  citation: Citation | null
  currentPage: number
  onPageChange: (page: number) => void
}

const RETENTION_STYLE: Record<RetentionClass, string> = {
  Public: 'border-slate-700 text-slate-400',
  Confidential: 'border-amber-600/50 text-amber-400',
  Restricted: 'border-red-600/50 text-red-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

/** Placeholder text lines used to simulate a parsed PDF page layout. */
const PAGE_LINES = [
  { y: 8, w: 34 },
  { y: 14, w: 78 },
  { y: 19, w: 71 },
  { y: 24, w: 68 },
  { y: 29, w: 74 },
  { y: 42, w: 20 },
  { y: 48, w: 82 },
  { y: 53, w: 76 },
  { y: 58, w: 70 },
  { y: 63, w: 79 },
  { y: 68, w: 55 },
  { y: 80, w: 66 },
  { y: 85, w: 73 },
  { y: 90, w: 40 },
]

export default function DocumentInspector({
  document,
  citation,
  currentPage,
  onPageChange,
}: DocumentInspectorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!document) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    const url = getDocumentFileUrl(document.fileName)
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setPreviewUrl(res.ok ? url : null)
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [document])

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-950 text-slate-600">
        <FileText className="mb-2 h-8 w-8" />
        <p className="text-xs">Select a citation to inspect the source document</p>
      </div>
    )
  }

  const box = citation?.boundingBox

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate font-mono text-xs text-slate-200">{document.fileName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {document.docType}
          </span>
          <span
            className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${RETENTION_STYLE[document.retentionClass]}`}
          >
            <Lock className="h-2.5 w-2.5" />
            {document.retentionClass.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="rounded border border-slate-800 p-1 text-slate-400 hover:border-slate-700 hover:text-slate-200 disabled:opacity-30"
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-400">
            PAGE {currentPage} / {document.pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(document.pageCount, currentPage + 1))}
            className="rounded border border-slate-800 p-1 text-slate-400 hover:border-slate-700 hover:text-slate-200 disabled:opacity-30"
            disabled={currentPage >= document.pageCount}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {citation && (
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-500">
            <ShieldCheck className="h-3 w-3" />
            CITATION VERIFIED — {Math.round(citation.confidence * 100)}% CONFIDENCE
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-slate-900/30 p-6">
        {previewUrl ? (
          <iframe
            key={`${previewUrl}#${currentPage}`}
            src={`${previewUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
            title={document.fileName}
            className="mx-auto block h-[70vh] w-full max-w-[700px] rounded-sm border border-slate-800 bg-slate-100 shadow-lg"
          />
        ) : (
          <div className="relative mx-auto aspect-[8.5/11] w-full max-w-[560px] rounded-sm border border-slate-800 bg-slate-100 shadow-lg">
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[10px] text-slate-500">
              Source file not available for preview — showing extracted text only.
            </div>
            {PAGE_LINES.map((line, idx) => (
              <div
                key={idx}
                className="absolute h-[2.5%] rounded-[1px] bg-slate-400/30"
                style={{ top: `${line.y}%`, left: '8%', width: `${line.w}%` }}
              />
            ))}

            {box && (
              <div
                className="absolute rounded-sm border-2 border-emerald-500 bg-emerald-400/20 shadow-[0_0_0_2px_rgba(2,6,23,0.6)]"
                style={{
                  top: `${box.y}%`,
                  left: `${box.x}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              >
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded-sm bg-emerald-500 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-950">
                  CITED CHUNK
                </span>
              </div>
            )}
          </div>
        )}

        {citation && (
          <div className="mx-auto mt-4 max-w-[560px] rounded-md border border-slate-800 bg-slate-900 p-3">
            <p className="mb-1 font-mono text-[10px] tracking-widest text-slate-500">EXTRACTED TEXT</p>
            <p className="text-xs leading-relaxed text-slate-300">{citation.excerpt}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-px border-t border-slate-800 bg-slate-800 text-[11px]">
        {[
          ['Issuer', document.issuer],
          ['Fiscal Period', document.fiscalPeriod],
          ['Uploaded', formatDate(document.uploadedAt)],
          ['SHA-256', document.checksumSha256],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-900 px-3 py-2">
            <p className="font-mono text-[9px] tracking-widest text-slate-500">{label.toUpperCase()}</p>
            <p className="truncate font-mono text-slate-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
