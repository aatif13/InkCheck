import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ContentItem, Finding, Comment, Approval } from '../types';
import { BrandScoreRing } from '../components/common/BrandScoreRing';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Download,
  Copy,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Lock,
  Printer
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const canApprove = role === 'reviewer' || role === 'manager';

  const [content, setContent] = useState<ContentItem | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const [decisionNote, setDecisionNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadContent(id);
    }
  }, [id]);

  const loadContent = async (contentId: string) => {
    try {
      setLoading(true);
      const res = await api.getContent(contentId);
      setContent(res.content);
      setFindings(res.findings);
      setComments(res.comments);
      setApprovals(res.approvals);
    } catch (err) {
      console.error('Failed to load approval content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'approved' | 'changes_requested') => {
    if (!content || !canApprove) return;
    if (decision === 'changes_requested' && !decisionNote.trim()) {
      alert('Please provide a note explaining what changes are requested for the author.');
      return;
    }

    try {
      setSubmittingDecision(true);
      const res = await api.submitApproval(content.id, {
        decision,
        note: decisionNote.trim() || undefined
      });
      setContent({ ...content, status: res.status as any });
      setApprovals(prev => [res.approval, ...prev]);
      setDecisionNote('');
    } catch (err: any) {
      alert(err.message || 'Approval action failed');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Generate Export Document with Official Certification Stamp
  const latestApproval = approvals.find(a => a.decision === 'approved');
  const approvalDate = latestApproval ? new Date(latestApproval.created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const approverName = latestApproval?.reviewer_name || user?.name || 'Elena Rostova';

  const exportText = `${content?.title}\nFormat: ${content?.format.toUpperCase()} · Certified Brand Compliant\n\n${content?.current_body}\n\n------------------------------------------------------------\nApproved by ${approverName} on ${approvalDate} — Certified by InkCheck Governance Platform\nBrand Compliance Score: ${content?.current_score || 100}/100\nOrganization: Northwind Outdoors (org-northwind-01)\n------------------------------------------------------------`;

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_approved.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMd = () => {
    const mdContent = `# ${content?.title}\n\n> **Certified by InkCheck** · Approved by ${approverName} on ${approvalDate}\n> Brand Score: ${content?.current_score || 100}/100\n\n${content?.current_body}\n\n---\n*Certified Publication Copy · Northwind Outdoors*`;
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_approved.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 mx-auto border-3 border-[#1D3557] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-3">
        <h2 className="text-base font-bold">Content Not Found</h2>
        <Link to="/dashboard" className="text-xs text-[#1D3557] font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isApproved = content.status === 'approved' || content.status === 'published';

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/dashboard" className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <Link to={`/review/${content.id}`} className="hover:text-neutral-900 dark:hover:text-white">
          Proofreading Desk
        </Link>
        <span>/</span>
        <span className="text-neutral-800 dark:text-neutral-200 font-medium">Review & Sign-off</span>
      </div>

      {/* Main Review Card */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-6 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--ink-line)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[var(--ink-muted)]">
                {content.id} · Rev {content.revision_number || 1}
              </span>
              <span>·</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : content.status === 'in_review'
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30'
              }`}>
                {content.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-[var(--ink-slate)]">
              {content.title}
            </h1>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Author: {content.author_name || 'Maya Lin'} · Last Updated {new Date(content.updated_at).toLocaleString()}
            </p>
          </div>

          <BrandScoreRing score={content.current_score || 0} size={60} strokeWidth={5} />
        </div>

        {/* Content Body Display */}
        <div className="p-5 rounded-xl bg-[var(--ink-card-subtle)] border border-[var(--ink-line)] text-sm leading-relaxed whitespace-pre-wrap font-sans text-[var(--ink-slate)]">
          {content.current_body}
        </div>

        {/* Findings Resolution Summary */}
        <div className="p-4 rounded-xl bg-[var(--ink-card-subtle)] border border-[var(--ink-line)] space-y-2">
          <div className="text-xs font-bold text-[var(--ink-slate)]">
            Author Finding Decisions & Compliance Record
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[var(--ink-card)] border border-[var(--ink-line)]">
              <span className="text-neutral-500 text-[11px]">Accepted Fixes:</span>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {findings.filter(f => f.decision === 'accepted').length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 text-[11px]">Custom Intent Edits:</span>
              <div className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                {findings.filter(f => f.decision === 'edited').length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 text-[11px]">Rejected / Overridden:</span>
              <div className="text-base font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                {findings.filter(f => f.decision === 'rejected').length}
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Publish & Export Section (if approved) */}
        {isApproved && (
          <div className="p-5 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold font-heading text-base">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Ready to Publish · Certified Brand Compliant</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              This content has been formally approved and signed off. Use the export actions below to export clean text stamped with reviewer authentication metadata.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopyExport}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Stamped Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>

              <button
                onClick={handleDownloadMd}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* Reviewer Sign-Off Action Controls (if not yet approved) */}
        {!isApproved && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                Reviewer Evaluation Note
              </label>
              <textarea
                value={decisionNote}
                onChange={e => setDecisionNote(e.target.value)}
                placeholder="Optional sign-off comment or specific instructions for required revisions..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1D3557]"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-neutral-400">
                Signing off as <strong className="text-neutral-700 dark:text-neutral-300">{user?.name}</strong> ({role})
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision('changes_requested')}
                  disabled={submittingDecision || !canApprove}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision('approved')}
                  disabled={submittingDecision || !canApprove}
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Certify</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
