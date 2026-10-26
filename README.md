# InkCheck — Brand Governance & Human-in-the-Loop Proofreading Desk

> **Team**: `aatifmulla1113`  
> **Problem Brief**: Formulated by `Inkloom AI`  
> **Team Contributors**: Mulla Mohammed Aatif, Saheem Khan, Khan Afzal, Pachapuri Mustaqeem  
> **Evaluation Mode**: Zero-friction judge access (instant demo login, no walkthrough, no signup, no API key required).

---

## 1. What It Does

InkCheck sits directly between content creation and publication. Organizations maintain their brand guidelines, approved facts, terminology standards, and visual assets in a centralized **Brand Library**.

When creators draft content (marketing copy, product descriptions, or uploaded documents/images), InkCheck checks the draft against approved sources and returns explainable findings—**never a silent rewrite**. Every finding cites its exact source record, provides a plain-language explanation, and offers an intent-preserving fix as an interactive diff proposal.

Humans retain 100% control: authors accept, edit, or reject each proposal. Once resolved, the content is submitted to a reviewer sign-off queue, certified with an official governance stamp, and tracked over time on an Insights analytics dashboard.

---

## 2. Architecture Diagram

```
                             ┌───────────────────────────────────────┐
                             │       User Browser / Client SPA       │
                             │   (React 19 + Tailwind CSS + Vite)    │
                             └──────────────────┬────────────────────┘
                                                │ REST API (JWT RBAC)
                                                ▼
                             ┌───────────────────────────────────────┐
                             │         Express Node.js Server        │
                             │       (TypeScript · server.ts)        │
                             └──────┬─────────────────────────┬──────┘
                                    │                         │
            ┌───────────────────────┴──────────┐   ┌──────────┴───────────────────────┐
            │       Hybrid Detection Engine    │   │      SQLite Relational Store     │
            │                                  │   │     (sql.js file persistence)    │
            │  1. Deterministic Rules Layer    │   │                                  │
            │     - 25+ Terminology variants   │   │  - orgs, users, guidelines       │
            │     - Outdated Fact Replacements │   │  - facts, terms, assets          │
            │     - Superlative Claim Matcher  │   │  - content, revisions, findings  │
            │     - WCAG Contrast (RGB Lumin.) │   │  - comments, approvals           │
            │     - Flesch-Kincaid Readability │   │  - audit_log, feedbacks          │
            │                                  │   └──────────────────────────────────┘
            │  2. AI Semantic Enrichment Layer │
            │     (Active if GEMINI_API_KEY set│
            │     - Offline TF-IDF Retriever   │
            │     - Gemini 3.8 Flash SDK       │
            │     - STRICT CITE-OR-DISCARD     │
            │       GUARD (0% hallucinations)  │
            └──────────────────────────────────┘
```

---

## 3. Main Technical Decisions & Rationale

1. **Hybrid Rules + AI Detection Architecture**:
   - *Why*: Brand governance cannot tolerate non-deterministic hallucinations or service downtime. The deterministic rules layer runs 100% offline, guaranteeing that critical terminology, legal claims, outdated facts, and accessibility errors are detected reliably without an external API key.
   - *When AI runs*: When `GEMINI_API_KEY` is present, Gemini 3.8 Flash provides semantic nuance and intent-preserving rewrites.
2. **Strict Cite-or-Discard Guard**:
   - *Why*: Every candidate finding returned by the LLM must cite an authentic library record ID (e.g. `GD-04`, `FACT-05`, `TRM-01`) and its text excerpt must exist verbatim in the draft. If any record ID is ungrounded or excerpt is fabricated, it is discarded immediately.
3. **Zero-Friction Evaluation & RBAC**:
   - *Why*: Hackathon judges need to test Creator, Brand Manager, and Reviewer experiences in seconds without signing up or verifying emails. The top bar contains an instant role switcher that mints real JWTs underneath with role middleware enforcement.
4. **Single-Process Full-Stack Vite + Express**:
   - *Why*: Eliminates CORS issues, simplifies container deployment to a single `PORT=3000`, and ensures instant startup.

---

## 4. What's New in Round 2

We implemented the three core improvements committed in Round 1:

1. **[IMPROVEMENT 1] Hybrid Detection Engine with Deterministic Grounding & Discard Guard**:
   Enforces 100% source attribution against real Library records, rejecting ungrounded or fabricated findings.
2. **[IMPROVEMENT 2] Rich Interactive Proofreading Desk with Dual-Pane Highlights & Intent-Preserving Fixes**:
   Inline color-coded highlights synchronized with finding cards, offering 1-click **Accept**, **Edit** (custom wording), or **Reject** proposals.
3. **[IMPROVEMENT 3] Comprehensive Brand Asset & Visual Contrast / Palette Governance**:
   Image color extraction, delta distance thresholding against the Northwind palette, and mathematical WCAG 2.1 contrast ratio verification.

---

## 5. Seed Data Description

The application seeds a realistic knowledge base for fictional outdoor brand **"Northwind Outdoors"**:
- **8 Brand Guidelines**: Tone (`GD-01`), Warranties (`GD-02`), Sustainability (`GD-03`), Superlatives & Substantiation (`GD-04`), Visual Palette (`GD-05`), Accessibility (`GD-06`), Trademarks (`GD-07`), Readability Grade (`GD-08`).
- **12 Approved Facts**: Company history, updated 5-Year Circular Warranty (`FACT-05` replacing outdated `FACT-04`), official tagline (`FACT-03` replacing outdated `FACT-02`), Outside Magazine Gear of the Year 2025 (`FACT-08`), StormShield 28,000mm rating (`FACT-09`).
- **25 Terminology Rules**: Preferred vs prohibited variants (e.g. "weather-resistant" vs "100% waterproof", "Northwind Outdoors" vs "Northwind Inc.", "StormShield Pro" vs "Storm-Shield").
- **6 Brand Assets**: Wordmark, Crest Badge, StormShield Seal, Photography, Color Reference Card.
- **5 Sample Content Pieces**: Covering all workflow states (`draft`, `in_review`, `changes_requested`, `approved`, `published`).

---

## 6. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (Vitest)
npm test

# 3. Start development server
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 7. Environment Variables

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Web server listening port | No | `3000` |
| `GEMINI_API_KEY` | Gemini API key for AI semantic enrichment | No | Optional (runs offline in rules-only mode if omitted) |
| `JWT_SECRET` | Secret key for JWT signing | No | `inkcheck-dev-secret-key-aatifmulla1113` |
| `DATABASE_FILE` | Local SQLite database file path | No | `./data/inkcheck.db` |

---

## 8. REST API Reference

- `POST /api/auth/demo-login` — `{ role: 'creator' | 'manager' | 'reviewer' }` -> instant JWT token + user.
- `GET /api/auth/me` — Current authenticated user profile.
- `GET/POST/PUT/DELETE /api/library/guidelines` — Guidelines management (Manager-only mutations).
- `GET/POST/PUT/DELETE /api/library/facts` — Approved facts management.
- `GET/POST/PUT/DELETE /api/library/terms` — Terminology rules management.
- `GET/POST/PUT/DELETE /api/library/assets` — Brand assets management.
- `POST /api/library/import` — Auto-splits text/document into guideline records.
- `GET/POST /api/content` — Content listing and new draft submission.
- `POST /api/content/revisions/:id/analyze` — Runs hybrid check on revision.
- `PATCH /api/content/findings/:id` — Accept, Edit, or Reject a proposal fix.
- `POST /api/content/:id/revisions` — Creates new revision with working draft body.
- `POST /api/content/:id/submit` — Submits draft for reviewer sign-off.
- `POST /api/content/:id/approvals` — Reviewer approves or requests changes with note.
- `POST /api/content/:id/comments` — Threaded comments on content or specific findings.
- `GET /api/content/:id/history` — Revisions timeline and diff data.
- `GET /api/insights` — Governance analytics and friction metrics.
- `POST/GET /api/feedback` — User-testing feedback widget endpoint.
- `GET /api/health` — System status, AI layer availability, and Round 2 improvements check.
