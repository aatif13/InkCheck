import React, { useState } from 'react';
import { api } from '../../services/api';
import { Star, X, Check, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'ux' | 'rules' | 'governance' | 'general'>('ux');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide your feedback comment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.submitFeedback({ rating, comment, category });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComment('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1A2332] p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in-50 zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your evaluation observations have been recorded in the governance audit database.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
                Share Evaluation Feedback
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                InkCheck captures structured user feedback directly to SQLite. Brand managers review responses under Insights.
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-[#E8A13A] fill-[#E8A13A]'
                          : 'text-neutral-300 dark:text-neutral-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {rating} of 5 stars
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Feedback Focus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ux', label: 'Proofreading UX' },
                  { id: 'rules', label: 'Rules & Citations' },
                  { id: 'governance', label: 'Approval Flow' },
                  { id: 'general', label: 'General / Other' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors font-medium ${
                      category === cat.id
                        ? 'border-[#E8A13A] bg-amber-50 dark:bg-amber-950/30 text-[#1D3557] dark:text-amber-200'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Comment & Observations
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="How was the highlight clarity, citation accuracy, or suggested fix diff?"
                rows={3}
                className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-2.5 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E8A13A]/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D3557] dark:bg-[#E8A13A] dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
