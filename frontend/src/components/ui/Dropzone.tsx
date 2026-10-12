import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File as FileIcon, X, AlertCircle } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { MaxFileSize, AllowedFileExtensions } from '@/types'

export interface DropzoneProps {
  file: File | null
  onFileSelect: (file: File | null) => void
  error?: string
  disabled?: boolean
  className?: string
}

export const Dropzone: React.FC<DropzoneProps> = ({
  file,
  onFileSelect,
  error,
  disabled = false,
  className,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxSize: MaxFileSize,
    multiple: false,
    disabled,
  })

  const rejectionError =
    fileRejections.length > 0
      ? fileRejections[0].errors.map((e) => e.message).join(', ')
      : null

  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all',
            'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30',
            'dark:border-slate-700 dark:hover:border-blue-400 dark:bg-slate-900/40 dark:hover:bg-blue-950/20',
            isDragActive && 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/40',
            (error || rejectionError) && 'border-red-500 hover:border-red-600 bg-red-50/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-xs mb-2 text-blue-600 dark:text-blue-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
            {isDragActive ? 'Drop your file here...' : 'Click to upload or drag & drop'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-center">
            Max 25MB • PDF, DWG, DXF, Word, Excel, Images, Zip
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono text-center">
            {AllowedFileExtensions.join(' ')}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(error || rejectionError) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || rejectionError}</span>
        </div>
      )}
    </div>
  )
}
