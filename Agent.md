# GRANTLY — Complete Product & Implementation Specification

**Version:** 1.0 · **Date:** 2026-11-07 · **Status:** Locked implementation brief for Codex  
**Project:** BuildLab 2026 / Frontend Arena · **Build window:** six hours · **Product:** Grantly — Rethinking the Scholarship Experience

> **Read this entire document before coding.** This file is the source of truth for product scope, data semantics, visual design, functionality, testing and delivery. If existing `AGENTS.md` conflicts with this document, flag the conflict and use the more recent explicit user decision. Do not silently reinterpret the product into a generic dashboard.

## 0. Objective and non-negotiables

Build a **beautiful, responsive, graph-first scholarship copilot** that lets students:

1. Create a student profile manually.
2. **Discover** nationwide scholarship opportunities through a striking, interactive **3D node radar**, with an accessible list alternative.
3. **Understand** eligibility through an explainable **attribute-to-scholarship relationship graph**.
4. **Apply** by preparing a document checklist and tracking a **connected journey graph**; Grantly never submits applications itself.
5. **Track** saved/in-progress/submitted applications on an interactive **timeline graph**.
6. Toggle **Demo Mode** to explore a complete, prepopulated fictional journey, then switch back to independent real user data without losing anything.

### Locked decisions

| Area | Decision |
|---|---|
| Audience | All student education levels: school, diploma/vocational, undergraduate, postgraduate, doctoral and other |
| Scholarship coverage | **National only:** nationwide/centrally administered scholarship programs. Do not include state-administered scholarships in the verified catalogue. A national scheme may still have domicile/state restrictions; evaluate these accurately. |
| Eligibility | Deterministic, transparent TypeScript rule engine; **no AI eligibility decisions** |
| Documents | **Manual checklist only**; no PDF uploads, extraction, OCR or file storage |
| Data trust | Strict official-source verification for real catalogue; exclude unverified scheme records |
| Results | Eligible, Needs information, Not eligible; **Not eligible collapsed by default**, but accessible |
| Visual direction | Premium, clean **fintech styling**: light/white neutral surfaces, deep navy text, teal primary accent, restrained amber/red status colors |
| Product identity | **Graph-first**, not a conventional analytics dashboard; list views are alternatives, not replacements |
| 3D | Three.js via React Three Fiber and Drei; interactive, meaningful, performant; fallback for unsupported/slow devices |
| Demo | Global toggle, seeded fictional profile + application lifecycle, fully interactive, isolated from real mode |
| Backend | None. Client-side app with static verified data and localStorage persistence |
| Language | English first; additional languages explicitly deferred |
| Hosting | Public Vercel deployment and public GitHub repository |

**Scope interpretation:** National-only refers to program administration/coverage, not a requirement that every individual student from every state qualifies. All student levels are supported by the data model; show only education levels actually represented by verified catalogue records. Never invent a scheme to fill a category.

## 1. Product principles

- **One next action:** Every screen tells the student what to do next.
- **Truth over appearance:** Never fake a real scheme, amount, application window, verification date, eligibility criterion, or application status.
- **Explainable eligibility:** Show which verified conditions pass, fail or cannot yet be evaluated.
- **Eligibility ≠ readiness ≠ application status:** These are separate concepts and must never be conflated.
- **Visuals encode actual state:** Graph positions, sizes, colors and edges come from deterministic application data, not random display values.
- **Accessible and mobile-first:** All graphs have keyboard-accessible, semantic text/list equivalents.
- **Local privacy:** No login, cloud storage, identity-document collection or Aadhaar number.
- **Demo is explicit:** Fictional content is visibly marked, never silently merged with real catalogue or real user data.

## 2. Exact user journeys

### Real mode, first-time visitor

Landing → Create profile → Discover 3D radar → Select scholarship → Understand eligibility graph → Save/start preparation → Apply checklist + journey graph → Open official application portal → Manually mark submitted → Track timeline. Profile changes recompute eligibility and discovery positions. User can clear locally stored data.

If no profile exists, show a meaningful preview/CTA rather than pretending to know eligibility. If a scheme requires missing information, prompt only for that information and update the graph after input.

### Demo mode, first-time visitor or judge

Toggle **Demo Mode ON** from any screen → seed fictional profile and demo application records → display populated Discover, Understand, Apply and Track views → allow edits, checklist ticks, saves and status changes within the **demo-only** store → toggle OFF → return to untouched real-mode profile/applications (or real onboarding if empty) → toggle ON again → preserve demo changes until **Reset Demo** is selected.

A clearly visible `Demo Mode` label must persist in header/navigation; sample schemes must say `Illustrative demo scholarship — not an official listing` unless the exact scheme and details were independently verified. **Do not treat demo data as verified.**

### Screen-to-screen behavior

- Selecting a radar node opens an interactive side panel on desktop / bottom sheet on mobile without destroying the graph or camera state.
- `Full details` navigates to `/scholarship/:id`.
- `Prepare application` navigates to `/apply/:id`.
- `Open official portal` opens the exact verified application URL in a new tab, with safe link attributes; if unavailable, show `Application link not verified` and do not fabricate one.
- `I've submitted` is an explicit user action; merely opening a portal must not change submission status.
- Tracking statuses are **self-reported**; never imply automatic integration with official portals.
- A rejected application may link to similar **verified** alternatives in Discover; no claim of guaranteed acceptance.

## 3. Technology stack (locked)

- **React 18+**, **TypeScript (strict)**, **Vite**.
- **Tailwind CSS** with CSS design tokens; responsive semantic HTML.
- **Three.js**, **@react-three/fiber**, **@react-three/drei** for primary immersive discovery scene.
- **Motion** (`motion` / compatible React API) for page/panel transitions and micro-interactions; respect `prefers-reduced-motion`.
- **Custom SVG + React** for eligibility graph, application journey, timeline and accessible 2D radar fallback. Do not force all diagrams into 3D.
- **React Router** for navigation.
- **Zustand** for mode, profile, application and preferences state; versioned localStorage persistence.
- **Zod** for catalogue and persisted-state validation.
- **Fuse.js** for fuzzy search; **lucide-react** for icons.
- **Vitest** + **React Testing Library** for unit/component tests; browser smoke test as available.
- **Vercel** static deployment; **GitHub** public source.

Avoid adding a backend, database, auth provider, LLM SDK, PDF parser, OCR, physics engine or extra chart library. Do not add dependencies without a concrete need. Use package versions that install together; check actual APIs and build compatibility rather than assuming them.

## 4. Repository structure

```text
grantly/
├── public/
│   └── ... static assets only
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── data/
│   │   ├── scholarships.verified.json
│   │   ├── demoScholarships.ts
│   │   ├── demoProfile.ts
│   │   └── demoApplications.ts
│   ├── types/
│   │   ├── profile.ts
│   │   ├── scholarship.ts
│   │   ├── eligibility.ts
│   │   └── application.ts
│   ├── lib/
│   │   ├── eligibility/
│   │   │   ├── evaluateRule.ts
│   │   │   ├── evaluateGroup.ts
│   │   │   └── evaluateScholarship.ts
│   │   ├── ranking/rankScholarships.ts
│   │   ├── search/searchScholarships.ts
│   │   ├── validation/schemas.ts
│   │   ├── graph/layout.ts
│   │   ├── graph/graphData.ts
│   │   ├── dates.ts
│   │   └── storage.ts
│   ├── store/
│   │   ├── modeStore.ts
│   │   ├── profileStore.ts
│   │   ├── applicationStore.ts
│   │   └── preferencesStore.ts
│   ├── components/
│   │   ├── layout/{AppShell,JourneyNav,ModeToggle}.tsx
│   │   ├── discovery/{ScholarshipUniverse,ScholarshipNode,ScholarshipList,DiscoveryFilters}.tsx
│   │   ├── eligibility/{EligibilityGraph,EligibilityExplanation}.tsx
│   │   ├── application/{DocumentChecklist,ApplicationJourney}.tsx
│   │   ├── tracking/{TrackingTimeline,NextActions}.tsx
│   │   ├── scholarship/{ScholarshipDetailPanel,SourceVerification}.tsx
│   │   └── common/{StatusBadge,EmptyState,ErrorBoundary,LoadingState}.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── DiscoverPage.tsx
│   │   ├── ScholarshipPage.tsx
│   │   ├── ApplyPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ProfilePage.tsx
│   ├── styles/globals.css
│   └── main.tsx
├── tests/{eligibility,ranking,modeIsolation,storage,graphData}.test.ts
├── AGENTS.md
├── GRANTLY_SPEC.md
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Names are suggested; preserve clear separation of business logic, data, state and rendering. Import paths must resolve; no empty placeholder modules in submitted build.

## 5. Domain models and semantics

Use explicit types, avoid `any`, and validate external/static JSON with Zod before use.

### Student profile

```ts
type EducationLevel =
  | 'school' | 'diploma' | 'vocational' | 'undergraduate'
  | 'postgraduate' | 'doctoral' | 'other';

type StudentProfile = {
  id: string;
  educationLevel?: EducationLevel;
  currentClass?: string;       // school only, if relevant
  course?: string;
  yearOfStudy?: number;
  state?: string;              // national schemes may have domicile rules
  category?: string;           // use explicit controlled values + unknown
  annualFamilyIncomeINR?: number;
  gender?: string;
  disabilityStatus?: boolean;
  minorityCommunity?: boolean;
  ageYears?: number;
  marksPercentage?: number;
  academicYear?: string;
  institutionType?: string;
  documentsHeld: string[];     // names/IDs only, never files
};
```

Missing fields are intentionally optional. **Missing ≠ false, zero, general category or failure.** Do not force users to provide every sensitive field at onboarding. Ask for essential fields first; ask for extra information contextually when needed for a specific rule. Validate numbers (e.g., income ≥ 0, marks 0–100, realistic age); avoid arbitrary hard-coded demographic restrictions.

### Scholarship record

```ts
type Scholarship = {
  id: string;
  name: string;
  provider: string;
  scope: 'national';
  description: string;
  educationLevels: EducationLevel[];
  tags: string[];
  benefit: {
    displayText: string;      // source-faithful, e.g. variable award
    amountINR?: number;       // only when verified and comparable
    period?: 'one_time' | 'monthly' | 'annual' | 'variable';
  };
  applicationWindow: {
    status: 'open' | 'closed' | 'unknown';
    deadlineISO?: string;     // only when official source confirms
    academicYear?: string;
    lastCheckedISO?: string;
  };
  eligibility: RuleGroup[];   // top-level groups are combined with ALL
  requiredDocuments: { id: string; name: string; guidance?: string }[];
  applicationSteps: { id: string; title: string; guidance?: string }[];
  provenance: {
    officialSchemeUrl: string;
    officialGuidelinesUrl?: string;
    officialApplicationUrl?: string;
    lastVerifiedISO: string;
    verifiedFields: string[];
    verificationStatus: 'verified';
  };
};
```

For **demo-only** records, use a separate `DemoScholarship` type or explicit `dataOrigin: 'demo'`, never cast demo records to verified real records. Keep the official catalogue schema strict. Missing critical official-source verification means **exclude** the record from `scholarships.verified.json`.

### Rule representation

```ts
type RuleOperator = 'equals' | 'in' | 'lte' | 'gte' | 'between' | 'is';
type Rule = {
  id: string;
  profileField: keyof StudentProfile;
  operator: RuleOperator;
  expected: unknown;
  required: boolean;
  explanation: string;        // plain language based on source
  sourceUrl: string;          // official evidence for this criterion
};
type RuleGroup = {
  id: string;
  operator: 'all' | 'any';
  rules: Rule[];
  explanation?: string;
};
type RuleOutcome = 'pass' | 'fail' | 'unknown';
type EligibilityStatus = 'eligible' | 'needs_information' | 'not_eligible';
```

The rule schema above is illustrative; implement stronger discriminated unions for operator-specific `expected` types if feasible. Never execute arbitrary strings or JavaScript from the catalogue. Never compare unnormalized currency strings or parse free-form categories with substring matching.

### Application record

```ts
type ApplicationStatus =
  | 'saved' | 'in_progress' | 'submitted'
  | 'under_review' | 'approved' | 'rejected';

type ApplicationRecord = {
  scholarshipId: string;
  status: ApplicationStatus;
  documentsDone: string[];
  stepsDone: string[];
  appliedOnISO?: string;
  resultOnISO?: string;
  notes?: string;
  updatedAtISO: string;
};
```

Status changes must be explicit and labeled **student-reported**. `approved` is not inferred from eligibility; `submitted` is not inferred from checklist completion. Do not allow duplicate application records for the same scholarship ID in the same mode.

## 6. Eligibility engine — exact contract

Implement **pure TypeScript functions** with no React, storage, network or Three.js dependencies:

```ts
evaluateRule(profile, rule) -> {
  outcome: 'pass' | 'fail' | 'unknown';
  ruleId: string;
  explanation: string;
  actual?: unknown;
};

evaluateGroup(profile, group) -> {
  outcome: 'pass' | 'fail' | 'unknown';
  ruleResults: RuleResult[];
};

evaluateScholarship(profile, scholarship) -> {
  status: 'eligible' | 'needs_information' | 'not_eligible';
  groups: GroupResult[];
  passed: RuleResult[];
  failed: RuleResult[];
  unknown: RuleResult[];
};
```

**Mandatory rule semantics:**

- `all` group: **fail** if any mandatory rule fails; else **unknown** if any mandatory rule is unknown; else **pass**.
- `any` group: **pass** if any mandatory alternative passes; else **unknown** if at least one alternative is unknown; else **fail** if all mandatory alternatives fail.
- Across top-level groups (logical ALL): any failed group → `not_eligible`; otherwise any unknown group → `needs_information`; otherwise `eligible`.
- Optional rules are informational and do not gate eligibility. Do not let an optional rule make an `any` group pass by accident. If a group has no mandatory rules, it passes as a gate.
- A missing profile value gives `unknown`, not `fail`.
- Numeric boundaries are inclusive for `lte`, `gte`, `between` unless the source explicitly states otherwise; if source uses strict bounds, extend operators to `lt`/`gt` rather than silently approximating.
- Normalize comparison inputs (case/spacing for categorical enums, numeric values in INR, date handling) and reject invalid catalogue values.
- If official eligibility criteria cannot be expressed reliably, do not claim a verified eligibility decision for that scheme; exclude it until modeled.

**Critical separation:** An income threshold is an eligibility rule; possession of an income certificate is usually an **application readiness** requirement. Missing a document must not turn an otherwise eligible student into ineligible unless the official scheme explicitly states that possession is itself an eligibility condition.

**No misleading percentages:** Eligibility is a categorical result, **not** a probability of winning. For visual node sizing/distance, use a separately named, documented **display match/relevance score** derived from satisfied relevant conditions and information completeness. Never label it `chance of approval`, `likelihood of award` or `92% eligible`. Do not show a numeric score for records with insufficient information as if it were certainty.

## 7. Search, filtering and ranking

- Search verified scheme name, provider, summary and tags using Fuse.js; debounce if useful.
- Filters: education level, course, category, provider, benefit, deadline status/window and required documents where data supports them. Do not offer filters backed by nonexistent fields.
- Three visible groups: **Eligible**, **Needs information**, **Not eligible** (collapsed by default). A group must remain accessible even when empty.
- Eligibility status is the gate, **not** a weighted component in eligibility itself.
- Within eligible results, rank by relevant education/course fit, application urgency **only when verified open/deadline known**, and comparable verified benefit amounts. A simple documented heuristic is acceptable; no invented deadlines or benefits.
- `Needs information` shows the precise missing fields and a `Complete details` CTA.
- `Not eligible` shows exact failed conditions, with no shaming language.
- `Closed` and `Unknown window` are visibly distinct from `Open`; a confirmed closed scheme is never presented as open.
- Do not sum scholarship amounts into `You qualify for ₹X` unless units, conditions and comparability are verified. Prefer `N eligible opportunities` and per-scheme benefits.
- Filters/search update both the list and the 3D radar from the same selector data. Empty states explain which filter caused zero results and offer reset.

## 8. Visual system and interaction specification

### Design language

Premium fintech aesthetic, **not** a dark cyberpunk dashboard. Light ivory/white background, soft off-white surfaces, deep navy/charcoal text, teal highlights, amber for missing information, muted grey for ineligible, red reserved for failed rules/urgent deadlines. Use subtle glass/frosted surfaces sparingly around the 3D scene. Generous whitespace, strong typography, fine borders, elegant shadows, polished focus/hover/pressed states and coherent spacing. Avoid neon overload, generic KPI tile walls, stock imagery and decorative charts unrelated to user tasks.

Use CSS custom properties for palette, spacing, radii and shadows. Ensure WCAG AA contrast for essential text and controls. Never rely on color alone to express status. All touch targets at least ~44px.

### Discover: interactive **3D scholarship radar** (primary signature)

Implement with React Three Fiber / Drei:

- Central node = **student profile**. Surrounding nodes = scholarships. Show top 15–20 relevant nodes for performance; offer `Show more`/list for remaining results.
- Distance to center = **display relevance/match strength** (higher score closer), **not** odds of award. Clearly explain this in a legend.
- Node size = display relevance strength within bounded min/max sizes; do not imply guaranteed eligibility based on size alone.
- Solid teal = eligible; dashed/outlined amber = needs information; muted grey = not eligible (if user expands that group).
- Subtle concentric reference rings / orbital paths; avoid implying percentages of award probability. Use an optional short radar reveal/sweep animation driven by real computed results.
- Camera: controlled orbit/drag with constrained tilt and zoom, initial composition stable, reset-view control. No uncontrolled physics or jittering force simulation.
- Deterministic seeded node positions derived from scholarship IDs and score; stable on re-render; smooth animated transitions when profile or filters change.
- Hover/focus/tap: emphasize node, show accessible tooltip/label; click/tap opens detail panel. Support keyboard navigation through an accompanying accessible list.
- No permanent dense label overlap; label featured nodes, show others on hover/selection.
- Avoid text inside WebGL as the only way to access scholarship information; provide DOM overlays or list equivalents.
- Handle context loss / WebGL unsupported / reduced motion / low-power devices: display an attractive 2D SVG radar or ranked list, with a clear `Graph / List` toggle. On mobile, default to list or lightweight 2D graph, but preserve access to 3D via toggle if performant.
- Use `Suspense`, error boundaries, bounded device pixel ratio, limited lights/materials, no expensive shadows/postprocessing by default. Clean up scene resources and event listeners on unmount.

### Understand: **eligibility relationship graph**

Use responsive SVG (2D is preferred for readability): student attribute/condition nodes on left, scholarship node on right; lines represent rules. Teal solid edge = pass, amber dashed = unknown, grey/red dashed = fail. Display `ALL` / `ANY` alternatives as labeled groups rather than drawing misleading direct edges. Each edge must map to an actual evaluated rule ID. Clicking a rule highlights its plain-language explanation, source link and possible next action. Show a synchronized accessible checklist. No claim that a document fixes a failed fixed attribute; only missing information can be completed. Distinguish `missing evidence/document` from `unknown profile attribute`.

### Apply: **application journey graph + manual document packet**

A connected five-step visualization: `Documents ready → Form filled → Submitted → Under review → Result`. Checklist completion updates document readiness; a progress ring can animate smoothly. The graph must not advance to `Submitted` without explicit user confirmation. `Under review`, `Approved`, `Rejected` are manually selected and marked student-reported. Required documents are **names and checkboxes only**; no upload controls or stored files. Optional tasteful page/packet motion is permitted, but no fake file-processing animation. Show official portal link only when verified. The final step should say `Ready to apply on the official site`, not `Application submitted`.

### Track: **interactive application timeline graph**

Applications are rectangular nodes/cards positioned by actual recorded application/result dates; `Today` marker; future verified deadlines may appear as separate labeled events. Color + icon + text represent saved, in progress, submitted, under review, approved and rejected. Unknown dates go in an `Undated` group rather than fabricated timeline positions. Clicking an application opens its detail/status panel; next actions appear prominently above the timeline. On phones use a vertical timeline/list with the same statuses. Do not infer award amounts or approval probabilities.

### Motion and micro-interactions

- Elegant 150–350ms transitions for panels, buttons and route changes; optional radar intro max ~2–3 seconds, always skippable.
- Respect reduced-motion preferences and disable nonessential camera/particle animation.
- Keep keyboard focus stable when panels open/close; Esc closes, focus returns to trigger.
- Never block interaction while animations finish.

## 9. Pages and route requirements

| Route | Required content and behavior |
|---|---|
| `/` | Polished hero, product promise, primary `Find my scholarships`, visible Demo Mode entry, privacy/trust note, preview of graph-first experience |
| `/onboarding` | Manual progressive profile form; validation; why each field matters; save and proceed; no PDF/file upload |
| `/discover` | 3D radar primary on desktop, Graph/List toggle, search/filter controls, grouped eligibility results, counts, legend, accessible list, node detail panel |
| `/scholarship/:id` | Verified source and date, amount/window if known, summary, eligibility relationship graph, explanations, required documents, application steps, save/prepare/official link |
| `/apply/:id` | Manual checklist, readiness, application journey graph, official portal action, explicit self-reported status update |
| `/dashboard` | Next Actions, application timeline graph, status filters and concise summary; not a generic KPI-only dashboard |
| `/profile` | Edit profile, see recomputation, privacy explanation, clear real data, manage demo reset separately |
| `*` | Helpful 404 with route back home |

Global `AppShell`: responsive navigation for Discover → Understand → Apply → Track, persistent Demo Mode switch, accessible keyboard focus, active route indicator and visible real/demo status. Route guards must not redirect demo users into empty real onboarding. Unknown IDs must show an error state, never crash.

## 10. Demo Mode — detailed behavior

### Two isolated data namespaces

Use separate persisted stores or explicitly namespaced keys:

```text
grantly:real:profile:v1
grantly:real:applications:v1
grantly:demo:profile:v1
grantly:demo:applications:v1
grantly:preferences:v1
grantly:mode:v1
```

Catalogue source is selected by mode:

- **Real:** `scholarships.verified.json` only; official verification required.
- **Demo:** fictional `demoScholarships.ts` (or explicitly labeled verified records plus clearly labeled fictional state). Prefer clearly fictional names so no demo award/deadline could be mistaken for real.

Demo seed should include a fictional student and at least 8–12 **illustrative** scholarships covering pass, fail and unknown rule outcomes; examples across education levels may be included as alternative profiles, but do not pretend one student simultaneously attends school and postgraduate study. Seed application records across statuses: saved, in progress, submitted, under review, approved, rejected. Seed document readiness and real-looking but **explicitly fictional** event dates. Demonstrate at least one `all` group, one `any` group, missing data, and a document gap that does not affect eligibility.

### Toggle contract

1. Toggle ON: if no demo state exists, deep-clone seed profile/applications into demo namespace; activate demo catalogue; show demo banner. If demo state exists, restore it.
2. Toggle OFF: restore real namespace and verified catalogue without changing real data; if real profile missing, show onboarding prompt.
3. Edits in Demo Mode update **only demo** state.
4. Edits in Real Mode update **only real** state.
5. `Reset Demo` prompts confirmation and resets demo namespace only; `Clear My Data` prompts confirmation and clears real namespace only.
6. Refresh preserves active mode and that mode's edits. Corrupt persisted JSON is validated and recovered safely, with non-destructive fallback when possible.
7. A demo user may traverse every route without real-mode data. Links for fictional schemes must not lead to invented official application URLs; use a `Simulate application` button in Demo Mode instead.
8. Any metrics, timestamps, amounts and statuses shown in demo must be explicitly fictional; use a persistent `Demo data` badge and clear legend.

**Acceptance test:** enter demo → change profile, check documents, update an application → toggle real → create real profile and save application → toggle demo → demo changes still exist → toggle real → real changes still exist → refresh → both modes retain their own data → Reset Demo → real unchanged.

## 11. Verified data sourcing and trust policy

The original concept proposed a large scraped dataset and PDF extraction. **That is superseded.** For the six-hour build, aim for **8–12 genuinely verified nationwide/centrally administered schemes**, fewer if necessary to maintain integrity. Do not force quotas or invented records. Data should cover different education levels where official evidence exists.

Preferred source order: current official scheme guidelines / government order → National Scholarship Portal / administering ministry or agency → official government discovery portals such as myScheme as supplementary discovery. Third-party scraped datasets may help locate candidates **but cannot certify a record**. Do not rely on stale source text to assert that an application is currently open.

For every real record verify and capture:

- Exact scheme identity, administrator and national scope.
- Current eligibility criteria and any exceptions/alternatives.
- Benefit description, amount/frequency only if confirmed.
- Required documents, if documented.
- Official scheme URL, official guidelines URL where available, official application URL where available.
- Academic year and last checked date.
- Application deadline/window only when confirmed by official current source.

If a deadline is not verified, set `unknown` and show `Deadline not verified`. If an application URL is missing, do not invent it. If a rule is not verified, **do not add the scheme to the real catalogue**. Avoid placeholders that look like real scholarships. Maintain `DATA_SOURCES.md` or a README section with links and verification notes. Since external sites may be unavailable in Codex's environment, **never fabricate verification**: implement the real catalogue loader with an empty-state message if no trustworthy verified data can be obtained; Demo Mode still fully demonstrates the product.

## 12. Ranking / graph consistency and calculations

- Compute selectors from **active mode profile + active catalogue**; do not persist derived eligibility results.
- Keep a single derived array of evaluated scholarships shared by radar, list, detail and counts.
- Graph positioning and rank must be deterministic for identical inputs; no random `Math.random()` in render.
- Status color, edge style and text must agree across radar, detail, Apply and Track.
- Benefit values are not summed across different award periods, variable awards or conditional renewals.
- Dates: use local-day comparisons carefully; parse ISO dates consistently, avoid timezone off-by-one. Unknown dates remain unknown.
- Never compute an urgency score for an unknown/closed window as if open.
- Search/filter changes must preserve selection when possible; otherwise close panel gracefully.

## 13. State, privacy, security and reliability

- No server, user accounts, API keys, analytics trackers, cookies for authentication, or personal document uploads.
- Store only user-entered profile fields, checklist IDs, application states and preferences in browser localStorage. Explain that localStorage is device/browser-specific, not encrypted cloud storage; do **not** promise absolute privacy or secure handling of sensitive data.
- Do not collect Aadhaar numbers, certificate numbers, scanned IDs or bank account numbers.
- Validate persisted data with Zod; handle schema versioning and storage quota/private-mode failures gracefully.
- Escape/render user text safely through React; never use `dangerouslySetInnerHTML` for external scheme text.
- Validate outbound URLs and use `target="_blank" rel="noopener noreferrer"` for external links.
- Error boundaries around WebGL scene and app routes. Provide useful error/empty/loading states.
- Disable unavailable actions rather than allowing silent no-ops.
- Maintain a responsive, usable app without WebGL, with JavaScript errors handled and no blocking animation.

## 14. Accessibility and responsive requirements

- Semantic headings, form labels, descriptive validation messages, visible focus rings, keyboard navigation and logical tab order.
- Screen-reader-equivalent list/table for every graph; don't rely solely on canvas/WebGL content.
- Status conveyed by color **plus** text/icon/pattern.
- Keyboard-accessible node selection via companion list; panel opens with focus management, Esc closes.
- Motion disabled or minimized under `prefers-reduced-motion`.
- 320px+ mobile width: no horizontal overflow, readable text, 44px targets, responsive bottom sheets, vertical timeline, list-first discovery default.
- Tablet/desktop: split view graph + detail panel, balanced spacing, no overlapping labels or clipped controls.
- Test with keyboard only and at least one narrow viewport.

## 15. Tests and acceptance criteria

### Eligibility unit tests (required)

1. All mandatory rules pass → eligible.
2. Any mandatory `all` rule fails → not eligible.
3. Mandatory value missing, no failures → needs information.
4. Failure + unknown → not eligible.
5. Optional missing does not gate eligibility.
6. `any`: one pass + others fail/unknown → pass.
7. `any`: no pass + one unknown → unknown.
8. `any`: all fail → fail.
9. Numeric boundaries exact and just outside; null/undefined distinct from zero/false.
10. Editing profile recomputes status deterministically.
11. Missing required document changes readiness but **not** eligibility.
12. Unsupported/invalid rule data fails validation rather than being silently treated as eligible.

### State/demo tests (required)

- First toggle seeds demo; repeat toggle restores demo edits.
- Real and demo profiles, applications and catalogues never cross-contaminate.
- Refresh restores mode and state.
- Reset Demo preserves real data; Clear My Data preserves demo data.
- Corrupt localStorage handled without app crash.

### UI / end-to-end smoke tests (required)

- Landing → onboarding → Discover → scholarship detail → Apply → Track.
- Graph nodes map to correct schemes; selecting a node opens the correct panel.
- Search/filter counts and radar/list are synchronized.
- Ineligible section collapsed initially, expandable by user.
- Missing info prompt updates graph and eligibility.
- Status only changes after explicit user action.
- Unknown deadline and missing official link show honest fallback text.
- Demo complete journey works from any entry route.
- Mobile viewport and keyboard-only navigation work.
- No console errors, broken images, broken routes or TypeScript errors.
- `npm run build` and `npm run test` pass; preview/deployment works with direct route refresh (SPA rewrite configured).

## 16. Implementation sequence and six-hour priorities

**Work in vertical slices; build and run continuously.** Time estimates are planning targets, not promises.

| Time | Work | Exit condition |
|---|---|---|
| 00:00–00:20 | Scaffold, tokens, routing, shell, deploy skeleton | App runs and public deployment works |
| 00:20–00:50 | Zod schemas, verified catalogue loader, fictional demo fixtures, source labels | Validated data and honest empty states |
| 00:50–01:20 | Profile form, mode isolation, localStorage, demo toggle | Both modes survive refresh |
| 01:20–02:05 | Pure eligibility engine, rule-group tests, readiness separation | Tests pass |
| 02:05–03:00 | Discover search/filter, 3D node radar, list fallback, panel | Signature graph functional |
| 03:00–03:40 | Scholarship details and eligibility SVG graph | Explanations + source links correct |
| 03:40–04:20 | Apply checklist and connected journey graph | Manual preparation flow works |
| 04:20–04:50 | Track timeline, next actions, status editing | Complete demo lifecycle works |
| 04:50–05:35 | Responsive polish, accessibility, transitions, smoke tests | Mobile + keyboard + builds pass |
| 05:35–06:00 | README, data provenance, deployment, protected buffer | Public live URL + public repo ready |

### Cut order if time is short

Cut in this order: elaborate particle effects → extra 3D shaders → intro radar sweep → decorative packet animation → advanced search/filter chips → secondary transitions. **Do not cut:** real/demo isolation, deterministic eligibility, truthful data labeling, 3D Discover graph (with fallback), eligibility graph, journey graph, tracking timeline, responsive UI, end-to-end demo and deployment. If WebGL becomes unstable, preserve the complete experience through the accessible SVG/list fallback and report the limitation; do not ship a crashing 3D canvas.

## 17. Codex execution protocol

1. Read `AGENTS.md`, this entire `GRANTLY_SPEC.md` and inspect existing files.
2. Identify any genuine blocking contradiction or missing official data. **Do not ask for aesthetic preferences already locked above.**
3. Create a concise implementation checklist and execute in the sequence above.
4. Before writing code, verify package APIs and architecture consistency; avoid speculative imports and obsolete package syntax.
5. Implement functional data flow first, then refine the visuals. Never substitute mock UI with inert controls.
6. After each major slice, run typecheck/tests/build as applicable; fix errors before proceeding.
7. Prefer small, testable components; no monolithic page with mixed rules, state and WebGL logic.
8. Never claim a test passed unless it actually ran. Never claim official data verified without checking an official source.
9. If access to official scholarship sources is unavailable, ship the verified catalogue empty-state plus fully working labeled Demo Mode; list the limitation in README.
10. Keep progress notes concise; prioritize a finished, functioning deployed app over descriptions of future work.

### Definition of done

- [ ] Premium, polished graph-first fintech interface; no generic dashboard replacement.
- [ ] React + TypeScript + Three.js/R3F app runs without build errors.
- [ ] Interactive 3D scholarship radar with deterministic positioning and graceful fallback.
- [ ] Eligibility relationship SVG and clear pass/fail/unknown explanations.
- [ ] Manual application checklist and accurate connected journey.
- [ ] Application timeline graph and self-reported statuses.
- [ ] Demo Mode seeded across full journey, editable, resettable and isolated.
- [ ] Real Mode independently functional with strict verified-only catalogue.
- [ ] Correct eligibility rule groups and tests; readiness separate from eligibility.
- [ ] Responsive, keyboard-accessible and reduced-motion compatible.
- [ ] No invented official scholarship facts, deadlines, application URLs or live statuses.
- [ ] All routes, actions, direct refresh and persistence tested.
- [ ] README explains setup, scripts, privacy, data provenance, Demo Mode and limitations.
- [ ] Public GitHub repository and live Vercel URL verified before submission.

## 18. Demo script for judges (60–90 seconds)

1. Open Grantly, toggle **Demo Mode ON**; the UI clearly says `Illustrative demo data`.
2. Show the fictional student's profile and rotate/select scholarship nodes in the 3D radar; explain proximity = match relevance, **not** chance of winning.
3. Click a node; show eligibility graph with passing, failing and unknown criteria and exact next action.
4. Fill one missing profile value; demonstrate eligibility recalculation and graph movement.
5. Prepare application by ticking document names; show journey graph progressing only to readiness, not automatic submission.
6. Mark the application `Submitted` manually; open Track and show the timeline/status.
7. Toggle **Demo Mode OFF** and show that the real profile/catalogue are separate and official-source verification is enforced.

**Final product promise:** Grantly helps students discover, understand, prepare for and track national scholarships through meaningful interactive graphs—without pretending to determine awards, process private documents, submit applications or fetch live official status.
