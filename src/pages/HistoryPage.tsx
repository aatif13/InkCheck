import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ContentItem, Revision } from '../types';
import { BrandScoreRing } from '../components/common/BrandScoreRing';
import { ArrowLeft, Clock, History, FileText, CheckCircle2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);

  const [revAId, setRevAId] = useState<string>('');
  const [revBId, setRevBId] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadHistory(id);
    }
  }, [id]);

  const loadHistory = async (contentId: string) => {
    try {
      setLoading(true);
      const [cRes, hRes] = await Promise.all([
        api.getContent(contentId),
        api.getHistory(contentId)
      ]);
      setContent(cRes.content);
      setRevisions(hRes.revisions);

      if (hRes.revisions.length >= 2) {
        setRevAId(hRes.revisions[1].id);
        setRevBId(hRes.revisions[0].id);
      } else if (hRes.revisions.length === 1) {
        setRevAId(hRes.revisions[0].id);
        setRevBId(hRes.revisions[0].id);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const revA = revisions.find(r => r.id === revAId);
  const revB = revisions.find(r => r.id === revBId);

  // Line-by-line diff calculation
  const linesA = (revA?.body || '').split('\n');
  const linesB = (revB?.body || '').split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/dashboard" className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <Link to={`/review/${id}`} className="hover:text-neutral-900 dark:hover:text-white">
          {content?.title || 'Proofreading Desk'}
        </Link>
        <span>/</span>
        <span className="text-neutral-800 dark:text-neutral-200 font-medium">Revision History</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Audit Trail & Revision History
          </div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
            Revisions & Side-by-Side Diffs
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Compare changes across revision runs to verify how brand score improved and how author fixes were incorporated.
          </p>
        </div>

        <Link
          to={`/review/${id}`}
          className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#1D3557] hover:bg-[#152843] dark:bg-[#E8A13A] dark:text-neutral-900 transition-colors"
        >
          Return to Editor
        </Link>
      </div>

      {/* Revision Timeline Strip */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Revision Sequence ({revisions.length} total)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {revisions.map(rev => (
            <div
              key={rev.id}
              className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                rev.id === revBId
                  ? 'border-[var(--ink-amber)] bg-[var(--ink-card-subtle)] ring-1 ring-[var(--ink-amber)]/20'
                  : 'border-[var(--ink-line)] bg-[var(--ink-card)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[var(--ink-slate)]">
                  Revision {rev.number}
                </span>
                <BrandScoreRing score={rev.score || 0} size={36} strokeWidth={4} showLabel={false} />
              </div>

              <div className="text-[11px] text-[var(--ink-muted)] space-y-0.5">
                <div>By {rev.author_name || 'Author'}</div>
                <div>{new Date(rev.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                {rev.note && <div className="italic text-[var(--ink-muted)]">"{rev.note}"</div>}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[var(--ink-line)]">
                <button
                  onClick={() => setRevAId(rev.id)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md border ${
                    revAId === rev.id ? 'bg-[var(--ink-navy)] text-white border-[var(--ink-navy)] dark:bg-[var(--ink-amber)] dark:text-slate-950' : 'border-[var(--ink-line)] text-[var(--ink-muted)]'
                  }`}
                >
                  Set as Diff A (Before)
                </button>
                <button
                  onClick={() => setRevBId(rev.id)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-md border ${
                    revBId === rev.id ? 'bg-[var(--ink-amber)] text-slate-950 border-[var(--ink-amber)] font-bold' : 'border-[var(--ink-line)] text-[var(--ink-muted)]'
                  }`}
                >
                  Set as Diff B (After)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Diff Comparison */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold font-heading text-neutral-900 dark:text-white">
              Side-by-Side Content Comparison
            </h2>
            <p className="text-xs text-neutral-500">
              Comparing Revision {revA?.number || 1} (Score: {revA?.score || 0}) against Revision {revB?.number || 1} (Score: {revB?.score || 0})
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500" />
              <span>Prior Text</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" />
              <span>Refined Revision</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left: Revision A */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span>Revision {revA?.number || 1} (Prior)</span>
              <span className="font-mono tabular-nums text-neutral-500">Score: {revA?.score || 0}</span>
            </div>
            <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
              {revA?.body || 'No prior revision selected.'}
            </div>
          </div>

          {/* Right: Revision B */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <span>Revision {revB?.number || 1} (Refined)</span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">Score: {revB?.score || 0}</span>
            </div>
            <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
              {revB?.body || 'No current revision selected.'}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
