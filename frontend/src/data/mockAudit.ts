import type {
  AuditMessage,
  DocumentMetadata,
  IngestionStatus,
} from '../types/audit'

export const mockDocuments: DocumentMetadata[] = [
  {
    documentId: 'doc-10k-2024',
    fileName: 'ORION_CAPITAL_10K_FY2024.pdf',
    docType: '10-K',
    issuer: 'Orion Capital Holdings',
    fiscalYear: 2024,
    fiscalPeriod: 'FY2024',
    pageCount: 212,
    uploadedAt: '2026-08-14T09:12:00Z',
    uploadedBy: 'r.desai@axiom-compliance.io',
    checksumSha256: 'a3f9…7c21',
    retentionClass: 'Confidential',
  },
  {
    documentId: 'doc-audit-2024q4',
    fileName: 'INTERNAL_AUDIT_REPORT_Q4_2024.pdf',
    docType: 'Audit Report',
    issuer: 'Orion Capital Holdings',
    fiscalYear: 2024,
    fiscalPeriod: 'Q4 2024',
    pageCount: 48,
    uploadedAt: '2026-08-20T15:41:00Z',
    uploadedBy: 'k.iwuoha@axiom-compliance.io',
    checksumSha256: '9be1…44da',
    retentionClass: 'Restricted',
  },
]

export const mockIngestionStatuses: IngestionStatus[] = [
  {
    documentId: 'doc-10k-2024',
    fileName: 'ORION_CAPITAL_10K_FY2024.pdf',
    state: 'indexed',
    progress: 100,
    pagesProcessed: 212,
    totalPages: 212,
    startedAt: '2026-08-14T09:12:00Z',
    completedAt: '2026-08-14T09:19:32Z',
  },
  {
    documentId: 'doc-audit-2024q4',
    fileName: 'INTERNAL_AUDIT_REPORT_Q4_2024.pdf',
    state: 'embedding',
    progress: 68,
    pagesProcessed: 33,
    totalPages: 48,
    startedAt: '2026-09-02T08:02:00Z',
  },
  {
    documentId: 'doc-8k-2026',
    fileName: 'MATERIAL_EVENT_8K_2026-07.pdf',
    state: 'failed',
    progress: 41,
    pagesProcessed: 6,
    totalPages: 14,
    startedAt: '2026-09-01T11:20:00Z',
    errorMessage: 'OCR confidence below threshold on p.7',
  },
]

export const initialMessages: AuditMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content:
      'Confirm the reported liquidity coverage ratio for FY2024 and flag any covenant breaches disclosed in the internal audit report.',
    timestamp: '2026-09-02T14:02:11Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Orion Capital Holdings reported a liquidity coverage ratio (LCR) of 128.4% for FY2024, above the 100% regulatory minimum. The Q4 internal audit report notes one covenant observation related to the senior credit facility leverage ratio, which was within tolerance but trending toward the 3.50x ceiling.',
    timestamp: '2026-09-02T14:02:19Z',
    metrics: [
      { label: 'Liquidity Coverage Ratio', value: '128.4%', delta: '+4.1 pp YoY', status: 'pass' },
      { label: 'Leverage Ratio (Senior Facility)', value: '3.38x', delta: '+0.22x QoQ', status: 'warn' },
      { label: 'Covenant Breaches', value: '0', status: 'pass' },
      { label: 'Material Weaknesses Disclosed', value: '0', status: 'pass' },
    ],
    citations: [
      {
        citationId: 'cit-1',
        documentId: 'doc-10k-2024',
        fileName: 'ORION_CAPITAL_10K_FY2024.pdf',
        page: 87,
        boundingBox: { x: 12, y: 34, width: 62, height: 8 },
        excerpt:
          '…the Company maintained a liquidity coverage ratio of 128.4% as of December 31, 2024, exceeding the minimum regulatory requirement of 100%…',
        confidence: 0.96,
        verified: true,
      },
      {
        citationId: 'cit-2',
        documentId: 'doc-audit-2024q4',
        fileName: 'INTERNAL_AUDIT_REPORT_Q4_2024.pdf',
        page: 22,
        boundingBox: { x: 8, y: 58, width: 70, height: 11 },
        excerpt:
          '…the senior credit facility leverage ratio of 3.38x remains within the 3.50x covenant ceiling; management should monitor trend given two consecutive quarters of increase…',
        confidence: 0.89,
        verified: true,
      },
    ],
  },
]
