import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Guideline, Fact, Term, Asset } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  Layers,
  Palette,
  ExternalLink,
  X
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { role, authEpoch } = useAuth();
  const isManager = role === 'manager';

  const [activeTab, setActiveTab] = useState<'guidelines' | 'facts' | 'terms' | 'assets'>('guidelines');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Edit / Create Modals
  const [editingGuideline, setEditingGuideline] = useState<Partial<Guideline> | null>(null);
  const [editingFact, setEditingFact] = useState<Partial<Fact> | null>(null);
  const [editingTerm, setEditingTerm] = useState<Partial<Term> | null>(null);

  useEffect(() => {
    loadLibrary();
  }, [role, authEpoch]);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const [g, f, t, a] = await Promise.all([
        api.getGuidelines(),
        api.getFacts(),
        api.getTerms(),
        api.getAssets()
      ]);
      setGuidelines(g);
      setFacts(f);
      setTerms(t);
      setAssets(a);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    try {
      setImporting(true);
      const res = await api.importGuidelines(importText);
      setImportSuccess(`Successfully imported and auto-split ${res.importedCount} guidelines!`);
      setImportText('');
      await loadLibrary();
      setTimeout(() => {
        setImportSuccess(null);
        setImportModalOpen(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Quick Action: Mark Fact Outdated
  const handleMarkFactOutdated = async (fact: Fact) => {
    if (!isManager) return;
    const newStatus = fact.status === 'outdated' ? 'approved' : 'outdated';
    try {
      await api.updateFact(fact.id, {
        ...fact,
        status: newStatus
      });
      setFacts(prev => prev.map(f => f.id === fact.id ? { ...f, status: newStatus } : f));
    } catch (err: any) {
      alert(err.message || 'Failed to update fact');
    }
  };

  // Filtered lists
  const queryLower = search.toLowerCase();
  const filteredGuidelines = guidelines.filter(g =>
    g.title.toLowerCase().includes(queryLower) || g.body.toLowerCase().includes(queryLower) || g.id.toLowerCase().includes(queryLower)
  );
  const filteredFacts = facts.filter(f =>
    f.statement.toLowerCase().includes(queryLower) || f.id.toLowerCase().includes(queryLower) || (f.source_note && f.source_note.toLowerCase().includes(queryLower))
  );
  const filteredTerms = terms.filter(t =>
    t.preferred.toLowerCase().includes(queryLower) || t.banned_variants.toLowerCase().includes(queryLower) || t.reason.toLowerCase().includes(queryLower)
  );
  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(queryLower) || a.type.toLowerCase().includes(queryLower) || a.usage_rules.toLowerCase().includes(queryLower)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Single Source of Brand Truth
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-900 dark:text-white">
            Northwind Brand Library
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Governing rules, approved facts, terminology standards, and visual brand assets that power InkCheck's hybrid detection engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isManager && (
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Document</span>
            </button>
          )}

          {!isManager && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Read-Only View (Switch to Manager role to edit)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Functional segmented tab buttons */}
        <div className="flex items-center gap-1 p-1 bg-[var(--ink-card-subtle)] rounded-xl border border-[var(--ink-line)]">
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'guidelines'
                ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
            }`}
          >
            Guidelines ({guidelines.length})
          </button>

          <button
            onClick={() => setActiveTab('facts')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'facts'
                ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
            }`}
          >
            Approved Facts ({facts.length})
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
            }`}
          >
            Terminology ({terms.length})
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'assets'
                ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
            }`}
          >
            Assets ({assets.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rules, facts, or terms..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1D3557]"
          />
        </div>
      </div>

      {/* Tab 1: Guidelines */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuidelines.map(g => (
            <div
              key={g.id}
              className="p-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#1D3557] dark:text-[#E8A13A]">
                    {g.id}
                  </span>
                  <span>·</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {g.category}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  g.severity_default === 'high'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    : g.severity_default === 'medium'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                }`}>
                  Default: {g.severity_default.toUpperCase()}
                </span>
              </div>

              <h3 className="font-heading font-semibold text-base text-neutral-900 dark:text-white">
                {g.title}
              </h3>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {g.body}
              </p>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>Version {g.version}</span>
                {isManager && (
                  <button
                    onClick={() => setEditingGuideline(g)}
                    className="text-xs text-[#1D3557] dark:text-[#E8A13A] font-medium hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Approved Facts */}
      {activeTab === 'facts' && (
        <div className="rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Fact ID</th>
                  <th className="py-3 px-4">Factual Statement</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Source Note</th>
                  <th className="py-3 px-3">Effective</th>
                  {isManager && <th className="py-3 px-4 text-right">Manager Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredFacts.map(f => (
                  <tr key={f.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {f.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-white max-w-md">
                      {f.statement}
                      {f.replaced_by && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Replaced by approved record: <strong className="font-mono">{f.replaced_by}</strong>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        f.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      }`}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400">
                      {f.source_note || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-neutral-400 font-mono">
                      {f.effective_from}
                    </td>
                    {isManager && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleMarkFactOutdated(f)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                        >
                          {f.status === 'approved' ? 'Mark Outdated' : 'Set Approved'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Terminology */}
      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTerms.map(t => {
            let variants: string[] = [];
            try {
              variants = JSON.parse(t.banned_variants);
            } catch {
              variants = [t.banned_variants];
            }

            return (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span className="font-mono font-bold text-[#1D3557] dark:text-[#E8A13A]">{t.id}</span>
                  <span className="font-mono">Linked: {t.guideline_id}</span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                    Preferred Term
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    "{t.preferred}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-red-700 dark:text-red-400">
                    Prohibited Variants
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variants.map((v, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-[11px] font-mono line-through"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Rationale: </span>
                  {t.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Assets */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(a => {
            let colors: string[] = [];
            try {
              colors = JSON.parse(a.approved_colors);
            } catch {
              colors = ['#1D3557'];
            }

            return (
              <div
                key={a.id}
                className="p-5 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-[#1D3557] dark:text-[#E8A13A]">{a.id}</span>
                  <span className="uppercase font-semibold text-neutral-400">{a.type}</span>
                </div>

                <h3 className="font-heading font-semibold text-base text-neutral-900 dark:text-white">
                  {a.name}
                </h3>

                <div>
                  <span className="text-[11px] font-semibold text-neutral-500">Approved Colors:</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Usage Rules: </span>
                  {a.usage_rules}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1A2332] p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-neutral-900 dark:text-white">
                Import Brand Guidelines & Auto-Split
              </h3>
              <button onClick={() => setImportModalOpen(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Paste guideline prose, policy documents, or markdown. InkCheck automatically parses sections, detects categories, and provisions individual guideline records into SQLite.
            </p>

            {importSuccess && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                {importSuccess}
              </div>
            )}

            <form onSubmit={handleImport} className="space-y-4">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="1. Sustainability Claims: Disallow unverified eco claims...&#10;2. Typography: Maintain 16px body font..."
                rows={8}
                className="w-full text-xs font-mono p-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1D3557]"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1D3557] hover:bg-[#152843] rounded-lg disabled:opacity-50"
                >
                  {importing ? 'Splitting & Importing...' : 'Import to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
