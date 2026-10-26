import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ContentFormat } from '../types';
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  FileWarning,
  ShieldCheck,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Eye
} from 'lucide-react';

const SAMPLE_PROBLEMATIC_CONTENT = `Introducing the revolutionary Alpine Apex Jacket from Northwind Inc.

Engineered with our 100% waterproof Storm-Shield shell, this is genuinely the best in the world alpine jacket ever made. Voted #1 in the world by extreme adventurers, it delivers guaranteed results on every treacherous summit ascent.

We stand behind our gear with our famous lifetime unconditional replacement on all items without questions! Guaranteed warmth down to -50°F in any condition without bulky thermal baselayers.

This gear is insanely good and crafted with eco-miracle materials for a zero-footprint future. Click here to preorder your limited edition size now.`;

export const SubmitPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<ContentFormat>('text');
  const [body, setBody] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadedColors, setUploadedColors] = useState<string[]>([]);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Parsing lexical tokens & phrase boundaries...',
    'Checking draft against 25+ approved terminology rules...',
    'Matching claims against Northwind Approved Fact Sheet...',
    'Auditing digital accessibility (contrast, readability, links)...',
    'Executing cite-or-discard verification on semantic findings...'
  ];

  const handleLoadSample = () => {
    setTitle('Northwind Alpine Apex Technical Shell Launch Copy');
    setFormat('text');
    setBody(SAMPLE_PROBLEMATIC_CONTENT);
    setImageAlt('');
    setUploadedColors(['#00FFFF', '#FF00FF']); // intentionally off-palette neon colors to demonstrate visual audit
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const res = await api.uploadFile(file);
      setTitle(title || res.originalName.replace(/\.[^.]+$/, ''));
      setFormat(res.format);
      setBody(res.extractedText);
      setUploadedFilePath(res.filePath);
      if (res.sampledColors && res.sampledColors.length > 0) {
        setUploadedColors(res.sampledColors);
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your content piece.');
      return;
    }
    if (!body.trim()) {
      setError('Please enter or paste body text, or upload a document.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Simulate step progression for UX transparency
      for (let i = 0; i < steps.length; i++) {
        setAnalysisStep(i);
        await new Promise(r => setTimeout(r, 220));
      }

      const res = await api.createContent({
        title,
        format,
        body,
        file_path: uploadedFilePath || undefined,
        run_check: true,
        image_alt: imageAlt,
        uploaded_colors: uploadedColors.length > 0 ? uploadedColors : undefined
      });

      navigate(`/review/${res.content.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze content');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      
      {/* Title & One-Click Sample Prompt */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Proofreading Desk · New Submission
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-900 dark:text-white">
            Submit Content for InkCheck Review
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Check marketing drafts, product specs, or visual assets against Northwind brand guidelines with full source attribution.
          </p>
        </div>

        {/* The Money Button for Judges */}
        <button
          type="button"
          onClick={handleLoadSample}
          className="px-4 py-2.5 rounded-xl border-2 border-[#E8A13A] bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-[#1D3557] dark:text-amber-200 text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 animate-pulse hover:animate-none"
        >
          <FileWarning className="w-4 h-4 text-[#E8A13A]" />
          <span>Load sample content with problems</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title & Format row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--ink-slate)] mb-1.5">
              Content Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Alpine Traverse 65L Campaign Copy"
              className="w-full text-sm rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] px-4 py-2.5 text-[var(--ink-slate)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink-amber)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-slate)] mb-1.5">
              Format Type
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card-subtle)]">
              <button
                type="button"
                onClick={() => setFormat('text')}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  format === 'text'
                    ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('document')}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  format === 'document'
                    ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Doc</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('image')}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  format === 'image'
                    ? 'bg-[var(--ink-card)] text-[var(--ink-slate)] shadow-xs font-bold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-slate)]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image</span>
              </button>
            </div>
          </div>
        </div>

        {/* File Dropzone / Upload Bar */}
        <div className="p-4 rounded-xl border border-dashed border-[var(--ink-line)] bg-[var(--ink-card-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                Upload Document or Image for Auto-Extraction
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Supports PDF, DOCX, TXT, Markdown, PNG, JPG (parsed directly on server)
              </div>
            </div>
          </div>

          <label className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors shrink-0">
            {isUploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting...</span>
              </span>
            ) : (
              <span>Browse Files</span>
            )}
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
          </label>
        </div>

        {/* Image Alt Text & Palette (when image format active or image attached) */}
        {format === 'image' && (
          <div className="p-4 rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[var(--ink-slate)]">
                Image Alternative Text (WCAG 1.1.1 Accessibility Audit)
              </label>
              <span className="text-[11px] text-[var(--ink-muted)]">
                Required for accessibility compliance
              </span>
            </div>
            <input
              type="text"
              value={imageAlt}
              onChange={e => setImageAlt(e.target.value)}
              placeholder="e.g. Mountaineer wearing Northwind Alpine Apex shell on snow-covered ridge in Glacier National Park"
              className="w-full text-xs rounded-lg border border-[var(--ink-line)] bg-[var(--ink-card-subtle)] p-2.5 text-[var(--ink-slate)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink-amber)]"
            />

            {uploadedColors.length > 0 && (
              <div className="pt-2 border-t border-[var(--ink-line)] flex items-center gap-2">
                <span className="text-xs text-[var(--ink-muted)]">Sampled Image Colors:</span>
                <div className="flex items-center gap-1.5">
                  {uploadedColors.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-md border border-[var(--ink-line)] shadow-2xs"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Body Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--ink-slate)]">
              Content Draft
            </label>
            <span className="text-[11px] text-[var(--ink-muted)] font-mono tabular-nums">
              {body.length} characters · {body.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type or paste draft copy here, or click 'Load sample content with problems' above..."
            rows={12}
            className="w-full text-sm leading-relaxed font-sans rounded-xl border border-[var(--ink-line)] bg-[var(--ink-card)] p-4 text-[var(--ink-slate)] placeholder-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink-amber)]"
          />
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--ink-line)]">
          <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Checks 8 Guidelines, 12 Approved Facts, and 25 Terminology Rules with instant grounding</span>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-[var(--ink-navy)] hover:bg-[var(--ink-navy-dark)] dark:bg-[var(--ink-amber)] dark:text-slate-950 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running InkCheck...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Run InkCheck</span>
              </>
            )}
          </button>
        </div>

        {/* Progress State Overlay if Analyzing */}
        {isAnalyzing && (
          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D3557] dark:text-amber-200">
              <Loader2 className="w-4 h-4 animate-spin text-[#E8A13A]" />
              <span>Analyzing Draft against Brand Knowledge Base...</span>
            </div>
            
            <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
              {steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i < analysisStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : i === analysisStep ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8A13A]" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600" />
                  )}
                  <span className={i === analysisStep ? 'font-semibold text-neutral-900 dark:text-white' : 'opacity-70'}>
                    {st}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </form>

    </div>
  );
};
