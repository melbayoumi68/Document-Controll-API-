import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultantReviewsApi } from '@/api'
import { useUserStore, useUIStore } from '@/stores'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Ratings, RatingType, RatingInfo } from '@/types'
import { toast } from 'sonner'
import { CheckSquare, AlertTriangle } from 'lucide-react'

export const SubmitReviewModal: React.FC = () => {
  const { currentUser, isConsultant, isSuperAdmin } = useUserStore()
  const { reviewModal, closeReview } = useUIStore()
  const queryClient = useQueryClient()

  const [selectedRating, setSelectedRating] = useState<RatingType>(Ratings.A)
  const [comments, setComments] = useState('')

  const { open, versionId, documentNumber, versionNumber } = reviewModal

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('No user selected.')
      if (!versionId) throw new Error('Document version not specified.')

      return await consultantReviewsApi.submitReview({
        versionId,
        rating: selectedRating,
        comments: comments.trim() || undefined,
      })
    },
    onSuccess: (review) => {
      toast.success(`Review submitted with Rating ${review.rating}! Status updated.`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['consultant-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['document-versions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      closeReview()
      setComments('')
      setSelectedRating(Ratings.A)
    },
  })

  const ratingsList: RatingType[] = [Ratings.A, Ratings.B, Ratings.C, Ratings.D]

  return (
    <Modal
      isOpen={open}
      onClose={closeReview}
      title={
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-600" />
          <span>Consultant Review & Approval</span>
        </div>
      }
      description="Evaluate submittal version and submit authoritative engineering review."
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          reviewMutation.mutate()
        }}
        className="space-y-5"
      >
        {/* Target Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Submittal Document</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Revision: {versionNumber || '01'}
            </span>
          </div>
          <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
            {documentNumber}
          </p>
        </div>

        {/* Rating Options Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            Select Decision Rating *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ratingsList.map((rating) => {
              const info = RatingInfo[rating]
              const isSelected = selectedRating === rating
              return (
                <div
                  key={rating}
                  onClick={() => setSelectedRating(rating)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? `${info.badgeClass} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 shadow-sm`
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black">{info.label}</span>
                    <input
                      type="radio"
                      name="rating"
                      checked={isSelected}
                      onChange={() => setSelectedRating(rating)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {info.meaning}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notice on Immutability */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200/80 dark:border-amber-900/40">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Note:</strong> Submitted reviews are permanent and cannot be modified or deleted.
          </span>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            Consultant Remarks & Technical Comments
          </label>
          <Textarea
            placeholder="Specify technical notes, corrections, specifications adherence, or reasons for rejection..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={closeReview}
            disabled={reviewMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={reviewMutation.isPending}
          >
            Confirm & Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  )
}
