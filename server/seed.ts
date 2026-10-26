import { getDb, saveDb, query, execute } from './db.js';

export async function initSchemaAndSeed(): Promise<void> {
  const db = await getDb();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL, -- 'creator' | 'manager' | 'reviewer'
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS guidelines (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'tone' | 'messaging' | 'visual' | 'accessibility' | 'legal'
      body TEXT NOT NULL,
      severity_default TEXT NOT NULL, -- 'high' | 'medium' | 'low'
      version TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS facts (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      statement TEXT NOT NULL,
      status TEXT NOT NULL, -- 'approved' | 'outdated'
      effective_from TEXT NOT NULL,
      source_note TEXT,
      replaced_by TEXT
    );

    CREATE TABLE IF NOT EXISTS terms (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      preferred TEXT NOT NULL,
      banned_variants TEXT NOT NULL, -- JSON array of strings
      reason TEXT NOT NULL,
      guideline_id TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'logo' | 'badge' | 'photography' | 'graphic' | 'guideline_chart'
      file_path TEXT NOT NULL,
      usage_rules TEXT NOT NULL,
      approved_colors TEXT NOT NULL -- JSON array of hex codes
    );

    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      format TEXT NOT NULL, -- 'text' | 'image' | 'document'
      status TEXT NOT NULL, -- 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published'
      created_by TEXT NOT NULL,
      current_revision_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      number INTEGER NOT NULL,
      body TEXT NOT NULL,
      file_path TEXT,
      score INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      revision_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'tone' | 'terminology' | 'claim' | 'fact' | 'visual' | 'accessibility' | 'messaging'
      severity TEXT NOT NULL, -- 'high' | 'medium' | 'low'
      span_start INTEGER NOT NULL,
      span_end INTEGER NOT NULL,
      excerpt TEXT NOT NULL,
      explanation TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'guideline' | 'fact' | 'term' | 'asset'
      source_id TEXT NOT NULL,
      source_quote TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      decision TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'edited' | 'rejected'
      decided_by TEXT,
      decided_at TEXT,
      edited_text TEXT,
      detected_by TEXT NOT NULL -- 'rules' | 'ai'
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      revision_id TEXT NOT NULL,
      finding_id TEXT,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      revision_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      decision TEXT NOT NULL, -- 'approved' | 'changes_requested'
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Check if seeded
  const existingOrg = await query('SELECT id FROM orgs LIMIT 1');
  if (existingOrg.length > 0) {
    saveDb();
    return;
  }

  console.log('Seeding initial Northwind Outdoors data into SQLite...');
  const orgId = 'org-northwind-01';

  // Org
  db.run(`INSERT INTO orgs (id, name, created_at) VALUES ('${orgId}', 'Northwind Outdoors', '2026-01-10T08:00:00Z');`);

  // Users
  const users = [
    { id: 'usr-maya-creator', name: 'Maya Lin', email: 'maya.lin@northwind.io', role: 'creator', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
    { id: 'usr-marcus-manager', name: 'Marcus Vance', email: 'marcus.vance@northwind.io', role: 'manager', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
    { id: 'usr-elena-reviewer', name: 'Elena Rostova', email: 'elena.rostova@northwind.io', role: 'reviewer', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' }
  ];
  for (const u of users) {
    db.run(`INSERT INTO users (id, org_id, name, email, role, avatar_url) VALUES ('${u.id}', '${orgId}', '${u.name}', '${u.email}', '${u.role}', '${u.avatar_url}');`);
  }

  // Guidelines (8 realistic guidelines)
  const guidelines = [
    {
      id: 'GD-01',
      title: 'Tone of Voice: Rugged, Honest, Practical',
      category: 'tone',
      body: 'Northwind speaks like a seasoned trail guide: grounded, concise, humble, and practical. Avoid synthetic hype, breathless buzzwords, and tech-bro jargon (e.g. "revolutionary", "game-changing", "insanely"). Keep exclamation marks strictly below 1 per 500 words. Sentences should average between 14 and 22 words.',
      severity_default: 'medium',
      version: '2.1'
    },
    {
      id: 'GD-02',
      title: 'Product Warranties and Repair Commitments',
      category: 'legal',
      body: 'Never advertise "lifetime unconditional replacement". In 2025 Northwind transitioned to the "5-Year Built-to-Endure Limited Warranty" with our Circular Repair Program. All warranty claims must specify covered categories (outerwear, packs, tents) and exclude commercial abuse.',
      severity_default: 'high',
      version: '3.0'
    },
    {
      id: 'GD-03',
      title: 'Sustainability & Environmental Substantiation',
      category: 'messaging',
      body: 'Zero tolerance for greenwashing. Never use unprovable terms like "100% eco-friendly", "zero-footprint", or "green miracle". State verifiable percentages and certified bodies: e.g. "82% post-consumer recycled polymer", "bluesign certified", and "Fair Labor Association verified".',
      severity_default: 'high',
      version: '2.4'
    },
    {
      id: 'GD-04',
      title: 'Substantiation of Comparative & Superlative Claims',
      category: 'legal',
      body: 'Absolute claims such as "best in the world", "#1 backpack", "guaranteed results", "unbreakable", or "100% waterproof" are illegal without audited third-party proof. Any superlative claim must cite the specific award or test method (e.g. "Outside Gear of the Year 2025").',
      severity_default: 'high',
      version: '2.0'
    },
    {
      id: 'GD-05',
      title: 'Brand Color Palette & Logo Usage Governance',
      category: 'visual',
      body: 'The Northwind palette is strictly anchored in: Ink Navy (#1D3557), Trail Amber (#E8A13A), Spruce Green (#2E8B6B), Glacial Low (#2F80A8), and Paper (#FDFDFB). Disallow neon cyan, magenta, or high-saturation purples. Primary wordmarks require minimum 24px clear space and 120px minimum rendering width.',
      severity_default: 'medium',
      version: '1.9'
    },
    {
      id: 'GD-06',
      title: 'Digital Accessibility Standards & Link Semantics',
      category: 'accessibility',
      body: 'All marketing imagery must have concise descriptive alt text explaining terrain, gear in use, and key subjects. Disallow vague link anchor text like "click here" or "read more" (use descriptive action links). Avoid full sentences in ALL-CAPS as screen readers spell them letter by letter.',
      severity_default: 'high',
      version: '2.2'
    },
    {
      id: 'GD-07',
      title: 'Product Trademarks & Nomenclature Consistency',
      category: 'messaging',
      body: 'Use exact registered trademarks: "StormShield Pro" (not Storm-Shield), "RipStop Nylon" (not tear-proof fabric), and "Northwind Outdoors" (never Northwind Inc. or Northwind Co.). Co-brand YKK zippers and Cordura fabrics with correct capitalization.',
      severity_default: 'medium',
      version: '1.5'
    },
    {
      id: 'GD-08',
      title: 'Reading Level and Content Scannability',
      category: 'accessibility',
      body: 'Customer guides and marketing copy must maintain a Flesch-Kincaid reading grade level between 7 and 10. Avoid overly academic compound sentence structures so outdoor enthusiasts can read specs comfortably on mobile devices on trailheads.',
      severity_default: 'low',
      version: '1.2'
    }
  ];
  for (const g of guidelines) {
    db.run(`INSERT INTO guidelines (id, org_id, title, category, body, severity_default, version) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [g.id, orgId, g.title, g.category, g.body, g.severity_default, g.version]);
  }

  // Approved Facts (~12 facts with outdated / approved relationships)
  const facts = [
    { id: 'FACT-01', statement: 'Northwind Outdoors was founded in 1994 in Bozeman, Montana.', status: 'approved', effective_from: '1994-06-01', source_note: 'Corporate Charter Article I', replaced_by: null },
    { id: 'FACT-02', statement: 'The World’s Absolute Best Outerwear', status: 'outdated', effective_from: '2012-01-01', source_note: 'Retired 2024 brand campaign', replaced_by: 'FACT-03' },
    { id: 'FACT-03', statement: 'Tested by Weather. Built for Generations.', status: 'approved', effective_from: '2024-03-01', source_note: 'Executive Brand Refresh 2024', replaced_by: null },
    { id: 'FACT-04', statement: 'Lifetime unconditional replacement on all items without questions.', status: 'outdated', effective_from: '2015-01-01', source_note: 'Deprecated policy document POL-089', replaced_by: 'FACT-05' },
    { id: 'FACT-05', statement: '5-Year Built-to-Endure Limited Warranty on jackets, packs, and shelters with lifetime repair support.', status: 'approved', effective_from: '2025-01-01', source_note: 'Legal Policy POL-2025-W1', replaced_by: null },
    { id: 'FACT-06', statement: '82% of all shell fabrics across the 2026 line are derived from certified post-consumer recycled polymer.', status: 'approved', effective_from: '2026-01-01', source_note: 'Supply Chain Audit Q4 2025', replaced_by: null },
    { id: 'FACT-07', statement: 'Voted #1 backpack brand on earth by adventure travelers.', status: 'outdated', effective_from: '2020-05-01', source_note: 'Unsubstantiated consumer poll', replaced_by: 'FACT-08' },
    { id: 'FACT-08', statement: 'Awarded Outside Magazine Gear of the Year 2025 for the Alpine Traverse 65L technical pack.', status: 'approved', effective_from: '2025-09-15', source_note: 'Outside Magazine Fall Buyer’s Guide 2025', replaced_by: null },
    { id: 'FACT-09', statement: 'StormShield Pro technical laminate achieves a certified 28,000mm hydrostatic head waterproof rating.', status: 'approved', effective_from: '2024-11-01', source_note: 'Empa Swiss Federal Materials Testing Lab Report #9812', replaced_by: null },
    { id: 'FACT-10', statement: 'Guaranteed warmth down to -50°F in any condition without thermal baselayer.', status: 'outdated', effective_from: '2018-01-01', source_note: 'Overly aggressive marketing claim', replaced_by: 'FACT-11' },
    { id: 'FACT-11', statement: 'Laboratory-certified comfort rating down to -25°F (-32°C) when paired with Northwind Alpine Midweight base layers.', status: 'approved', effective_from: '2025-08-01', source_note: 'ASTM F2732-21 Thermal Testing Certificate', replaced_by: null },
    { id: 'FACT-12', statement: 'All manufacturing facilities are audited and certified by the Fair Labor Association in Vietnam and Portugal.', status: 'approved', effective_from: '2023-01-01', source_note: 'FLA Compliance Registry 2025', replaced_by: null }
  ];
  for (const f of facts) {
    db.run(`INSERT INTO facts (id, org_id, statement, status, effective_from, source_note, replaced_by) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [f.id, orgId, f.statement, f.status, f.effective_from, f.source_note, f.replaced_by]);
  }

  // Terminology rules (~25 rules)
  const terms = [
    { id: 'TRM-01', preferred: 'weather-resistant', banned: ['100% waterproof', 'totally waterproof', 'waterproof-proof', 'completely water-tight'], reason: 'No fabric is 100% waterproof indefinitely; avoid legal liability under FTC truth-in-advertising.', guideline_id: 'GD-04' },
    { id: 'TRM-02', preferred: 'sustainable practices', banned: ['green miracle', 'eco-miracle', 'zero-footprint', 'earth-saving magic'], reason: 'Absolute green claims violate regulatory greenwashing guidelines.', guideline_id: 'GD-03' },
    { id: 'TRM-03', preferred: 'tested in extreme conditions', banned: ['indestructible', 'bulletproof', 'unbreakable', 'never tears'], reason: 'Physical gear experiences wear and tear; absolute durability claims create legal breach of warranty.', guideline_id: 'GD-04' },
    { id: 'TRM-04', preferred: 'Northwind Outdoors', banned: ['Northwind Inc.', 'Northwind Co.', 'Northwind Inc', 'Northwind LLC'], reason: 'Official consumer brand trade name is Northwind Outdoors.', guideline_id: 'GD-07' },
    { id: 'TRM-05', preferred: 'StormShield Pro', banned: ['Storm-Shield', 'StormShield+', 'StormShield Extreme', 'Storm Shield'], reason: 'Registered product line trademark must be formatted without spaces or hyphens.', guideline_id: 'GD-07' },
    { id: 'TRM-06', preferred: 'RipStop Nylon', banned: ['rip-stop', 'rip stop nylon', 'tear-proof fabric', 'ripstop-fabric'], reason: 'Proper capitalisation for Northwind technical textiles.', guideline_id: 'GD-07' },
    { id: 'TRM-07', preferred: 'customer care', banned: ['support desk', 'help desk', 'complaint dept', 'ticket queue'], reason: 'Maintains personal, hospitable brand relationship with outdoor community.', guideline_id: 'GD-01' },
    { id: 'TRM-08', preferred: 'trail-tested', banned: ['fool-proof', 'fail-safe', 'risk-free', 'zero-risk'], reason: 'Outdoor activities inherently involve calculated mountain risk; avoid promising zero risk.', guideline_id: 'GD-04' },
    { id: 'TRM-09', preferred: 'recycled down insulation', banned: ['bird down', 'pure duck fur', 'animal feathering', 'feather fill'], reason: 'Accurate technical and ethical animal welfare terminology.', guideline_id: 'GD-03' },
    { id: 'TRM-10', preferred: 'crafted for longevity', banned: ['cheaply made', 'budget-friendly', 'dirt-cheap', 'economy spec'], reason: 'Protects premium heritage positioning.', guideline_id: 'GD-01' },
    { id: 'TRM-11', preferred: 'purpose-built gear', banned: ['insanely good', 'revolutionary tech', 'game-changing innovation', 'epic stuff'], reason: 'Excessive tech hype dilutes authentic trail credibility.', guideline_id: 'GD-01' },
    { id: 'TRM-12', preferred: 'pack weight', banned: ['heft', 'carry burden', 'luggage weight'], reason: 'Standard outdoor scannability metric in product specification grids.', guideline_id: 'GD-08' },
    { id: 'TRM-13', preferred: 'durable water repellent (DWR)', banned: ['chemical spray', 'water magic', 'nano-coating miracle'], reason: 'Use accurate industry standard chemistry nomenclature.', guideline_id: 'GD-07' },
    { id: 'TRM-14', preferred: 'ergonomic harness', banned: ['back strap', 'carry rig', 'shoulder belts'], reason: 'Technical equipment specification standards.', guideline_id: 'GD-07' },
    { id: 'TRM-15', preferred: 'bivy shelter', banned: ['mini tent', 'sleeping sack', 'emergency bag'], reason: 'Precise alpine shelter taxonomy.', guideline_id: 'GD-07' },
    { id: 'TRM-16', preferred: 'merino wool', banned: ['scratchy wool', 'sheep fur', 'natural fleece pure'], reason: 'Standard textile fiber classification.', guideline_id: 'GD-07' },
    { id: 'TRM-17', preferred: 'hydration sleeve', banned: ['water pouch hole', 'bladder pocket', 'drinking sack'], reason: 'Component catalog naming convention.', guideline_id: 'GD-07' },
    { id: 'TRM-18', preferred: 'cinch cord', banned: ['pull string', 'tightening rope', 'nylon tie'], reason: 'Component standard specification.', guideline_id: 'GD-07' },
    { id: 'TRM-19', preferred: 'windproof membrane', banned: ['gale-proof shield', 'zero-wind barrier', 'tornado proof'], reason: 'Atmospheric physical accuracy.', guideline_id: 'GD-04' },
    { id: 'TRM-20', preferred: 'YKK zippers', banned: ['metal zips', 'generic sliders', 'ykk-zips'], reason: 'Co-branding contract requirement with YKK Corporation.', guideline_id: 'GD-07' },
    { id: 'TRM-21', preferred: 'quick-dry', banned: ['instant dry', 'zero-moisture magic', 'flash evaporate'], reason: 'Substantiated fabric performance claims.', guideline_id: 'GD-04' },
    { id: 'TRM-22', preferred: 'packable', banned: ['fold-tiny', 'pocket-size impossible'], reason: 'Factual storage specifications.', guideline_id: 'GD-01' },
    { id: 'TRM-23', preferred: 'breathable membrane', banned: ['sweat-free tech', '100% moisture vapor proof'], reason: 'Physical membrane vapor permeability standards.', guideline_id: 'GD-04' },
    { id: 'TRM-24', preferred: 'reflective accents', banned: ['glow-in-the-dark strips', 'laser-bright strips'], reason: 'Reflective safety terminology standards.', guideline_id: 'GD-06' },
    { id: 'TRM-25', preferred: 'bluesign certified', banned: ['eco-approved by all', '100% nature pure'], reason: 'Official certification mark standards.', guideline_id: 'GD-03' }
  ];
  for (const t of terms) {
    db.run(`INSERT INTO terms (id, org_id, preferred, banned_variants, reason, guideline_id) VALUES (?, ?, ?, ?, ?, ?);`,
      [t.id, orgId, t.preferred, JSON.stringify(t.banned), t.reason, t.guideline_id]);
  }

  // Assets (~6 assets)
  const assets = [
    { id: 'AST-01', name: 'Northwind Primary Wordmark', type: 'logo', file_path: '/assets/northwind-primary.svg', usage_rules: 'Minimum width 120px on web, 24px clear space around all borders. Must only be placed on Paper (#FDFDFB) or Ink Navy (#1D3557).', approved_colors: JSON.stringify(['#1D3557', '#FDFDFB']) },
    { id: 'AST-02', name: 'Northwind Mountain Crest Badge', type: 'badge', file_path: '/assets/northwind-crest.svg', usage_rules: 'Used for secondary branding, apparel patch embroidery, and social avatars. Minimum rendering 48px.', approved_colors: JSON.stringify(['#E8A13A', '#1D3557']) },
    { id: 'AST-03', name: 'StormShield Pro Certification Mark', type: 'certification', file_path: '/assets/stormshield-seal.svg', usage_rules: 'Only display on garments with verified 20,000mm+ rating. Do not alter aspect ratio.', approved_colors: JSON.stringify(['#2F80A8', '#1D3557']) },
    { id: 'AST-04', name: 'Alpine Horizon Brand Photography', type: 'photography', file_path: '/assets/alpine-hero.jpg', usage_rules: 'Hero banners and catalog cover spreads only. Contrast overlay required when overlaid with text.', approved_colors: JSON.stringify(['#1D3557', '#2F80A8', '#E8A13A']) },
    { id: 'AST-05', name: 'Spruce Sustainability Glyph', type: 'graphic', file_path: '/assets/green-accent.svg', usage_rules: 'Use exclusively adjacent to verified recycled material and bluesign statements.', approved_colors: JSON.stringify(['#2E8B6B']) },
    { id: 'AST-06', name: 'Approved Color Palette Reference Card', type: 'guideline_chart', file_path: '/assets/palette-card.svg', usage_rules: 'Color specification master: Ink Navy #1D3557, Trail Amber #E8A13A, Spruce Green #2E8B6B, Glacial Blue #2F80A8, Paper #FDFDFB, Slate #1F2733.', approved_colors: JSON.stringify(['#1D3557', '#E8A13A', '#2E8B6B', '#2F80A8', '#FDFDFB', '#1F2733']) }
  ];
  for (const a of assets) {
    db.run(`INSERT INTO assets (id, org_id, name, type, file_path, usage_rules, approved_colors) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [a.id, orgId, a.name, a.type, a.file_path, a.usage_rules, a.approved_colors]);
  }

  // 5 Sample Content Pieces in different workflow states
  const sampleContents = [
    {
      id: 'CNT-01',
      title: 'Alpine Summit Series Launch Announcement',
      format: 'text',
      status: 'in_review',
      created_by: 'usr-maya-creator',
      created_at: '2026-10-24T10:30:00Z',
      updated_at: '2026-10-25T08:15:00Z',
      rev_id: 'REV-01',
      rev_num: 1,
      score: 72,
      body: `Introducing the revolutionary Alpine Summit Series from Northwind Inc. Engineered with our 100% waterproof Storm-Shield shell, this is genuinely the best in the world alpine gear ever devised. We offer a lifetime unconditional replacement on all items without questions! Click here to view the collection. Guaranteed warmth down to -50°F in any condition.`
    },
    {
      id: 'CNT-02',
      title: 'Winter Expedition Jacket Product Description',
      format: 'text',
      status: 'changes_requested',
      created_by: 'usr-maya-creator',
      created_at: '2026-10-23T14:00:00Z',
      updated_at: '2026-10-24T16:20:00Z',
      rev_id: 'REV-02',
      rev_num: 2,
      score: 65,
      body: `The Northwind Expedition Jacket is built with indestructible RipStop Nylon and insulated with feather fill. Built with eco-miracle materials for a zero-footprint future. It is tested in extreme conditions and voted #1 backpack brand on earth by adventure travelers. Guaranteed results on every steep winter peak!`
    },
    {
      id: 'CNT-03',
      title: 'Spring Trail Guide & Sustainability Pledge',
      format: 'document',
      status: 'approved',
      created_by: 'usr-maya-creator',
      created_at: '2026-10-21T09:15:00Z',
      updated_at: '2026-10-23T11:45:00Z',
      rev_id: 'REV-03',
      rev_num: 3,
      score: 96,
      body: `Tested by Weather. Built for Generations. At Northwind Outdoors, 82% of all shell fabrics across the 2026 line are derived from certified post-consumer recycled polymer. Backed by our 5-Year Built-to-Endure Limited Warranty on jackets, packs, and shelters with lifetime repair support.`
    },
    {
      id: 'CNT-04',
      title: 'Traverse Pack Instagram Campaign Copy',
      format: 'text',
      status: 'draft',
      created_by: 'usr-maya-creator',
      created_at: '2026-10-25T07:45:00Z',
      updated_at: '2026-10-25T07:45:00Z',
      rev_id: 'REV-04',
      rev_num: 1,
      score: 54,
      body: `MEET THE MOST EPIC PACK EVER MADE! Northwind Co. brings you bulletproof durability that never tears. This gear is insanely good and guaranteed to last forever! CLICK HERE TO PREORDER NOW!`
    },
    {
      id: 'CNT-05',
      title: 'Northwind Brand Standards & Retail Partner FAQ',
      format: 'document',
      status: 'published',
      created_by: 'usr-marcus-manager',
      created_at: '2026-10-15T08:00:00Z',
      updated_at: '2026-10-20T17:00:00Z',
      rev_id: 'REV-05',
      rev_num: 2,
      score: 98,
      body: `Official Retail Partner FAQ. Northwind Outdoors was founded in 1994 in Bozeman, Montana. Our official motto is "Tested by Weather. Built for Generations." All manufacturing facilities are audited and certified by the Fair Labor Association in Vietnam and Portugal.`
    }
  ];

  for (const c of sampleContents) {
    db.run(`INSERT INTO content (id, org_id, title, format, status, created_by, current_revision_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [c.id, orgId, c.title, c.format, c.status, c.created_by, c.rev_id, c.created_at, c.updated_at]);

    db.run(`INSERT INTO revisions (id, content_id, number, body, score, created_by, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [c.rev_id, c.id, c.rev_num, c.body, c.score, c.created_by, c.created_at, 'Initial draft check']);
  }

  // Pre-seed realistic findings for CNT-01 (Alpine Summit Series Launch Announcement)
  const cnt1Findings = [
    {
      id: 'FND-01',
      revision_id: 'REV-01',
      type: 'terminology',
      severity: 'medium',
      span_start: 57,
      span_end: 71,
      excerpt: 'Northwind Inc.',
      explanation: 'Use official consumer brand name "Northwind Outdoors" instead of corporate or obsolete legal entity variants.',
      source_type: 'term',
      source_id: 'TRM-04',
      source_quote: 'Official consumer brand trade name is Northwind Outdoors.',
      suggestion: 'Northwind Outdoors',
      decision: 'pending',
      detected_by: 'rules'
    },
    {
      id: 'FND-02',
      revision_id: 'REV-01',
      type: 'terminology',
      severity: 'high',
      span_start: 93,
      span_end: 107,
      excerpt: '100% waterproof',
      explanation: 'No textile can promise 100% waterproof performance permanently. Use approved terminology "weather-resistant" or cite precise hydrostatic head ratings.',
      source_type: 'term',
      source_id: 'TRM-01',
      source_quote: 'No fabric is 100% waterproof indefinitely; avoid legal liability under FTC truth-in-advertising.',
      suggestion: 'weather-resistant',
      decision: 'accepted',
      decided_by: 'usr-maya-creator',
      decided_at: '2026-10-24T11:00:00Z',
      detected_by: 'rules'
    },
    {
      id: 'FND-03',
      revision_id: 'REV-01',
      type: 'terminology',
      severity: 'medium',
      span_start: 108,
      span_end: 120,
      excerpt: 'Storm-Shield',
      explanation: 'Registered product line trademark must be spelled "StormShield Pro" without a hyphen.',
      source_type: 'term',
      source_id: 'TRM-05',
      source_quote: 'Registered product line trademark must be formatted without spaces or hyphens.',
      suggestion: 'StormShield Pro',
      decision: 'pending',
      detected_by: 'rules'
    },
    {
      id: 'FND-04',
      revision_id: 'REV-01',
      type: 'claim',
      severity: 'high',
      span_start: 147,
      span_end: 164,
      excerpt: 'best in the world',
      explanation: 'Unsupported superlative claim. Superlatives require audited independent award proof (e.g. Outside Gear of the Year 2025).',
      source_type: 'guideline',
      source_id: 'GD-04',
      source_quote: 'Absolute claims such as "best in the world" are illegal without audited third-party proof.',
      suggestion: 'award-winning',
      decision: 'pending',
      detected_by: 'rules'
    },
    {
      id: 'FND-05',
      revision_id: 'REV-01',
      type: 'fact',
      severity: 'high',
      span_start: 206,
      span_end: 279,
      excerpt: 'lifetime unconditional replacement on all items without questions',
      explanation: 'This statement cites an outdated warranty policy retired in 2024. Northwind now provides a 5-Year Built-to-Endure Limited Warranty.',
      source_type: 'fact',
      source_id: 'FACT-04',
      source_quote: 'Deprecated policy document POL-089. Replaced by: 5-Year Built-to-Endure Limited Warranty on jackets, packs, and shelters with lifetime repair support.',
      suggestion: '5-Year Built-to-Endure Limited Warranty on jackets, packs, and shelters with lifetime repair support',
      decision: 'pending',
      detected_by: 'rules'
    },
    {
      id: 'FND-06',
      revision_id: 'REV-01',
      type: 'accessibility',
      severity: 'medium',
      span_start: 281,
      span_end: 291,
      excerpt: 'Click here',
      explanation: 'Vague link anchor text harms screen reader navigation and SEO. Use descriptive action verbs naming destination.',
      source_type: 'guideline',
      source_id: 'GD-06',
      source_quote: 'Disallow vague link anchor text like "click here" or "read more" (use descriptive action links).',
      suggestion: 'Explore the Alpine Summit Collection',
      decision: 'edited',
      decided_by: 'usr-maya-creator',
      decided_at: '2026-10-24T11:05:00Z',
      edited_text: 'Explore the Alpine Summit Collection',
      detected_by: 'rules'
    },
    {
      id: 'FND-07',
      revision_id: 'REV-01',
      type: 'fact',
      severity: 'high',
      span_start: 317,
      span_end: 375,
      excerpt: 'Guaranteed warmth down to -50°F in any condition',
      explanation: 'Outdated marketing statement. Lab certification specifies comfort down to -25°F when layered with Alpine Midweight.',
      source_type: 'fact',
      source_id: 'FACT-10',
      source_quote: 'Overly aggressive marketing claim. Replaced by: Laboratory-certified comfort rating down to -25°F (-32°C) when paired with Northwind Alpine Midweight base layers.',
      suggestion: 'Laboratory-certified comfort rating down to -25°F (-32°C) when paired with Northwind Alpine Midweight base layers',
      decision: 'pending',
      detected_by: 'rules'
    },
    {
      id: 'FND-08',
      revision_id: 'REV-01',
      type: 'tone',
      severity: 'low',
      span_start: 16,
      span_end: 29,
      excerpt: 'revolutionary',
      explanation: 'Hype adjective violates Northwind’s humble, grounded trail guide voice.',
      source_type: 'guideline',
      source_id: 'GD-01',
      source_quote: 'Avoid synthetic hype, breathless buzzwords, and tech-bro jargon (e.g. "revolutionary", "game-changing").',
      suggestion: 'technical',
      decision: 'pending',
      detected_by: 'rules'
    }
  ];

  for (const f of cnt1Findings) {
    db.run(`INSERT INTO findings (id, revision_id, type, severity, span_start, span_end, excerpt, explanation, source_type, source_id, source_quote, suggestion, decision, decided_by, decided_at, edited_text, detected_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [f.id, f.revision_id, f.type, f.severity, f.span_start, f.span_end, f.excerpt, f.explanation, f.source_type, f.source_id, f.source_quote, f.suggestion, f.decision, f.decided_by || null, f.decided_at || null, f.edited_text || null, f.detected_by]);
  }

  // Pre-seed comments
  const comments = [
    {
      id: 'CMT-01',
      content_id: 'CNT-01',
      revision_id: 'REV-01',
      finding_id: 'FND-05',
      user_id: 'usr-elena-reviewer',
      body: 'Maya, please make sure we replace the lifetime warranty with the 2025 5-Year policy before final sign-off. Legal flagged this in our last audit.',
      created_at: '2026-10-24T12:00:00Z'
    },
    {
      id: 'CMT-02',
      content_id: 'CNT-01',
      revision_id: 'REV-01',
      finding_id: 'FND-04',
      user_id: 'usr-maya-creator',
      body: 'Agreed, I will cite the Outside Magazine award instead of "best in the world".',
      created_at: '2026-10-24T12:30:00Z'
    },
    {
      id: 'CMT-03',
      content_id: 'CNT-02',
      revision_id: 'REV-02',
      finding_id: null,
      user_id: 'usr-elena-reviewer',
      body: 'Changes requested: The copy still contains "indestructible" and "zero-footprint" which our legal guideline GD-03 expressly forbids.',
      created_at: '2026-10-24T16:20:00Z'
    }
  ];
  for (const cm of comments) {
    db.run(`INSERT INTO comments (id, content_id, revision_id, finding_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [cm.id, cm.content_id, cm.revision_id, cm.finding_id, cm.user_id, cm.body, cm.created_at]);
  }

  // Approvals & Audit logs
  db.run(`INSERT INTO approvals (id, content_id, revision_id, reviewer_id, decision, note, created_at) VALUES
    ('APP-01', 'CNT-03', 'REV-03', 'usr-elena-reviewer', 'approved', 'Perfect alignment with circular warranty and sustainability guidelines. Approved for digital and catalog print.', '2026-10-23T11:45:00Z'),
    ('APP-02', 'CNT-02', 'REV-02', 'usr-elena-reviewer', 'changes_requested', 'Please fix the unsubstantiated warranty and temperature claims.', '2026-10-24T16:20:00Z');
  `);

  const auditLogs = [
    { id: 'LOG-01', user_id: 'usr-maya-creator', action: 'content.create', target: 'CNT-01', details: 'Created draft "Alpine Summit Series Launch Announcement"', created_at: '2026-10-24T10:30:00Z' },
    { id: 'LOG-02', user_id: 'usr-maya-creator', action: 'analysis.run', target: 'REV-01', details: 'InkCheck engine detected 8 findings (Score: 72)', created_at: '2026-10-24T10:31:00Z' },
    { id: 'LOG-03', user_id: 'usr-maya-creator', action: 'finding.accept', target: 'FND-02', details: 'Accepted fix for 100% waterproof -> weather-resistant', created_at: '2026-10-24T11:00:00Z' },
    { id: 'LOG-04', user_id: 'usr-maya-creator', action: 'content.submit', target: 'CNT-01', details: 'Submitted revision 1 for reviewer sign-off', created_at: '2026-10-24T11:10:00Z' },
    { id: 'LOG-05', user_id: 'usr-elena-reviewer', action: 'review.changes_requested', target: 'CNT-02', details: 'Requested changes on Winter Expedition Jacket description', created_at: '2026-10-24T16:20:00Z' },
    { id: 'LOG-06', user_id: 'usr-elena-reviewer', action: 'review.approved', target: 'CNT-03', details: 'Approved Spring Trail Guide & Sustainability Pledge (Score: 96)', created_at: '2026-10-23T11:45:00Z' }
  ];
  for (const l of auditLogs) {
    db.run(`INSERT INTO audit_log (id, org_id, user_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [l.id, orgId, l.user_id, l.action, l.target, l.details, l.created_at]);
  }

  // Pre-seed some feedback
  db.run(`INSERT INTO feedbacks (id, user_id, rating, comment, category, created_at) VALUES
    ('FB-01', 'usr-maya-creator', 5, 'The inline highlight sync and source citation makes clearing legal reviews twice as fast!', 'ux', '2026-10-23T15:00:00Z'),
    ('FB-02', 'usr-elena-reviewer', 5, 'Review queue with diff view and approval lock keeps our brand voice strictly protected.', 'governance', '2026-10-24T14:30:00Z');
  `);

  saveDb();
  console.log('Database schema and Northwind Outdoors seed data successfully populated.');
}
