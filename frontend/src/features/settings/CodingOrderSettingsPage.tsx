import React, { useEffect, useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCodingOrder } from '@/hooks/useCodingOrder'
import { codingOrderApi } from '@/api'
import type { CodingOrderItem, CodingPart } from '@/types/coding'
import { DEFAULT_CODING_ORDER } from '@/types/coding'
import { toast } from 'sonner'
import {
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Binary,
  Sparkles,
  Copy,
} from 'lucide-react'

// تحويل أسماء السمات الطويلة تلقائياً إلى أكواد حقيقية مختصرة
const getShortSample = (part: string) => {
  const p = part.toLowerCase()
  if (p.includes('form') || p.includes('type')) return 'DWG'
  if (p.includes('project')) return 'PRJ22'
  if (p.includes('contractor') || p.includes('contract')) return 'CTR01'
  if (p.includes('category')) return 'STR'
  if (p.includes('serial')) return '0015'
  if (p.includes('revision') || p.includes('rev')) return '01'
  return part.slice(0, 4).toUpperCase()
}

export const CodingOrderSettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useCodingOrder()
  const [order, setOrder] = useState<CodingOrderItem[]>(DEFAULT_CODING_ORDER)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (data?.length) {
      setOrder(data)
      setDirty(false)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (orderedParts: CodingPart[]) =>
      codingOrderApi.update({ orderedParts }),
    onSuccess: (updated) => {
      setOrder(updated)
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['coding-order'] })
      toast.success('Document coding order updated and applied successfully!')
    },
    onError: () => {
      // Interceptor handles error
    },
  })

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next.map((item, i) => ({ ...item, sortOrder: i + 1 })))
    setDirty(true)
  }

  const handleSave = () => {
    mutation.mutate(order.map((x) => x.part))
  }

  const handleReset = () => {
    if (data?.length) {
      setOrder(data)
      setDirty(false)
    } else {
      setOrder(DEFAULT_CODING_ORDER)
      setDirty(false)
    }
  }

  // كود السيريال المختصر في سطر واحد
  const sampleCode = useMemo(() => {
    return order.map((item) => getShortSample(item.part)).join(' - ')
  }, [order])

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleCode)
    toast.success('Sample code copied to clipboard!')
  }

  return (
    <div className="max-w-4xl space-y-5 pb-12">
      {/* =========================================================
          1. ترويسة الصفحة (Page Header)
      ========================================================= */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Binary className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Document Coding Order
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Reorder the 6 core attributes used to construct standard submittal numbers across contracts.
          </p>
        </div>

        {/* أزرار الحفظ والإلغاء */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!dirty || mutation.isPending}
            onClick={handleReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            disabled={!dirty || mutation.isPending}
            onClick={handleSave}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{mutation.isPending ? 'Saving...' : 'Save Order'}</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      )}

      {!isLoading && !isError && (
        <>
          {/* =========================================================
              2. شاشة عرض السيريال المدمجة والأنيقة (Compact & Sleek)
          ========================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 p-4 text-white shadow-md dark:border-blue-900/40">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/30 text-cyan-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                  Live Coding Syntax Preview
                </span>
                <span className="font-mono text-sm sm:text-base font-black tracking-wider text-white">
                  {sampleCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-blue-200">
                {dirty ? 'Custom' : 'Active'}
              </span>
              <button
                type="button"
                onClick={handleCopySample}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                title="Copy sample code"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* =========================================================
              3. بطاقات السمات القابلة للترتيب بأحجام أنيقة ومتوازنة
          ========================================================= */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attribute Sequence (Drag or use arrows)
            </div>

            <div className="space-y-2">
              {order.map((item, index) => {
                const sample = getShortSample(item.part)
                return (
                  <div
                    key={item.part}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs transition hover:border-blue-300 dark:border-slate-800 dark:bg-[#151c28]"
                  >
                    {/* الترتيب واسم السمة */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {item.displayLabel}
                        </span>
                        <span className="ms-2 font-mono text-[10px] text-slate-400">
                          ({item.part})
                        </span>
                      </div>
                    </div>

                    {/* القيمة التجريبية + أزرار التحريك */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400">
                        {sample}
                      </span>

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-20 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={index === order.length - 1}
                        onClick={() => move(index, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:opacity-20 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CodingOrderSettingsPage