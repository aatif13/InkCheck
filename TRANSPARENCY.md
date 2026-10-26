# Transparency & AI Disclosure Report

**Application**: InkCheck — Brand Governance Platform  
**Team**: `aatifmulla1113`  
**Problem Set By**: `Inkloom AI`  

---

## 1. AI-Assisted Development Statement

In compliance with hackathon regulations, we declare that this application was designed and engineered using AI-assisted development tools (Google AI Studio Build and Gemini models) in collaboration with human engineers:
- **Mulla Mohammed Aatif**
- **Saheem Khan**
- **Khan Afzal**
- **Pachapuri Mustaqeem**

All core rules, mathematical contrast calculations, database schemas, and guard mechanisms were vetted and verified for correctness.

---

## 2. AI Models & External Services

| Service / Model | Role in Application | Data Transmitted | Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **Google Gemini 3.8 Flash** (`gemini-3.8-flash`) via `@google/genai` | Semantic enrichment of tone, intent-preserving rewrite suggestions, executive review summaries | Submitted draft text + top-k relevant retrieved library chunks | Graceful fallback to deterministic offline rules layer |
| **sql.js (WebAssembly SQLite)** | Zero-configuration relational database engine running in Node.js | Local disk file persistence (`./data/inkcheck.db`) | Local in-memory / file |
| **Google Fonts** (CDN) | Editorial typography (`Fraunces`, `Plus Jakarta Sans`, `JetBrains Mono`) | Standard stylesheet requests | System serif / sans-serif |

---

## 3. Libraries & Dependencies

- **Frontend**:
  - `react` 19 & `react-dom` 19: Core UI component model.
  - `react-router-dom`: Client-side single page routing.
  - `tailwindcss` 4 + `@tailwindcss/vite`: Utility styling and CSS variable token system.
  - `lucide-react`: Accessible domain iconography.
  - `recharts`: Visual data charts for the Insights dashboard.
- **Backend**:
  - `express`: REST API web framework.
  - `sql.js`: WebAssembly SQLite database engine.
  - `jsonwebtoken`: Cryptographic JWT signing and role verification.
  - `zod`: Schema validation and type inference for structured outputs.
  - `pdf-parse`: Local PDF text extraction.
  - `mammoth`: Local DOCX text extraction.
  - `multer`: Multi-part form-data handling for file uploads.
  - `dotenv`: Environment configuration.
- **Testing & Tooling**:
  - `vitest`: Unit test runner for rules engine and cite-or-discard guard.
  - `tsx`: TypeScript execution engine for `server.ts`.

---

## 4. Confidential Data Handling & Privacy Commitments

1. **No Silent Re-writes**: InkCheck suggests fixes as transparent proposals; human creators retain the decision to Accept, Edit, or Reject.
2. **Zero Auto-Publish**: Content cannot transition to published state without formal human review sign-off.
3. **No External Training**: Brand guidelines and draft copy are never sent to third parties for model training. Only temporary inference requests with retrieved chunks are made during analysis.
