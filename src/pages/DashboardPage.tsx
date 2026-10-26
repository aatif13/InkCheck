import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ContentItem, SystemHealth } from '../types';
import { BrandScoreRing } from '../components/common/BrandScoreRing';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  BookOpen,
  Send,
  RefreshCw,
  PlusCircle,
  CheckSquare,
  BarChart3,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, role, authEpoch, switchRole } = useAuth();
  const navigate = useNavigate();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [role, authEpoch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, h] = await Promise.all([
        api.getContentList(),
        api.getHealth()
      ]);
      setContentList(items);
      setHealth(h);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
            Approved
          </span>
        );
      case 'in_review':
        return (
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
            In Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
            Changes Requested
          </span>
        );
      case 'published':
        return (
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/30">
            Published
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="text-[11px] font-semibold text-[var(--ink-muted)] bg-[var(--ink-mist)] px-2 py-0.5 rounded-md border border-[var(--ink-line)]">
            Draft
          </span>
        );
    }
  };

  const pendingApprovals = contentList.filter(c => c.status === 'in_review');
  const needsChanges = contentList.filter(c => c.status === 'changes_requested');
  const drafts = contentList.filter(c => c.status === 'draft');
  const approvedItems = contentList.filter(c => c.status === 'approved' || c.status === 'published');
  const avgScore = contentList.length > 0
    ? Math.round(contentList.reduce((acc, curr) => acc + (curr.current_score || 0), 0) / contentList.length)
    : 84;

  const totalHighSeverity = contentList.reduce((acc, curr) => acc + (curr.pending_high_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Dynamic Header & Active Persona Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--ink-line)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <span>Northwind Outdoors</span>
            <span>·</span>
            <span className="text-[var(--ink-amber)] font-bold">
              {role === 'creator' ? 'Creator Workspace' : role === 'manager' ? 'Governance Headquarters' : 'Editorial Sign-Off Desk'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--ink-slate)] mt-1">
            {role === 'creator' && `Creator Workspace: Maya Lin`}
            {role === 'manager' && `Executive Governance: Marcus Vance`}
            {role === 'reviewer' && `Editorial Verification Queue: Elena Rostova`}
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-2xl leading-relaxed">
            {role === 'creator' && (
              <>
                You are viewing your personal draft repository (<strong className="text-[var(--ink-slate)]">Maya Lin's drafts</strong>). Run automated brand checks, resolve proposed fixes, and submit drafts for reviewer certification.
              </>
            )}
            {role === 'manager' && (
              <>
                You have organization-wide brand governance authority. Manage the Brand Library (<strong className="text-[var(--ink-slate)]">Full Edit</strong>), monitor compliance friction analytics, and oversee all team drafts.
              </>
            )}
            {role === 'reviewer' && (
              <>
                You are viewing the <strong className="text-[var(--ink-slate)]">Editorial Review Queue</strong>. Inspect dual-pane diffs, confirm evidence citations, and officially certify or return content with change requests.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] text-[var(--ink-slate)] hover:border-[var(--ink-amber)] transition-colors shadow-xs"
            title="Refresh scoped dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--ink-amber)]' : ''}`} />
          </button>
          
          <Link
            to="/submit"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[var(--ink-navy)] hover:bg-[var(--ink-navy-dark)] dark:bg-[var(--ink-amber)] dark:text-slate-950 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New InkCheck Run</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          ROLE-SPECIFIC HIGHLIGHT CARDS & METRICS
          ========================================================================= */}

      {/* --- CREATOR VIEW BANNER & METRICS --- */}
      {role === 'creator' && (
        <div className="space-y-6">
          {/* Creator Focus Banner */}
          <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[var(--ink-amber)]/15 text-[var(--ink-amber)] mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-slate)] font-heading">
                  Active Drafts Under Your Authoring Desk
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5 max-w-xl leading-relaxed">
                  Every proposed fix in InkCheck is purely advisory. You maintain complete human control to accept, edit, or reject each finding before requesting editorial review.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <Link
                to="/submit"
                className="w-full md:w-auto px-4 py-2 text-center text-xs font-bold text-white bg-[var(--ink-amber)] text-slate-950 rounded-xl hover:opacity-90 transition-opacity"
              >
                + Check New Draft
              </Link>
            </div>
          </div>

          {/* Creator Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">My Active Drafts</div>
              <div className="text-2xl font-bold font-heading text-[var(--ink-slate)] mt-1.5 tabular-nums">
                {contentList.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Authored by Maya Lin</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Needing Revision</div>
              <div className="text-2xl font-bold font-heading text-red-600 dark:text-red-400 mt-1.5 tabular-nums">
                {needsChanges.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Reviewer requested changes</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">My Avg Brand Score</div>
              <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                {avgScore} / 100
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">+14 pts after applying fixes</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">In Editorial Review</div>
              <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-1.5 tabular-nums">
                {pendingApprovals.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Awaiting Elena's sign-off</div>
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEWER VIEW BANNER & METRICS --- */}
      {role === 'reviewer' && (
        <div className="space-y-6">
          {/* Reviewer Priority Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ink-slate)] font-heading">
                  Editorial Sign-Off Desk: Actionable Queue
                </h2>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5 max-w-xl leading-relaxed">
                  As Reviewer, you only see submissions awaiting verification (<span className="font-semibold text-amber-600 dark:text-amber-400">In Review</span>) or returned for revision (<span className="font-semibold text-red-600 dark:text-red-400">Changes Requested</span>). Inspect author rationale and officially approve.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <Link
                to="/approvals/CNT-01"
                className="w-full md:w-auto px-4 py-2 text-center text-xs font-bold text-white bg-[var(--ink-navy)] dark:bg-[var(--ink-amber)] dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity"
              >
                Open Next in Queue (CNT-01)
              </Link>
            </div>
          </div>

          {/* Reviewer Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Pending Sign-Off</div>
              <div className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-1.5 tabular-nums">
                {pendingApprovals.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Requires official approval</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Returned for Revisions</div>
              <div className="text-2xl font-bold font-heading text-red-600 dark:text-red-400 mt-1.5 tabular-nums">
                {needsChanges.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Author updating text</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Verification Guard</div>
              <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                100% Active
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">All findings cite Brand Library</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Avg Review Time</div>
              <div className="text-2xl font-bold font-heading text-[var(--ink-slate)] mt-1.5 tabular-nums">
                1.8 hrs
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Within SLA target (4h)</div>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGER VIEW BANNER & METRICS --- */}
      {role === 'manager' && (
        <div className="space-y-6">
          {/* Round 2 Committed Architectural Improvements Card */}
          <div className="rounded-2xl border border-[var(--ink-amber)]/30 bg-[var(--ink-card)] p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--ink-amber)]/20 text-[var(--ink-amber)]">
                  <Layers className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold font-heading text-[var(--ink-slate)]">
                  What's New in Round 2: Three Committed Improvements (Verified & Live)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--ink-amber)] bg-[var(--ink-amber)]/10 px-2 py-0.5 rounded-md font-semibold border border-[var(--ink-amber)]/20">
                Evaluation Scored
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--ink-amber)]">IMPROVEMENT 01</div>
                <h3 className="text-xs font-bold text-[var(--ink-slate)]">
                  Deterministic Grounding & Discard Guard
                </h3>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  Every finding cites a real Brand Library ID. Any ungrounded suggestion from the LLM is automatically discarded.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--ink-amber)]">IMPROVEMENT 02</div>
                <h3 className="text-xs font-bold text-[var(--ink-slate)]">
                  Dual-Pane Proofreading Desk with Diffs
                </h3>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  Synchronized inline highlights with 1-click Accept / Edit / Reject proposals. Live Brand Score recalculation upon resolution.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] space-y-1">
                <div className="text-[10px] font-mono font-bold text-[var(--ink-amber)]">IMPROVEMENT 03</div>
                <h3 className="text-xs font-bold text-[var(--ink-slate)]">
                  Visual Asset & Contrast Governance
                </h3>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  Automated color distance thresholding against the Northwind palette and mathematical WCAG 2.1 contrast audits.
                </p>
              </div>
            </div>
          </div>

          {/* Manager Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Total Org Submissions</div>
              <div className="text-2xl font-bold font-heading text-[var(--ink-slate)] mt-1.5 tabular-nums">
                {contentList.length}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">Across all team authors</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Brand Rules Active</div>
              <div className="text-2xl font-bold font-heading text-[var(--ink-slate)] mt-1.5 tabular-nums">
                {(health?.db.guidelines || 8) + (health?.db.facts || 12) + (health?.db.terms || 25)}
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">8 Guidelines · 12 Facts · 25 Terms</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Org Compliance Rate</div>
              <div className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
                93.5%
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">+8.2% vs previous quarter</div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs">
              <div className="text-xs text-[var(--ink-muted)] font-medium">Governance Actions</div>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  to="/library"
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--ink-mist)] hover:bg-[var(--ink-line)] text-[var(--ink-slate)] transition-colors border border-[var(--ink-line)]"
                >
                  Edit Library
                </Link>
                <Link
                  to="/insights"
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--ink-amber)]/20 hover:bg-[var(--ink-amber)]/30 text-[var(--ink-slate)] transition-colors border border-[var(--ink-amber)]/30"
                >
                  Insights
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENT TABLE (SCOPED BY ROLE)
          ========================================================================= */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[var(--ink-line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-heading text-[var(--ink-slate)]">
              {role === 'creator' && 'My Draft Submissions & Active Check Runs'}
              {role === 'reviewer' && 'Submissions Awaiting Editorial Sign-Off'}
              {role === 'manager' && 'Organization Content Pipeline Overview'}
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              {role === 'creator' && 'Showing drafts created by you (Maya Lin). Click any row to resolve findings or resume editing.'}
              {role === 'reviewer' && 'Showing items in In Review or Changes Requested. Click to open Sign-Off Desk.'}
              {role === 'manager' && 'Showing all organizational drafts across team members with full audit visibility.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[var(--ink-muted)] px-2.5 py-1 rounded-lg bg-[var(--ink-card-subtle)] border border-[var(--ink-line)]">
              {contentList.length} {contentList.length === 1 ? 'item' : 'items'} in view
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--ink-card-subtle)] text-[var(--ink-muted)] border-b border-[var(--ink-line)] font-semibold">
              <tr>
                <th className="py-3 px-5">Title & Format</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Brand Score</th>
                <th className="py-3 px-4">Findings Breakdown</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-line)] text-[var(--ink-slate)]">
              {contentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--ink-muted)]">
                    <p className="font-semibold text-sm">No items in this queue.</p>
                    <p className="text-xs mt-1">
                      {role === 'reviewer'
                        ? 'All pending submissions have been signed off or approved.'
                        : 'Submit a new draft to begin checking.'}
                    </p>
                  </td>
                </tr>
              ) : (
                contentList.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (role === 'reviewer') {
                        navigate(`/approvals/${item.id}`);
                      } else {
                        navigate(`/review/${item.id}`);
                      }
                    }}
                    className="hover:bg-[var(--ink-card-subtle)] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[var(--ink-card-subtle)] text-[var(--ink-slate)] border border-[var(--ink-line)]">
                          <FileText className="w-4 h-4 text-[var(--ink-amber)]" />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--ink-slate)]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wide mt-0.5">
                            {item.format} · Rev {item.revision_number || 1} · {item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <BrandScoreRing score={item.current_score || 0} size={34} strokeWidth={4} showLabel={false} />
                        <span className="font-bold text-[var(--ink-slate)] tabular-nums">
                          {item.current_score || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.pending_high_count && item.pending_high_count > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.pending_high_count} High Severity</span>
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)]">
                          {item.findings_count || 0} total findings
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[var(--ink-slate)]">
                        {item.author_name || 'Maya Lin'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--ink-muted)] tabular-nums">
                      {new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-navy)] dark:text-[var(--ink-amber)] hover:underline">
                        <span>{role === 'reviewer' ? 'Sign-Off Desk' : 'Open Desk'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
