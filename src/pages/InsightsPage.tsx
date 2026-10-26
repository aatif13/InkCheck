import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  AlertOctagon,
  FileQuestion,
  Award,
  Clock,
  MessageSquare,
  Star,
  CheckCircle2,
  Lock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const COLORS = ['#1D3557', '#E8A13A', '#2E8B6B', '#2F80A8', '#C0392B', '#8A93A3'];

export const InsightsPage: React.FC = () => {
  const { role, switchRole, authEpoch } = useAuth();
  const isManager = role === 'manager';

  const [data, setData] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isManager) {
      setLoading(false);
      return;
    }
    loadInsights();
  }, [role, authEpoch, isManager]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getInsights();
      setData(res);

      const fbRes = await api.getFeedbacks().catch(() => ({ feedbacks: [] }));
      setFeedbacks(fbRes.feedbacks);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  // Role Gate Screen for non-managers
  if (!isManager) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Manager Role Required
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--ink-slate)]">
            Executive Brand Compliance & Friction Analytics
          </h1>
          <p className="text-sm text-[var(--ink-muted)] max-w-lg mx-auto leading-relaxed">
            Detailed compliance audit metrics, repeated mistake frequency, and unclear guideline detection are restricted to the <strong className="text-[var(--ink-slate)]">Brand Manager</strong> persona (Marcus Vance).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] max-w-md mx-auto space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-xl bg-[var(--ink-card-subtle)] border border-[var(--ink-line)]">
              <UserCheck className="w-5 h-5 text-[var(--ink-amber)]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--ink-slate)]">Switch to Brand Manager</div>
              <div className="text-[11px] text-[var(--ink-muted)]">Instant JWT elevation as Marcus Vance</div>
            </div>
          </div>

          <button
            onClick={() => switchRole('manager')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--ink-navy)] hover:bg-[var(--ink-navy-dark)] dark:bg-[var(--ink-amber)] dark:text-slate-950 transition-colors shadow-xs"
          >
            Switch to Marcus Vance (Brand Manager)
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="w-8 h-8 mx-auto border-3 border-[var(--ink-amber)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[var(--ink-muted)] mt-2">Computing governance insights & friction metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--ink-line)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
            Governance Intelligence & Auditing
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--ink-slate)]">
            Brand Compliance Insights & Friction Metrics
          </h1>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Track recurring brand guideline violations, creator override rates, and identify guidelines needing editorial refinement.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Compliance Rate: {data.stats?.complianceRate || '93.5%'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Avg Approval: {data.stats?.avgTimeToApprovalHours || 4.2}h</span>
          </div>
        </div>
      </div>

      {/* Plain Language Takeaways Bar */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Executive Governance Takeaways
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.takeaways?.map((t: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-navy)] dark:text-[var(--ink-amber)]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t.title}</span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {t.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: Findings by Type & Score Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Findings by Type (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold font-heading text-[var(--ink-slate)]">
              Findings Distribution by Rule Category
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)]">Total detected issues across all checked revisions</p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.findingsByType}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ink-card)',
                    borderColor: 'var(--ink-line)',
                    color: 'var(--ink-slate)',
                    borderRadius: '0.75rem',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" fill="var(--ink-navy)" radius={[4, 4, 0, 0]}>
                  {data.findingsByType?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-[var(--ink-muted)] italic pt-1">
            Takeaway: Terminology variants and unsupported superlatives represent over 60% of brand debt.
          </p>
        </div>

        {/* Chart 2: Score Trend Over Time (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold font-heading text-[var(--ink-slate)]">
              Average Brand Score Trend Across Review Runs
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)]">Progression from initial draft submission through final reviewer sign-off</p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.scoreTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--ink-card)',
                    borderColor: 'var(--ink-line)',
                    color: 'var(--ink-slate)',
                    borderRadius: '0.75rem',
                    fontSize: '11px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="var(--ink-amber)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--ink-navy)' }}
                  name="Brand Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-[var(--ink-muted)] italic pt-1">
            Takeaway: Teams applying InkCheck proposals improve their initial draft scores from 68 to 92 before sign-off.
          </p>
        </div>

      </div>

      {/* Row 2: Most Repeated Mistakes & Unclear Guidelines Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Repeated Mistakes */}
        <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold font-heading text-[var(--ink-slate)]">
              Top Repeated Brand Mistakes
            </h2>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">Phrases and banned terms most frequently flagged across drafts</p>

          <div className="space-y-2.5 pt-1">
            {data.repeatedMistakes?.map((m: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-red-600 dark:text-red-400">
                    "{m.excerpt}"
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    Suggested replacement: <strong className="text-emerald-600 dark:text-emerald-400">"{m.suggestion}"</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold tabular-nums text-[var(--ink-slate)]">
                    {m.occurrences} flags
                  </span>
                  <div className="text-[10px] text-[var(--ink-muted)] font-mono">Source {m.source_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unclear Guidelines List (High Rejection / Override Rate) */}
        <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-[var(--ink-amber)]" />
            <h2 className="text-sm font-bold font-heading text-[var(--ink-slate)]">
              Unclear Guidelines (High Rejection or Override Rate)
            </h2>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">
            Guidelines where authors frequently rejected suggested fixes or provided custom edits
          </p>

          <div className="space-y-2.5 pt-1">
            {data.unclearGuidelines?.map((ug: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[var(--ink-slate)] flex items-center gap-2">
                    <span className="font-mono text-[var(--ink-amber)]">{ug.source_id}</span>
                    <span>{ug.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--ink-muted)]">{ug.category}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] pt-1">
                  <span>{ug.total_flags} total triggers</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {ug.rejected_count} author overrides ({Math.round((ug.rejected_count / ug.total_flags) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-[var(--ink-muted)] italic">
            Recommendation: Consider revising GD-01 to add approved positive examples rather than just prohibited buzzwords.
          </div>
        </div>

      </div>

      {/* Manager-Only Section: User Testing Feedback Table */}
      <div className="rounded-2xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--ink-amber)]" />
            <h2 className="text-base font-bold font-heading text-[var(--ink-slate)]">
              User Testing Evaluation Responses (Manager View)
            </h2>
          </div>
          <span className="text-xs text-[var(--ink-muted)] font-mono">feedbacks table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--ink-card-subtle)] text-[var(--ink-muted)] border-b border-[var(--ink-line)] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Focus</th>
                <th className="py-2.5 px-3">Rating</th>
                <th className="py-2.5 px-3">Feedback Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-line)] text-[var(--ink-slate)]">
              {feedbacks.map(fb => (
                <tr key={fb.id}>
                  <td className="py-3 px-3 text-[var(--ink-muted)] tabular-nums">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 font-medium text-[var(--ink-slate)]">
                    {fb.user_name || 'Evaluator'} ({fb.user_role || 'user'})
                  </td>
                  <td className="py-3 px-3 uppercase text-[10px] font-semibold text-[var(--ink-muted)]">
                    {fb.category}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center text-[var(--ink-amber)]">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[var(--ink-amber)]" />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[var(--ink-slate)] max-w-md leading-relaxed">
                    "{fb.comment}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
