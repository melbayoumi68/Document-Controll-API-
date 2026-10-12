import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { documentsApi } from '@/api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/common/CopyButton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/lib/utils'
import { FileEdit, CheckCircle2, UploadCloud } from 'lucide-react'

export const NeedsRevisionPage: React.FC = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: revisionDocs = [], isLoading } = useQuery({
    queryKey: ['documents', 'requires-revision-for-me'],
    queryFn: () => documentsApi.getRequiresRevisionForMe(),
  })

  const pagedDocs = useMemo(() => {
    const start = (page - 1) * pageSize
    return revisionDocs.slice(start, start + pageSize)
  }, [revisionDocs, page, pageSize])

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Needs Revision"
        description="Submittals returned with Rating C (Requires Revision). Upload a new revision to continue the review cycle."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Needs Revision' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-orange-500" />
            <span>Revise & Resubmit Queue ({revisionDocs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : revisionDocs.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
              title="Nothing to revise"
              description="None of your documents currently require a revision. New Rating C decisions will appear here."
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
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Update</th>
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

                        <td className="py-3.5 px-4">
                          <StatusBadge status={doc.status} />
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(doc.updatedAt || doc.createdAt)}
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
                              className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                              onClick={() =>
                                navigate(`/documents/${doc.documentId}/upload-version`)
                              }
                            >
                              Upload New Version
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
                total={revisionDocs.length}
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
