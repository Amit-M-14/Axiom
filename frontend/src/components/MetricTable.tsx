import type { MetricRow, MetricStatus } from '../types/audit'

const STATUS_DOT: Record<MetricStatus, string> = {
  pass: 'bg-emerald-500',
  fail: 'bg-red-500',
  warn: 'bg-amber-400',
  neutral: 'bg-slate-500',
}

export default function MetricTable({ rows }: { rows: MetricRow[] }) {
  return (
    <table className="w-full border-collapse overflow-hidden rounded-md border border-slate-800 text-xs">
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={row.label}
            className={idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/30'}
          >
            <td className="border-b border-slate-800 px-3 py-1.5 text-slate-400 last:border-b-0">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[row.status ?? 'neutral']}`} />
                {row.label}
              </div>
            </td>
            <td className="border-b border-slate-800 px-3 py-1.5 text-right font-mono font-medium text-slate-200 last:border-b-0">
              {row.value}
            </td>
            <td className="border-b border-slate-800 px-3 py-1.5 text-right font-mono text-[11px] text-slate-500 last:border-b-0">
              {row.delta ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
