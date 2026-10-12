import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi, documentVersionsApi } from '@/api'
import { useUIStore } from '@/stores'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Document } from '@/types'

export const PendingReviewsPage: React.FC = () => {
  const { openReview } = useUIStore()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [resolvingDocId, setResolvingDocId] = useState<number | null>(null)

  const { data: pendingDocs = [], isLoading } = useQuery({
    queryKey: ['documents', 'pending-for-me'],
    queryFn: () => documentsApi.getPendingForMe(),
  })

  const pagedDocs = useMemo(() => {
    const start = (page - 1) * pageSize
    return pendingDocs.slice(start, start + pageSize)
  }, [pendingDocs, page, pageSize])

  const handleReview = async (doc: Document) => {
    setResolvingDocId(doc.documentId)
    try {
      const versions = await documentVersionsApi.getByDocument(doc.documentId)
      if (!versions || versions.length === 0) {
        toast.error('No file version exists for this document yet.')
        return
      }
      const current =
        versions.find((v) => v.versionNumber === doc.currentVersionNumber) ??
        versions.reduce((max, v) => (v.versionId > max.versionId ? v : max), versions[0])
      openReview(current.versionId, doc.documentNumber, current.versionNumber)
    } catch {
      // Interceptor handles error toast
    } finally {
      setResolvingDocId(null)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Reviews"
        description="Official engineering review, comments, and decision rating for contractor and technical office submittals."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Pending Reviews' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Submittals Requiring Your Decision ({pendingDocs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : pendingDocs.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-8 h-8 text-emerald-500" />}
              title="All caught up!"
              description="There are currently no submittals pending your review on your assigned contracts."
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 -mt-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Document Code</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Submission Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedDocs.map((doc) => (
                      <tr
                        key={doc.documentId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Link to={`/documents/${doc.documentId}`} className="hover:underline">
                              {doc.documentNumber}
                            </Link>
                            <CopyButton text={doc.documentNumber} />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                          {doc.title || '—'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          Rev {doc.currentVersionNumber}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(doc.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/documents/${doc.documentId}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                              leftIcon={
                                resolvingDocId === doc.documentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckSquare className="w-3.5 h-3.5" />
                                )
                              }
                              disabled={resolvingDocId !== null}
                              onClick={() => handleReview(doc)}
                            >
                              Review & Rate
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={pendingDocs.length}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
