import {
  ContentItem,
  Finding,
  Guideline,
  Fact,
  Term,
  Asset,
  Comment,
  Approval,
  SystemHealth,
  Role,
  User,
  Revision
} from '../types';

const TOKEN_KEY = 'inkcheck_jwt_token';
const ROLE_KEY = 'inkcheck_current_role';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredRole(): Role {
  return (localStorage.getItem(ROLE_KEY) as Role) || 'creator';
}

export function setStoredRole(role: Role): void {
  localStorage.setItem(ROLE_KEY, role);
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  const role = getStoredRole();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  headers['x-demo-role'] = role;

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async demoLogin(role: Role): Promise<{ token: string; user: User }> {
    const data = await fetchWithAuth('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
    setStoredToken(data.token);
    setStoredRole(role);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return fetchWithAuth('/api/auth/me');
  },

  // Health
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Library
  async getGuidelines(): Promise<Guideline[]> {
    const data = await fetchWithAuth('/api/library/guidelines');
    return data.guidelines;
  },
  async createGuideline(g: Partial<Guideline>): Promise<Guideline> {
    const data = await fetchWithAuth('/api/library/guidelines', {
      method: 'POST',
      body: JSON.stringify(g)
    });
    return data.guideline;
  },
  async updateGuideline(id: string, g: Partial<Guideline>): Promise<Guideline> {
    const data = await fetchWithAuth(`/api/library/guidelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(g)
    });
    return data.guideline;
  },
  async deleteGuideline(id: string): Promise<void> {
    await fetchWithAuth(`/api/library/guidelines/${id}`, { method: 'DELETE' });
  },

  async getFacts(): Promise<Fact[]> {
    const data = await fetchWithAuth('/api/library/facts');
    return data.facts;
  },
  async createFact(f: Partial<Fact>): Promise<Fact> {
    const data = await fetchWithAuth('/api/library/facts', {
      method: 'POST',
      body: JSON.stringify(f)
    });
    return data.fact;
  },
  async updateFact(id: string, f: Partial<Fact>): Promise<Fact> {
    const data = await fetchWithAuth(`/api/library/facts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(f)
    });
    return data.fact;
  },
  async deleteFact(id: string): Promise<void> {
    await fetchWithAuth(`/api/library/facts/${id}`, { method: 'DELETE' });
  },

  async getTerms(): Promise<Term[]> {
    const data = await fetchWithAuth('/api/library/terms');
    return data.terms;
  },
  async createTerm(t: Partial<Term>): Promise<Term> {
    const data = await fetchWithAuth('/api/library/terms', {
      method: 'POST',
      body: JSON.stringify(t)
    });
    return data.term;
  },
  async updateTerm(id: string, t: Partial<Term>): Promise<Term> {
    const data = await fetchWithAuth(`/api/library/terms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(t)
    });
    return data.term;
  },
  async deleteTerm(id: string): Promise<void> {
    await fetchWithAuth(`/api/library/terms/${id}`, { method: 'DELETE' });
  },

  async getAssets(): Promise<Asset[]> {
    const data = await fetchWithAuth('/api/library/assets');
    return data.assets;
  },
  async createAsset(a: Partial<Asset>): Promise<Asset> {
    const data = await fetchWithAuth('/api/library/assets', {
      method: 'POST',
      body: JSON.stringify(a)
    });
    return data.asset;
  },
  async updateAsset(id: string, a: Partial<Asset>): Promise<Asset> {
    const data = await fetchWithAuth(`/api/library/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(a)
    });
    return data.asset;
  },
  async deleteAsset(id: string): Promise<void> {
    await fetchWithAuth(`/api/library/assets/${id}`, { method: 'DELETE' });
  },

  async importGuidelines(text: string): Promise<{ importedCount: number; guidelines: Guideline[] }> {
    return fetchWithAuth('/api/library/import', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  // Content
  async getContentList(params?: { status?: string; format?: string }): Promise<ContentItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.format) query.set('format', params.format);
    const data = await fetchWithAuth(`/api/content?${query.toString()}`);
    return data.content;
  },

  async getContent(id: string): Promise<{
    content: ContentItem;
    findings: Finding[];
    comments: Comment[];
    approvals: Approval[];
  }> {
    return fetchWithAuth(`/api/content/${id}`);
  },

  async createContent(payload: {
    title: string;
    format: string;
    body: string;
    file_path?: string;
    run_check?: boolean;
    image_alt?: string;
    uploaded_colors?: string[];
  }): Promise<{ content: ContentItem; revision_id: string; findings: Finding[]; score: number; summary: string; aiActive: boolean }> {
    return fetchWithAuth('/api/content', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async analyzeRevision(revisionId: string, metadata?: { image_alt?: string; uploaded_colors?: string[] }): Promise<{
    findings: Finding[];
    score: number;
    summary: string;
    aiActive: boolean;
    modelUsed: string;
  }> {
    return fetchWithAuth(`/api/content/revisions/${revisionId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(metadata || {})
    });
  },

  async updateFindingDecision(findingId: string, payload: {
    decision: 'pending' | 'accepted' | 'edited' | 'rejected';
    edited_text?: string;
  }): Promise<{ finding: Finding; newScore: number }> {
    return fetchWithAuth(`/api/content/findings/${findingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async createRevision(contentId: string, payload: {
    body: string;
    note?: string;
    file_path?: string;
  }): Promise<{ revision: Revision; findings: Finding[]; score: number }> {
    return fetchWithAuth(`/api/content/${contentId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async submitContent(contentId: string, overrideReason?: string): Promise<{ success: boolean; status: string }> {
    return fetchWithAuth(`/api/content/${contentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ overrideReason })
    });
  },

  async submitApproval(contentId: string, payload: {
    decision: 'approved' | 'changes_requested';
    note?: string;
  }): Promise<{ success: boolean; status: string; approval: Approval }> {
    return fetchWithAuth(`/api/content/${contentId}/approvals`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async addComment(contentId: string, payload: {
    body: string;
    finding_id?: string | null;
    revision_id?: string;
  }): Promise<{ comment: Comment }> {
    return fetchWithAuth(`/api/content/${contentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getHistory(contentId: string): Promise<{ revisions: Revision[] }> {
    return fetchWithAuth(`/api/content/${contentId}/history`);
  },

  // Insights
  async getInsights(): Promise<any> {
    return fetchWithAuth('/api/insights');
  },

  // Feedback
  async submitFeedback(payload: { rating: number; comment: string; category?: string }): Promise<{ success: boolean; id: string }> {
    return fetchWithAuth('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getFeedbacks(): Promise<{ feedbacks: any[] }> {
    return fetchWithAuth('/api/feedback');
  },

  // Upload
  async uploadFile(file: File): Promise<{
    filename: string;
    originalName: string;
    filePath: string;
    format: 'text' | 'document' | 'image';
    extractedText: string;
    sampledColors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'File upload failed');
    }

    return res.json();
  }
};
