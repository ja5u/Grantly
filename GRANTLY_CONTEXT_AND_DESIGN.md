# GRANTLY — Product Vision, Complete Context & Experience Design

**Companion to:** `GRANTLY_SPEC.md`  
**Purpose:** Explain **why we are building Grantly, what success looks like, what the product should feel like, and how the complete experience fits together**. This is the product/UX north star for Codex or any coding agent.  
**Status:** Approved direction consolidated from the planning conversation, 7 November 2026.

> **Reading order:** Read this document to understand the product vision, then read `GRANTLY_SPEC.md` for the authoritative engineering contracts, rules, routes, models, and acceptance criteria. **If this narrative suggests a feature that conflicts with the locked implementation specification, the implementation specification takes precedence.** Do not turn this narrative into a reason to expand the six-hour scope.

---

## 1. The challenge we are solving

We are creating **Grantly — Rethinking the Scholarship Experience**, a frontend hackathon project. The challenge is to make scholarships easier for students to **discover, understand, prepare applications for, and track**.

Scholarship information is fragmented and often hard to interpret. A student may find a scheme but still not know whether they satisfy its conditions, which information is missing, what documents they need, where the official application happens, or what they have already done. Lists of scholarship links alone do not solve that journey.

**Our goal is not to build another scholarship directory or generic analytics dashboard.** We are building an interactive, visual **scholarship navigation and preparation copilot** that turns a complicated process into a comprehensible, connected journey.

Grantly must be genuinely useful even without animations: its underlying eligibility logic, verified catalogue, source links, manual preparation workflow, and tracking must work. The visual layer makes the logic immediately understandable and the experience memorable.

### Product promise

> **See your scholarship opportunities. Understand every connection. Know your next move.**

This is a proposed positioning line, not a claim of guaranteed eligibility, award, or application success.

### Target audience

Students across education levels: school, diploma, vocational, undergraduate, postgraduate, doctoral, and other supported levels. **The real scholarship catalogue is limited to verified national/centrally administered programs.** This is not a promise that verified scholarships will exist for every profile or education level. National schemes may still have domicile restrictions.

---

## 2. The product idea in one minute

A student enters a small profile manually. Grantly compares that profile against a carefully verified national scholarship catalogue using transparent, deterministic eligibility rules. The student sees a striking **3D radar of scholarship nodes** organized around their own profile. Clicking a scholarship reveals **why it matches or does not match**, visualized as connections between the student's attributes and the scheme's rules. The student can then **prepare** a manual document checklist, see progress through a **connected journey**, open the **official application site**, and manually **track** the status of their application on a timeline.

An always-accessible **Demo Mode** instantly populates the entire journey with fictional example data so a judge or first-time visitor can explore everything without spending time entering a profile. Turning Demo Mode off returns to the person's separate, real data without losing it.

The core flow is:

```text
LANDING
   ↓
PROFILE / ONBOARDING (manual)
   ↓
DISCOVER — immersive 3D scholarship node radar
   ↓ click a scholarship node
UNDERSTAND — eligibility relationship graph + plain-language facts
   ↓ choose to prepare
APPLY — manual documents + connected progress journey
   ↓ official application happens outside Grantly
TRACK — self-reported application timeline and next actions
   ↺ edit profile, explore alternatives, revisit scholarships
```

**The graphs are the product's primary interaction language, not decorative charts added to a dashboard.**

---

## 3. What we are trying to achieve

### For students

1. **Clarity:** Distinguish eligible, needs more information, and not eligible without guessing.
2. **Confidence:** Explain the conditions and cite the official source for each real scholarship.
3. **Direction:** Show the most useful next action, not just more data.
4. **Continuity:** Carry the student from discovery through application preparation and self-reported tracking.
5. **Privacy:** Run in the browser with local data, no account, no uploaded documents, no identity-number collection.

### For the hackathon demonstration

1. **Immediate impact:** A polished interactive graph experience visible within seconds.
2. **Substance behind the visuals:** Deterministic eligibility and consistent graph semantics.
3. **A complete story:** Discover → Understand → Apply → Track works end-to-end.
4. **Frictionless judging:** Demo Mode shows a populated, clickable product immediately.
5. **Trustworthy engineering:** Real mode never disguises fictional/unverified scholarships as genuine.
6. **Practical delivery:** A responsive public deployment and readable public repository, built within the six-hour event.

**Success is not measured by the number of floating nodes or animations.** It is measured by whether a student or judge can navigate the journey, understand why the graph looks the way it does, and complete meaningful actions without dead ends.

---

## 4. The design personality

### The design direction

**Premium fintech precision meets an interactive scholarship universe.**

Use the discipline of a modern financial product—clear information hierarchy, typography, consistent spacing, trust indicators, subtle borders, accessible controls—combined with an expressive 3D exploration canvas. The result should feel **credible, modern, memorable, and responsive**, not like a science-fiction game, a cryptocurrency dashboard, or a stock admin template.

### Visual vocabulary

- **Canvas:** primarily light/white or warm off-white surfaces; subtle tonal sections and restrained gradients.
- **Typography:** deep navy/charcoal, crisp headings, short explanations, highly readable facts.
- **Accent:** teal for primary interaction and verified eligible status.
- **Caution:** amber for missing information; muted grey for failed/ineligible states; red only for meaningful errors/urgent warnings.
- **Materials:** selective glass-like surfaces or depth for floating panels and the 3D scene; do not compromise text contrast.
- **Nodes:** intentional shapes, glow and depth, not random floating spheres. Size, position and edge style encode meaningful values.
- **Motion:** smooth and restrained, purposeful rather than continuous distracting movement.
- **Space:** generous margins, uncluttered composition, an immersive main canvas with compact supporting controls.

**Important:** 'Fintech' describes the polish and trustworthiness of the design. It does **not** authorize replacing the graphs with KPI tiles, generic bar charts, tables, or a conventional admin dashboard.

### Suggested visual hierarchy

1. Large, legible page purpose and next action.
2. Main interactive visualization occupying the dominant visual area.
3. Contextual controls and compact summary facts.
4. A slide-over/bottom sheet for detail, not a new crowded screen every time a node is selected.
5. An always-available accessible text/list representation.

### Interaction principles

- Hover/focus reveals a concise preview; click/tap opens meaningful detail.
- Never require hover for essential information.
- Every transition should preserve orientation: a selected scholarship should remain identifiable when its detail panel opens.
- A graph should update when its underlying data changes; do not animate fake results.
- A 3D scene is a visualization of eligibility results, **not** the source of eligibility calculations.
- Respect reduced-motion preferences and low-performance devices.

---

## 5. Screen-by-screen experience

### A. Landing — make the concept obvious

**The first impression:** a concise, ambitious hero that says Grantly helps students navigate scholarship opportunities visually. An attractive but lightweight preview of the node universe may sit beside the message. The primary action is **Explore scholarships / Get started**; a prominent secondary action is **Try Demo Mode**.

The landing page should establish the four-stage journey in a compact way. It should not bury the experience under a long generic marketing website. No fabricated totals, success rates, award probabilities, or partner endorsements.

### B. Profile / onboarding — give the graph something real to respond to

The student manually enters the relevant information: education level, course or class, state, category, annual family income, and other fields only when needed. Each question explains why it helps matching. Unknown or omitted information must be allowed so the engine can return **Needs information** rather than forcing an invented answer.

The flow should feel quick and friendly: concise fields, progress cues, helpful examples, and a clear **See my scholarships** action. Do not request Aadhaar or upload documents. Profile edits later should recompute results immediately.

### C. Discover — the signature 3D scholarship universe

**This is the hero feature of the entire application.**

Imagine a central student anchor surrounded by scholarship nodes at varying distances. The visual arrangement communicates how well each scheme matches the student, without pretending to know their probability of receiving an award.

```text
                   [Scholarship C]

          [Scholarship A]       [Scholarship D]

                 ┌─────────┐
                 │   YOU   │     ← central student anchor
                 └─────────┘

       [Scholarship B]             [Scholarship E]

                  [Scholarship F]
```

The actual implementation is an interactive **Three.js scene** with deliberate depth, controlled camera movement, visible labels, smooth selection, and useful interactions. It is **not** a physics simulation with randomly drifting nodes.

**Semantics:**

- Center = the student profile.
- Node = one scholarship.
- Closer/larger = stronger explainable match/relevance, according to the authoritative scoring rules in `GRANTLY_SPEC.md`.
- Solid teal = eligible.
- Dashed amber = missing information / needs information.
- Muted grey = not eligible; those results are accessible but collapsed by default in the corresponding results group.
- Selecting a node = open scholarship details without losing the scene.

Include search, relevant filters, an explicit legend, and a list alternative. The graph is the desktop signature experience; the list may be the default on mobile for clarity and performance. Avoid overcrowding by limiting displayed nodes and offering a way to see additional results.

**Critical integrity rule:** Eligibility status is determined by the rules engine, not by a visual score threshold. A node can be a strong thematic match while still being ineligible; never color it eligible based on proximity alone.

### D. Understand — make eligibility explainable through edges

Selecting a node reveals a detail panel (desktop side panel; mobile bottom sheet) with scheme name, provider, official source, known benefit/deadline facts, eligibility status, and clear actions.

The centerpiece is an **eligibility relationship graph**: student facts and verified scheme conditions are connected with edges that explain what passed, failed, or could not yet be evaluated.

```text
STUDENT FACTS / CONDITIONS              SELECTED SCHOLARSHIP

Education level ─── matched ───┐
Income          ─── matched ───┤
Category        - - unknown - -├────── [SCHOLARSHIP]
Course          ─── matched ───┤
Other condition - - failed - -─┘
```

This is an explanatory diagram, not a fake machine-learning reasoning trace. The graph must be generated from the exact same rule results as the accompanying plain-language checklist. If a value is missing, show what the student can enter to resolve the uncertainty. If a verified rule fails, explain that fact without suggesting the student can 'fix' an immutable characteristic.

Keep **eligibility** distinct from **document readiness**. A missing certificate does not automatically mean a student is ineligible if the underlying condition is already satisfied. If no official deadline is verified, say so; do not invent a countdown.

### E. Apply — preparation as a connected, satisfying journey

Grantly does **not** submit applications on behalf of students. This screen helps students prepare what they need and understand what remains.

Show a manual checklist of required documents and steps. A lightweight packet metaphor can animate a document *checklist item* into place when checked. The UI must never imply that actual files were uploaded or stored.

A connected journey shows:

```text
[Documents ready] → [Form filled] → [Submitted] → [Under review] → [Result]
```

Completed steps change appearance; the current stage is highlighted. The final application action opens the verified official portal. Only after the student explicitly marks **I've submitted** should Grantly record a submitted status. Opening an external site is not proof of submission. Under-review, approved and rejected statuses are user-entered, not synchronized from a government system.

### F. Track — see the journey, not just status cards

This page is a **visual application timeline**, not a generic analytics dashboard.

Each application appears as a dated rectangular node/card. The horizontal axis conveys time; a Today marker separates earlier activity from upcoming deadlines. Shapes, status icons, labels and colors communicate progress. Clicking an application opens details and relevant next actions.

Examples of useful next actions: finish missing checklist items, visit an official portal, manually update an application status, or revisit a scholarship whose eligibility information changed. Do not claim Grantly knows official review outcomes.

A compact summary may support the timeline, but it must not dominate the page. On mobile, switch to a clear vertical timeline.

### G. Profile — a control surface, not a settings maze

Let the student update relevant facts, see that eligibility will be recalculated, and clear local data. Keep privacy messaging accurate and straightforward. Do not add account creation, cloud sync or unnecessary preferences.

---

## 6. Demo Mode — the entire product in one toggle

Demo Mode is a **first-class product experience**, not a screenshot carousel, isolated prototype or hard-coded mock dashboard.

### Why it exists

Judges have limited time. They should be able to turn on a single toggle and immediately see what Grantly looks like with meaningful, populated data **from the beginning to the end of the user journey**.

### Behavior

**Toggle ON:**

- Load a clearly labeled fictional student profile.
- Populate the 3D radar with sample scholarship nodes and coherent eligibility results.
- Populate eligibility relationship graphs with pass/fail/unknown examples.
- Populate manual checklists, application journey states, and a timeline containing examples at different stages.
- Allow navigation, clicks, filtering, edits, checklist updates and status changes.
- Keep an obvious **Demo Mode** indicator visible throughout the application.

**Toggle OFF:**

- Return to the independent real user profile and application state, if present.
- Otherwise show the genuine onboarding/empty state.
- Do not carry fictional profile fields, saved applications, awards or statuses into real mode.

**Toggle ON again:** Preserve the demo edits until the user deliberately selects **Reset Demo**. Reset restores the original demo seed only.

### Demo data honesty

Illustrative demo scholarships must be marked **fictional / illustrative**, with no invented official portal links. If a real verified scholarship is used, it must still follow the real catalogue verification rules. Do not show fictional funding totals as genuine available money. Demo figures are illustrations of interface behavior, not claims about the actual scholarship market.

### Suggested demonstration sequence

1. Open Grantly and switch on Demo Mode.
2. Show the populated 3D scholarship radar and click a strong match.
3. Show the eligibility graph and one unresolved condition.
4. Visit Apply, tick a document, and watch the journey update.
5. Open Track to see several application states on the timeline.
6. Switch Demo Mode off and show the separate real onboarding/data state.

---

## 7. How the experience should feel during use

**At first glance:** 'This is different from a scholarship website.' The 3D radar is visible and legible, not buried behind menus.

**After the first click:** 'I understand why this scholarship is shown to me.' The detail panel and eligibility edges tell a coherent story.

**During preparation:** 'I know what I have, what is missing, and what to do next.' Checklist progress is explicit.

**While tracking:** 'I can see where each application stands.' The timeline shows self-reported history without implying official integration.

**In Demo Mode:** 'I can explore the complete product immediately.' No empty graphs or dead-end demo buttons.

**In Real Mode:** 'My information is separate and the scholarship facts are trustworthy.' Unknown information is acknowledged rather than guessed.

---

## 8. Important product decisions already made

These decisions are **locked**; do not ask the user to reconfirm them during implementation:

| Topic | Agreed direction |
| --- | --- |
| Scope | National/centrally administered scholarships only |
| Audience | All student education levels where the verified data supports them |
| Eligibility | Deterministic rules, with clear pass/fail/unknown reasoning |
| Documents | Manual checklist; no PDF parsing, uploads or OCR |
| Trust | Strict official verification for real scholarship records |
| Ineligible results | Available but collapsed by default |
| Look and feel | Premium fintech polish with an interactive graph-first product identity |
| Primary 3D experience | Three.js / React Three Fiber scholarship radar |
| Other graphs | Eligibility relationships, application journey, application timeline; SVG where clearer |
| Demo Mode | Complete seeded journey, editable and fully isolated from real data |
| Persistence | Browser localStorage, no login/backend/database |
| Initial language | English |
| Deployment | Public frontend deployment and public source repository |

### Agreed technology direction

React + Vite + TypeScript + Tailwind CSS; Three.js + React Three Fiber + Drei; Motion for transitions; React Router; Zustand; Zod; Fuse.js; lucide-react; custom SVG; Vitest / React Testing Library; Vercel. The exact dependency and implementation contract lives in `GRANTLY_SPEC.md`.

---

## 9. What NOT to build

Do **not**:

- Replace the main discovery radar with a grid of generic scholarship cards.
- Replace the timeline with a generic KPI dashboard.
- Use decorative random node positions unrelated to actual matching data.
- Add AI-generated eligibility decisions or imply an LLM certifies scholarship rules.
- Invent real scholarship records, benefit amounts, deadlines, eligibility rules or official links.
- Confuse 'likely relevant' with 'officially eligible' or 'eligible' with 'guaranteed award'.
- Confuse a missing document with a failed eligibility condition.
- Claim to submit applications or automatically receive official application status.
- Upload/store identity documents or request Aadhaar numbers.
- Add a backend, authentication, database, live scraping or unrequested integrations.
- Spend the entire build window polishing 3D while the complete user journey remains broken.
- Make Demo Mode overwrite real data or vice versa.
- Make visual meaning depend on color alone.

---

## 10. How Codex should use this context

**Before writing code:**

1. Read this entire file for product intent and visual hierarchy.
2. Read `GRANTLY_SPEC.md` fully for authoritative behavior, data semantics, implementation order and acceptance tests.
3. Inspect the existing repository; do not destroy existing working code without reason.
4. Identify contradictions or missing critical dependencies, then resolve them in favor of the locked specification.
5. Implement the functional end-to-end journey and the core graph interactions before secondary polish.

**During implementation:**

- Make design decisions consistent with the 'premium fintech + graph universe' vision.
- Treat the 3D Discover radar as a signature feature, not an optional flourish.
- Ensure every graph reads from actual app state and the same eligibility engine.
- Keep the demo fully navigable, clearly fictional, and isolated from real mode.
- Maintain graceful mobile, keyboard, reduced-motion and 2D/list fallbacks.
- Keep the app coherent across all routes; avoid building disconnected attractive screens.

**Before declaring completion:**

- Run type checks, tests, production build and end-to-end smoke checks.
- Verify the Demo ON → interact → OFF → real data unchanged → ON → demo preserved → Reset Demo sequence.
- Verify the radar, eligibility graph, journey and timeline all represent consistent underlying state.
- Verify that no fictional data appears in the verified real catalogue.
- Verify the official links and unknown-deadline handling.
- Verify mobile usability, accessibility basics, and deployed navigation.

**Definition of the product in one sentence:**

> **Grantly is a trustworthy, graph-first scholarship copilot that turns verified eligibility, application preparation and self-reported tracking into one immersive, understandable journey—instantly explorable through a separate, fully interactive Demo Mode.**

---

## 11. Companion document relationship

| Document | Responsibility |
| --- | --- |
| `GRANTLY_CONTEXT_AND_DESIGN.md` | **Why** the product exists, intended experience, UX philosophy, visual direction, narrative and design guardrails |
| `GRANTLY_SPEC.md` | **Exactly what and how** to implement: models, rules, routes, technical architecture, edge cases, test cases and delivery |
| `AGENTS.md` (if present) | Short operational instructions pointing Codex to both documents |

These files are complementary, not competing specifications. **Do not silently replace the product vision with a generic dashboard, and do not change locked behavior based on illustrative prose.**
