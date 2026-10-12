import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi, documentVersionsApi } from '@/api'
import { useUserStore } from '@/stores'
import { DocumentStatuses, StatusInfo } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Dropzone } from '@/components/ui/Dropzone'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { ArrowUpCircle, ShieldAlert, FileQuestion, Info } from 'lucide-react'
import type { AxiosError } from 'axios'

const FINAL_STATUSES = [
  DocumentStatuses.Approved,
  DocumentStatuses.ApprovedWithComments,
  DocumentStatuses.Rejected,
]

export const UploadVersionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const documentId = id ? parseInt(id, 10) : null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isSuperAdmin } = useUserStore()

  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentsApi.getById(documentId!),
    enabled: documentId != null,
    retry: false,
  })

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => documentVersionsApi.getByDocument(documentId!),
    enabled: documentId != null && !!document,
    retry: false,
  })

  const currentVersion = document?.currentVersionNumber
    || versions
        .map((v) => parseInt(v.versionNumber, 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a)[0]
        ?.toString()
        .padStart(2, '0')

  const nextVersionNum = currentVersion
    ? (parseInt(currentVersion, 10) + 1).toString().padStart(2, '0')
    : '01'

  const isFinal = document ? FINAL_STATUSES.includes(document.status) : false

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!document) throw new Error('Document not loaded.')
      if (!file) {
        setFileError('Revised file is required.')
        throw new Error('Please select a file.')
      }
      if (isFinal) {
        throw new Error(
          'This document reached a final decision. Uploading a new revision is not allowed.'
        )
      }

      // uploadedByUserId is forced server-side from the JWT
      return await documentsApi.uploadVersion({
        documentId: document.documentId,
        notes: notes.trim() || undefined,
        file,
      })
    },
    onSuccess: (newVersion) => {
      toast.success(
        `Version ${newVersion.versionNumber} uploaded successfully! The document is now pending review.`
      )
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate(`/documents/${documentId}`)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const status = (error as AxiosError | undefined)?.response?.status
  if (!document) {
    if (status === 403) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You are not permitted to upload a revision for this document.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate('/documents')}
            >
              Back to My Documents
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <FileQuestion className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Document Not Found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The requested document does not exist or is outside your scope.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate('/documents')}
          >
            Back to My Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Upload New Revision (Rev ${nextVersionNum})`}
        description="Upload a revised submittal addressing the consultant's review remarks."
        breadcrumbs={[
          { label: 'Documents', href: '/documents' },
          { label: document.documentNumber, href: `/documents/${document.documentId}` },
          { label: 'Upload Revision' },
        ]}
      />

      {/* Target banner */}
      <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 dark:border-orange-900/50 dark:bg-orange-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
              Target Document:
            </p>
            <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 break-all">
              {document.documentNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={document.status} />
            <span className="text-xs font-semibold text-orange-700/80 dark:text-orange-400">
              Current: Rev {currentVersion || '—'} → New:{' '}
              <strong>Rev {nextVersionNum}</strong>
            </span>
          </div>
        </div>
      </div>

      {isFinal && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This document received a final decision (
            {StatusInfo[document.status]?.label || document.status}). New revisions
            cannot be uploaded{isSuperAdmin() ? ' for regular workflows' : ''}.
          </span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          uploadMutation.mutate()
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpCircle className="h-4 w-4 text-blue-600" />
              Revision Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Revision Notes / Response to Comments (Optional)
              </label>
              <Textarea
                placeholder="Explain the changes made to address the consultant's comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Revised File *
              </label>
              <Dropzone
                file={file}
                onFileSelect={(f) => {
                  setFile(f)
                  if (f) setFileError(undefined)
                }}
                error={fileError}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/documents/${documentId}`)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={uploadMutation.isPending}
            disabled={!file || isFinal}
          >
            Upload Version {nextVersionNum}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default UploadVersionPage
