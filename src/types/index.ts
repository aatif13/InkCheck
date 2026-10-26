export type Role = 'creator' | 'manager' | 'reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  org_id: string;
  avatar_url?: string;
}

export type ContentFormat = 'text' | 'image' | 'document';
export type ContentStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';

export interface ContentItem {
  id: string;
  org_id: string;
  title: string;
  format: ContentFormat;
  status: ContentStatus;
  created_by: string;
  current_revision_id: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
  current_score?: number;
  revision_number?: number;
  current_body?: string;
  findings_count?: number;
  pending_high_count?: number;
}

export interface Revision {
  id: string;
  content_id: string;
  number: number;
  body: string;
  file_path?: string | null;
  score: number;
  created_by: string;
  created_at: string;
  note?: string;
  author_name?: string;
  author_email?: string;
  author_avatar?: string;
  findings_count?: number;
  resolved_count?: number;
}

export type FindingType = 'tone' | 'terminology' | 'claim' | 'fact' | 'visual' | 'accessibility' | 'messaging';
export type FindingSeverity = 'high' | 'medium' | 'low';
export type FindingDecision = 'pending' | 'accepted' | 'edited' | 'rejected';

export interface Finding {
  id: string;
  revision_id: string;
  type: FindingType;
  severity: FindingSeverity;
  span_start: number;
  span_end: number;
  excerpt: string;
  explanation: string;
  source_type: 'guideline' | 'fact' | 'term' | 'asset';
  source_id: string;
  source_quote: string;
  suggestion: string;
  decision: FindingDecision;
  decided_by?: string | null;
  decided_at?: string | null;
  edited_text?: string | null;
  detected_by: 'rules' | 'ai';
}

export interface Guideline {
  id: string;
  org_id: string;
  title: string;
  category: 'tone' | 'messaging' | 'visual' | 'accessibility' | 'legal';
  body: string;
  severity_default: FindingSeverity;
  version: string;
}

export interface Fact {
  id: string;
  org_id: string;
  statement: string;
  status: 'approved' | 'outdated';
  effective_from: string;
  source_note?: string | null;
  replaced_by?: string | null;
}

export interface Term {
  id: string;
  org_id: string;
  preferred: string;
  banned_variants: string; // JSON array of string
  reason: string;
  guideline_id: string;
}

export interface Asset {
  id: string;
  org_id: string;
  name: string;
  type: 'logo' | 'badge' | 'photography' | 'graphic' | 'guideline_chart';
  file_path: string;
  usage_rules: string;
  approved_colors: string; // JSON array of hex codes
}

export interface Comment {
  id: string;
  content_id: string;
  revision_id: string;
  finding_id?: string | null;
  user_id: string;
  body: string;
  created_at: string;
  user_name?: string;
  user_role?: Role;
  user_avatar?: string;
}

export interface Approval {
  id: string;
  content_id: string;
  revision_id: string;
  reviewer_id: string;
  decision: 'approved' | 'changes_requested';
  note?: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_role?: Role;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  aiLayerActive: boolean;
  aiModel: string;
  grounding: string;
  version: string;
  platform: string;
  team: string;
  db: {
    engine: string;
    connected: boolean;
    orgs: number;
    guidelines: number;
    facts: number;
    terms: number;
  };
  round2Improvements: Array<{
    id: string;
    title: string;
    status: string;
    description: string;
  }>;
}
