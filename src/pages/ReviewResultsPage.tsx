import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ContentItem, Finding, FindingType, FindingSeverity, Comment, Approval } from '../types';
import { BrandScoreRing } from '../components/common/BrandScoreRing';
import { HighlightOverlay } from '../components/editor/HighlightOverlay';
import {
  Check,
  Edit2,
  X,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Send,
  Cpu,
  Clock,
  ShieldCheck,
  Filter,
  MessageSquare,
  History,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  ChevronDown
} from 'lucide-react';

export const ReviewResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [workingBody, setWorkingBody] = useState<string>('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [customEditText, setCustomEditText] = useState('');

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [newCommentText, setNewCommentText] = useState('');
  const [isRechecking, setIsRechecking] = useState(false);

  const findingCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      setWorkingBody(res.content.current_body || '');
      setFindings(res.findings);
      setComments(res.comments);
      setApprovals(res.approvals);

      if (res.findings.length > 0) {
        setSelectedFindingId(res.findings[0].id);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    const cardEl = findingCardRefs.current[findingId];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 1. Accept Fix Proposal
  const handleAcceptFix = async (finding: Finding) => {
    try {
      // Replace excerpt in working body
      const newBody = workingBody.replace(finding.excerpt, finding.suggestion);
      setWorkingBody(newBody);

      // Update backend finding decision
      const res = await api.updateFindingDecision(finding.id, {
        decision: 'accepted'
      });

      // Update findings list locally
      setFindings(prev => prev.map(f => f.id === finding.id ? res.finding : f));
      if (content) {
        setContent({ ...content, current_score: res.newScore, current_body: newBody });
      }

      setActionSuccess(`Accepted fix: replaced "${finding.excerpt}" with "${finding.suggestion}"`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to accept fix');
    }
  };

  // 2. Edit Fix (Custom Intent-Preserving Wording)
  const handleStartEdit = (finding: Finding) => {
    setEditingFindingId(finding.id);
    setCustomEditText(finding.suggestion);
  };

  const handleSaveCustomEdit = async (finding: Finding) => {
    if (!customEditText.trim()) return;
    try {
      const newBody = workingBody.replace(finding.excerpt, customEditText.trim());
      setWorkingBody(newBody);

      const res = await api.updateFindingDecision(finding.id, {
        decision: 'edited',
        edited_text: customEditText.trim()
      });

      setFindings(prev => prev.map(f => f.id === finding.id ? res.finding : f));
      if (content) {
        setContent({ ...content, current_score: res.newScore, current_body: newBody });
      }
      setEditingFindingId(null);
      setActionSuccess(`Applied customized wording: "${customEditText.trim()}"`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save edit');
    }
  };

  // 3. Reject Fix Proposal
  const handleRejectFix = async (finding: Finding) => {
    try {
      const res = await api.updateFindingDecision(finding.id, {
        decision: 'rejected'
      });

      setFindings(prev => prev.map(f => f.id === finding.id ? res.finding : f));
      if (content) {
        setContent({ ...content, current_score: res.newScore });
      }
      setActionSuccess(`Rejected fix proposal for "${finding.excerpt}"`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject fix');
    }
  };

  // Re-run InkCheck Analysis (creates new revision or re-checks working draft)
  const handleRerunCheck = async () => {
    if (!content) return;
    try {
      setIsRechecking(true);
      // Create new revision with working body
      const revRes = await api.createRevision(content.id, {
        body: workingBody,
        note: 'Applied creator fixes & improvements'
      });

      // Analyze newly created revision
      const anRes = await api.analyzeRevision(revRes.revision.id);

      // Reload content
      await loadContent(content.id);
      setActionSuccess('Re-check complete: New revision created and scored!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to re-run check');
    } finally {
      setIsRechecking(false);
    }
  };

  // Submit Content for Review
  const handleSubmitForReview = async () => {
    if (!content) return;
    const pendingHigh = findings.filter(f => f.severity === 'high' && f.decision === 'pending');

    if (pendingHigh.length > 0 && !overrideReason) {
      setOverrideModalOpen(true);
      return;
    }

    try {
      setSubmittingReview(true);
      await api.submitContent(content.id, overrideReason || undefined);
      setContent({ ...content, status: 'in_review' });
      setOverrideModalOpen(false);
      setOverrideReason('');
      setActionSuccess('Successfully submitted for review! Reviewer has been notified.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !content) return;
    try {
      const res = await api.addComment(content.id, {
        body: newCommentText.trim(),
        finding_id: selectedFindingId || undefined
      });
      setComments(prev => [...prev, res.comment]);
      setNewCommentText('');
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="w-8 h-8 mx-auto border-3 border-[#1D3557] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Loading proofreading desk...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold">Content Not Found</h2>
        <Link to="/dashboard" className="text-xs text-[#1D3557] font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const filteredFindings = findings.filter(f => {
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    return true;
  });

  const highSeverityCount = findings.filter(f => f.severity === 'high').length;
  const pendingHighCount = findings.filter(f => f.severity === 'high' && f.decision === 'pending').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      
      {/* Top Bar: Title, Score Ring, Counts, Submit Button */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Content Title & Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--ink-muted)]">
                {content.id} · Rev {content.revision_number || 1}
              </span>
              <span>·</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                content.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : content.status === 'in_review'
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : content.status === 'changes_requested'
                  ? 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30'
                  : 'bg-[var(--ink-mist)] text-[var(--ink-muted)] border-[var(--ink-line)]'
              }`}>
                {content.status.replace('_', ' ').toUpperCase()}
              </span>
              <span>·</span>
              <span className="text-xs text-[var(--ink-muted)] capitalize">{content.format}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[var(--ink-slate)]">
              {content.title}
            </h1>
          </div>

          {/* Center: Brand Score Ring & Severity Breakdown */}
          <div className="flex items-center gap-6">
            <BrandScoreRing score={content.current_score || 0} size={54} strokeWidth={5} />

            <div className="flex items-center gap-3 text-xs">
              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 tabular-nums">
                  {highSeverityCount}
                </span>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">High</span>
              </div>

              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {mediumCount}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Medium</span>
              </div>

              <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {lowCount}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Low</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRerunCheck}
              disabled={isRechecking}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5"
              title="Save current accepted fixes into a fresh revision and re-run check"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
              <span>Save & Re-check</span>
            </button>

            <Link
              to={`/history/${content.id}`}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>History & Diffs</span>
            </Link>

            {content.status === 'draft' || content.status === 'changes_requested' ? (
              <button
                onClick={handleSubmitForReview}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1D3557] hover:bg-[#152843] dark:bg-[#E8A13A] dark:text-neutral-900 dark:hover:bg-[#d69230] shadow-xs transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            ) : (
              <Link
                to={`/approvals/${content.id}`}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 shadow-xs transition-colors flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Open Approval View</span>
              </Link>
            )}
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in-50 duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Two-Pane Proofreading Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane (7 cols): Content with Inline Color-Coded Highlights */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--ink-line)]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-slate)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ink-amber)]" />
              <span>Interactive Draft & Inline Highlights</span>
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              Click any colored highlight to jump to its citation
            </div>
          </div>

          <div className="min-h-[420px] p-4 rounded-xl bg-[var(--ink-card-subtle)] border border-[var(--ink-line)]">
            <HighlightOverlay
              text={workingBody}
              findings={findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={handleSelectFinding}
            />
          </div>

          {/* Color Code Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Highlight Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#C0392B]/30 border-b-2 border-[#C0392B]" />
              <span>High (Legal / Outdated Fact)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#E8A13A]/30 border-b-2 border-[#E8A13A]" />
              <span>Medium (Terminology / Access)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2F80A8]/30 border-b-2 border-[#2F80A8]" />
              <span>Low (Tone / Grade Level)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/25 border-b-2 border-emerald-600" />
              <span>Accepted / Resolved</span>
            </div>
          </div>
        </div>

        {/* Right Pane (5 cols): Findings List Grouped/Filterable */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Filter Bar */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none"
              >
                <option value="all">All Types ({findings.length})</option>
                <option value="terminology">Terminology</option>
                <option value="fact">Outdated Fact</option>
                <option value="claim">Claims</option>
                <option value="accessibility">Accessibility</option>
                <option value="tone">Tone</option>
                <option value="visual">Visual</option>
              </select>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="high">High Only ({highSeverityCount})</option>
                <option value="medium">Medium Only ({mediumCount})</option>
                <option value="low">Low Only ({lowCount})</option>
              </select>
            </div>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredFindings.length === 0 ? (
              <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <h3 className="text-sm font-semibold">No Findings in this Filter</h3>
                <p className="text-xs text-neutral-500">All checks in this category are clear or resolved.</p>
              </div>
            ) : (
              filteredFindings.map(f => {
                const isSelected = f.id === selectedFindingId;
                const isEditing = f.id === editingFindingId;

                const severityBorder =
                  f.severity === 'high'
                    ? 'border-l-4 border-l-[var(--severity-high)]'
                    : f.severity === 'medium'
                    ? 'border-l-4 border-l-[var(--severity-medium)]'
                    : 'border-l-4 border-l-[var(--severity-low)]';

                return (
                  <div
                    key={f.id}
                    ref={el => { findingCardRefs.current[f.id] = el; }}
                    onClick={() => setSelectedFindingId(f.id)}
                    className={`rounded-xl border transition-all duration-150 p-4 bg-[var(--ink-card)] shadow-xs cursor-pointer ${severityBorder} ${
                      isSelected
                        ? 'border-[var(--ink-amber)] ring-2 ring-[var(--ink-amber)]/30'
                        : 'border-[var(--ink-line)] hover:border-[var(--ink-amber)]/50'
                    }`}
                  >
                    {/* Header Chips */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                          {f.type}
                        </span>
                        <span>·</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          f.severity === 'high'
                            ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                            : f.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-[var(--ink-line)] text-[var(--ink-muted)] bg-[var(--ink-card-subtle)]">
                          {f.detected_by === 'ai' ? 'AI Grounded' : 'Rules Engine'}
                        </span>

                        {f.decision !== 'pending' && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            f.decision === 'accepted'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                              : f.decision === 'edited'
                              ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                              : 'bg-[var(--ink-mist)] text-[var(--ink-muted)] border border-[var(--ink-line)]'
                          }`}>
                            {f.decision.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Why this was flagged */}
                    <p className="text-xs text-[var(--ink-slate)] leading-relaxed font-medium">
                      {f.explanation}
                    </p>

                    {/* Source Citation Box */}
                    <div className="mt-3 p-3 rounded-lg bg-[var(--ink-card-subtle)] border border-[var(--ink-line)] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[var(--ink-slate)] flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[var(--ink-amber)]" />
                          <span>Cited Source: {f.source_id}</span>
                        </span>
                        <Link
                          to="/library"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-[var(--ink-amber)] hover:underline font-bold"
                        >
                          View in Library
                        </Link>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)] italic">
                        "{f.source_quote}"
                      </p>
                    </div>

                    {/* Diff: Excerpt -> Suggestion */}
                    <div className="mt-3 p-2.5 rounded-lg border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] space-y-1 text-xs font-mono">
                      <div className="text-red-600 dark:text-red-400 line-through text-[11px]">
                        - {f.excerpt}
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        + {f.edited_text || f.suggestion}
                      </div>
                    </div>

                    {/* Edit Input (if editing) */}
                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={customEditText}
                          onChange={e => setCustomEditText(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[var(--ink-line)] bg-[var(--ink-card)] text-[var(--ink-slate)] focus:outline-none focus:ring-1 focus:ring-[var(--ink-amber)]"
                          placeholder="Refine intent-preserving wording..."
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingFindingId(null)}
                            className="px-2.5 py-1 text-xs rounded-md text-[var(--ink-muted)] hover:bg-[var(--ink-mist)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCustomEdit(f)}
                            className="px-3 py-1 text-xs font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800"
                          >
                            Apply Custom Wording
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Human Decision Buttons: Accept · Edit · Reject */
                      <div className="mt-3 pt-3 border-t border-[var(--ink-line)] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptFix(f);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            f.decision === 'accepted'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Fix</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(f);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-slate)] border border-[var(--ink-line)] hover:bg-[var(--ink-mist)] transition-colors flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Custom Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectFix(f);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            f.decision === 'rejected'
                              ? 'bg-[var(--ink-muted)] text-white'
                              : 'text-[var(--ink-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          {/* Comments Thread Mini Box */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A2332] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#E8A13A]" />
                <span>Discussion & Reviewer Notes ({comments.length})</span>
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
              {comments.length === 0 ? (
                <div className="text-neutral-400 text-center py-2">No comments yet.</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {c.user_name} ({c.user_role})
                      </span>
                      <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 text-[11px] leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder="Add contextual note or question..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1D3557] dark:bg-[#E8A13A] dark:text-neutral-900 hover:opacity-90"
              >
                Send
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Override Modal for Unresolved High Severity Findings */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A2332] p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold font-heading text-neutral-900 dark:text-white">
                  High-Severity Policy Gate Triggered
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  You have <strong className="text-red-700 dark:text-red-400 font-semibold">{pendingHighCount} unresolved high-severity finding(s)</strong>.
                  Brand governance requires that you either resolve them or document a business override reason for the audit trail.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Override Justification (Logged in Audit History)
              </label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="e.g. Approved by legal counsel in ticket #LEG-409 pending final external certificate"
                className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
              >
                Go Back & Fix Issues
              </button>

              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={!overrideReason.trim() || submittingReview}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg disabled:opacity-50"
              >
                Log Override & Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
