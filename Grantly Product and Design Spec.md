# Grantly: Product and Design Spec

Nov 7, 2026 · @Jaswant

## Overview

Grantly is a scholarship copilot: a student shares a few documents, sees which schemes they qualify for ranked by match strength, understands each one in their own language, gets guided through the application, and tracks every result on one timeline.

**The problem.** Scholarships are scattered across many portals, eligibility rules are hard to read, deadlines and documents are easy to lose, and there is no single view of "what can I apply for, and where do I stand?"

**Design principles**

- One question per screen: "what should I do next?"
- Every score is explained: what matched, and what is missing.
- Privacy by default: documents are read in the browser, then deleted. No login; data stays on the device.
- Honest by design: sample data labelled as such, a "verify on the official site" note on every scheme, and Grantly guides the student but never submits for them.
- Accessible: color is never the only signal, and every graph has a plain list fallback.
- Mobile-first, because many students will use a phone.

**Hackathon fit.** Built for BuildLab 2026 (Frontend Arena): individual, six hours, a modern frontend framework required. The design targets the judged areas directly: problem alignment, working features, UI/UX and accessibility, clean components, product thinking, and a finished, deployed demo.

## The journey

The four stages from the problem statement run as one flow, and each ends with a single next action.

&#91;embedded content: journey flow · 5 stages, 1 loop\]

Onboarding builds the profile, Discover ranks the matches, Understand explains one scheme, Apply prepares the packet, and Track follows the result. A rejection or a profile edit loops back to Discover with updated matches.

## Onboarding: a profile built from documents

A student uploads PDFs instead of typing; Grantly reads them in the browser, fills what it can, deletes the files, and asks only for what is missing.

1. **Choose language, then upload.** The student uploads one or more PDFs, or taps "Fill manually" (always visible).
2. **Read in the browser.** Text is extracted with pdf.js; scanned files fall back to OCR (tesseract.js) with a progress bar. Encrypted e-Aadhaar PDFs ask for their password, which is never stored.
3. **Detect and parse.** Each file's type is detected from its keywords, then simple per-type rules pull out the fields.
4. **Delete animation.** The file shrinks and disappears with the message "Your PDF has been deleted. Nothing was stored." The deletion is real: file references are dropped and object URLs revoked.
5. **Ask only for the gaps.** A short form shows just the empty fields as dropdowns and chips ("We found your state and gender. Still needed: income and category").
6. **Review and confirm.** Every value carries a "From your PDF" tag and is editable; low-confidence values are highlighted.
7. **Save and scan.** The profile is saved locally and the radar opens (see Discover).

**What each document fills**

| Document | Fields extracted |
| --- | --- |
| e-Aadhaar PDF | Gender, age, state |
| Income certificate | Annual family income |
| Caste or category certificate | Category (SC, ST, OBC, EWS) |
| Marksheet or college ID | Course, level, marks %, year |

**Profile fields.** Required (five): education level, course, category, annual family income, state. Optional: gender, disability, minority community, last exam marks, year of study.

**Rules**

- The Aadhaar number is never read into the profile or stored.
- Everything runs in the browser; the profile lives in `localStorage` only, and can be edited or cleared from the Profile page.
- Each field says why it is asked ("Income helps us find need-based aid"); sensitive fields are optional where possible.
- Only the names of detected document types are kept, so the Apply stage can show "you already have this". No file content is kept.

**Risks.** Layouts differ by state and institution, so the review screen is mandatory, and the demo ships two or three sample PDFs behind a "Try a sample document" button.

## Data layer

The scholarship list is prepared once, before the app runs, and shipped as a static `scholarships.json`. No live scraping and no backend.

**Source and pipeline.** The seed is the public dataset `Navraj025/gov_myscheme` on Hugging Face (Apache-2.0), extracted from the government's myScheme site. It is a set of PDFs with copyable text, so the text is extracted offline and normalized by hand and with AI help.

1. Extract text and pick the scholarship schemes.
2. Normalize each into the schema below.
3. Add the manual layer: deadlines, which the dataset cannot be trusted for, and private scholarships such as Tata, Reliance and HDFC.
4. Validate required fields and dates, remove duplicates, and stamp `sourceUrl` and `lastVerified` on every entry.

**Coverage target: 30 to 40 schemes**, chosen for variety: all education levels, category-specific, girls-only, disability, open to all; income-capped and merit-based; central, state and private; deadlines spread over the next six months, including a few within seven days so urgency colors show.

**Trust rules.** The footer credits myScheme and says "Sample data from public sources. Verify on the official site before applying." The app never calls the data live or official.

**Scholarship record**

| Field | Purpose |
| --- | --- |
| `id`, `name`, `provider`, `type` | Identity; type is central, state or private |
| `amount`, `renewable`, `awards` | Key facts strip |
| `deadline` | Countdown and urgency colors |
| `rules` | Structured eligibility: levels, courses, categories, max income, states, gender, min marks |
| `documents[]` | Each with a name and a "how to get it" hint |
| `steps[]` | Application steps with estimated minutes |
| `summary` | Plain-language "what is it" and "how it works" text, pre-translated into two or three languages |
| `sourceUrl`, `lastVerified` | Trust and attribution |

**Student profile.** The five required and five optional fields from Onboarding, plus `language` and `documentsHeld[]` (names only).

**Application record.** `scholarshipId`, `status` (saved, in progress, submitted, under review, approved, rejected), `docsDone[]`, `stepsDone[]`, `appliedOn`, `resultOn`, `notes`, `updatedAt`. Stored in `localStorage`.

**Assumption to confirm.** Summaries are pre-translated for English, Hindi and Telugu; English is the fallback for anything missing.

## Discover

Discover opens with a radar scan that lands on a graph of the student's best matches; search and filters sit beside it. Search and ranking do the real work, and animation only supports them.

**Flow.** Profile saved, then a radar sweep of two to three seconds (skippable), then a counter ("You qualify for ₹4.2L across 11 scholarships"), then the score graph with a list toggle one tap away.

**Match engine.** One pure function: `(profile, scholarship)` returns `{ score, matched[], missing[], status }`.

- **Eligible:** every rule passes.
- **Almost there:** exactly one rule is missing and the student can fix it, such as a document or a marks cutoff. The UI shows a "close the gap" tip.
- **Not eligible:** a fixed attribute fails (category, state, level). Hidden behind a toggle.
- **Score:** the weighted share of rules passed, with level and course weighted highest. Every score is explainable ("92% because 5 of 5 core rules matched").

**Ranking.** One formula that can be explained to judges: rank = 0.50 × match score + 0.20 × text relevance + 0.20 × urgency (closing soon scores higher) + 0.10 × amount. With an empty search box the feed is "For you": match and urgency only.

**Search and filters**

- Fuzzy text search over name, provider, tags and summary (MiniSearch or Fuse.js, client-side), debounced at about 200 ms.
- Filters: level, course, category, provider type, amount, deadline window, "documents I already have". Counts show per filter and active filters appear as removable chips.
- Quick chips: closing this month, no income limit, girls, highest amount.
- Filters sync to the URL (`?q=engineering&cat=obc`) so searches are shareable and the back button works.
- A smart empty state suggests the nearest alternatives ("Remove 'income under 2L' to see 6 more").

**Radar and score graph**

| Signal | Meaning |
| --- | --- |
| Distance from center (the student) | Higher score sits closer. Rings mark 80%, 60% and 40% |
| Node size | Higher score is bigger, scaled by the square root of the score so area reads correctly, with a 44 px minimum for tapping |
| Color and border | Eligible is solid teal, Almost there is dashed amber, Not eligible is gray |

- One node is one scheme; rules are drawn on the detail page, not here.
- Show the top 15 to 20 nodes with "show more"; label only the largest, others on hover or tap.
- A fixed polar layout, not a force simulation, so nodes never jitter. The radar sweep reveals blips already placed on their rings.
- Clicking a node opens the detail panel (see Understand).
- On phones the ranked list is the default; the graph is a toggle. Screen readers get the list.

**Animation rules.** Under three seconds with a Skip button, instant under reduced-motion settings, and driven only by real engine output, never faked numbers.

## Understand

Clicking a node opens a detail panel (side panel on desktop, bottom sheet on mobile) so a student grasps a scheme in about ten seconds, in their own language, without losing the graph. "Full details" opens the full page, where Apply begins.

**Panel layout, top to bottom**

| # | Section | Content |
| --- | --- | --- |
| 1 | Header | Scheme name, provider, match badge, language switcher |
| 2 | Key facts strip | Amount, deadline countdown, renewable or not |
| 3 | What is it? | Two or three plain lines: who it is for and what it gives |
| 4 | Am I eligible? | Mini eligibility graph plus a checklist of matched and missing rules, with a "close the gap" tip |
| 5 | How it works | Four steps: apply, verification, approval, money in your bank account |
| 6 | Documents needed | Short list, marking which ones the student already has |
| 7 | Actions | Start application, Save, Official site |

**Eligibility graph.** Profile attributes are nodes on the left and the scheme is on the right. Solid teal edges are matched rules, dashed amber means one thing is missing, dashed gray means a rule failed. A text checklist sits beside it for screen readers. The "close the gap" tip names the fix and what else it unlocks ("An income certificate unlocks three more schemes").

**Language**

- The default is the device language; the switcher in the panel header changes it app-wide and is remembered.
- Structured facts (eligibility rules, amount, deadline, documents) are rendered from data through templates in each language, such as "Family income under ₹{amount}". Only the template changes, so numbers cannot be mistranslated.
- Explanations (what is it, how it works) are pre-translated per language and stored with the scheme.
- Scheme names, amounts, dates and links are never translated; the official English name appears beside the local one so the student can find it on the portal.
- A note in the panel says "Translated for your convenience. Verify on the official site."
- Stretch: a Listen button that reads the summary aloud with the browser's text-to-speech, for students with low reading confidence. Fonts must support Indian scripts and layouts must survive longer text.

## Apply

Apply turns a scheme's requirements into a personal application packet. Each document the student gets ready flies up as a page into the packet; when every page is in, the packet lifts off with "Ready to apply".

**The flow**

| Moment | What the student sees |
| --- | --- |
| Start application | An empty packet with one slot per required document, and a progress ring at zero |
| Tick a document | Its page flies up into the packet, the slot fills, the ring advances |
| Missing document | The slot stays empty, with a "how to get it" hint and an estimated time |
| All documents in | The pages stack and the packet lifts up: "Ready to apply" |
| Final step | "Open official portal", then "I've submitted" to confirm |

Below the packet, a journey graph runs Documents ready, Form filled, Submitted, Under review, Result. Completed nodes turn green and the current node is highlighted.

**Honest-by-design rules**

- Grantly cannot submit to the official portal. The lift-off means "your packet is ready", not "submitted". Only the student's "I've submitted" button moves the application to Submitted on the tracker.
- The pages are checklist items, not files. Because uploaded PDFs are deleted after reading, the packet holds document names only, and the animation never suggests files are stored.
- Documents detected during onboarding appear pre-filled with a "from your earlier upload" tag. A document ticked once counts for every application that needs it.

**Other Apply features**

- Numbered step guide in plain language, with an estimated time per step.
- "Official portal" link on the final step.
- The same language switcher as the detail panel.

**Animation rules.** Each page flight takes under one second and the lift-off about 1.5 seconds, and neither blocks tapping. Under reduced-motion settings the slot simply fills and the ring updates. The lift-off plays once, when the packet first becomes ready. A plain text checklist always sits underneath for screen readers and low-end phones. The ending is calm, with a short success message rather than confetti.

## Track

Track shows every application as one box on a date timeline: position is the date, size is match strength, and color plus an icon is the status. A "Today" line splits past applications on the left from upcoming deadlines on the right.

**Reading the graph**

| Signal | Meaning |
| --- | --- |
| Position, left to right | Date: applied date for past items, deadline for upcoming ones |
| Box size | Match strength. Bigger is a stronger match; same area-based scaling and minimum size as Discover |
| Connecting line | Links an application's stages (applied, under review, result) along the dates |
| Color and icon | Status, below |

| Status | Color | Also shown with |
| --- | --- | --- |
| Approved | Green | Check icon and the word "Approved" |
| Rejected | Red | Cross icon and the word "Rejected" |
| Under review | Amber | Clock icon |
| Submitted | Blue | Arrow icon |
| In progress or saved | Gray | Dashed border |

**Design checks**

- Size means match strength, not the odds of winning. There is no data on real selection odds, so the legend says "Match strength".
- Statuses are entered by the student, since Grantly cannot read the official portal. Each box links to "Check status on the official site", and a reminder asks "Applied 30 days ago. Any update?".
- Green here means a result, while in Discover it means eligible. Different shapes (rectangles here, circles there) and a legend on each screen keep them apart.
- Cap the view at about 12 boxes and group older ones under "Earlier".

**Supporting elements**

- Summary strip: total awarded (green), pending potential, approved versus rejected.
- Next Actions panel on top ("Upload income certificate, due in 3 days") answers "what now?".
- Clicking a box opens the same side panel as Understand, with a status control added.
- A rejected box offers "What next?" with similar schemes from Discover, which closes the loop back to the first stage.
- On phones the timeline becomes a vertical list with the same colors, icons and sizes. Deadlines within seven days are red and within thirty days amber, always with a text label.

## Screens, routes and components

Seven screens carry the four stages, and a persistent journey bar (top on desktop, bottom navigation on mobile) shows Discover, Understand, Apply and Track so the problem statement is visible in the interface.

| Route | Stage | Purpose | Key components |
| --- | --- | --- | --- |
| `/` | Intro | Pitch and "Find my scholarships" | Hero, privacy note |
| `/onboarding` | Discover | PDF upload, delete animation, missing-field form, review | UploadZone, DeleteAnimation, GapForm, ReviewList |
| `/discover` | Discover | Radar, score graph, list, search, filters | RadarIntro, ScoreGraph, SearchBar, FilterBar, ScholarshipCard, MatchBadge, FundingCounter |
| `/scholarship/:id` | Understand | Full details (also the side panel) | DetailPanel, KeyFactsStrip, EligibilityGraph, LanguageSwitcher |
| `/apply/:id` | Apply | Packet, checklist, steps, journey graph | PacketAnimation, ChecklistItem, JourneyGraph, ProgressRing |
| `/dashboard` | Track | Next actions, timeline, stats | NextActions, TrackTimeline, StatusLegend, DeadlineChip |
| `/profile` | Support | Edit details and watch matches change; clear data | ProfileForm, ClearDataButton |

**One continuous flow.** Onboarding leads to Discover, a node opens Understand, "Start application" opens Apply, and the dashboard shows Track. A rejection or an edited profile leads back to Discover with updated matches. Every screen ends with one clear next action.

**Shared building blocks.** A design system of colors, spacing and type tokens; empty, loading and error states on every list; and one `JourneyBar` used by all screens.

## Tech stack and architecture

Grantly is a client-only app: React with Vite, TypeScript and Tailwind, deployed to a static host such as Vercel. Next.js is not needed because the app has no server features.

&#91;embedded content: architecture · client-only, 1 offline step\]

Only the scheme file is prepared ahead of time. The highlighted match engine is a pure module that takes a profile and the scheme file, so it can be tested on its own; screens read its results and write statuses back to the local store.

**Libraries**

- React Router for the seven routes.
- Zustand (or React context) with `localStorage` persistence for profile, applications and language.
- MiniSearch or Fuse.js for fuzzy search.
- pdfjs-dist for PDF text, with tesseract.js as the OCR fallback.
- Graphs are hand-built SVG components for the score graph, eligibility graph, journey and timeline. A fixed layout is faster to make reliable than a graph library; React Flow remains an option for the eligibility graph if time allows.
- A small i18n helper for interface strings and eligibility templates, and lucide-react for icons.

**Suggested structure.** `src/data/scholarships.json`, `src/lib/match.ts`, `src/lib/rank.ts`, `src/lib/parsePdf.ts`, `src/store/`, `src/components/`, `src/pages/`.

## Accessibility, privacy and quality rules

These rules apply to every screen and score directly under the UI/UX and overall execution criteria.

**Accessibility**

- Color is never the only signal: every status and match state also has an icon, a text label, or a dashed versus solid line.
- Every graph (eligibility, radar, journey, timeline) has an equivalent plain list for screen readers and phones.
- Semantic HTML, visible focus states, keyboard navigation (arrow keys, Enter, Esc in search), sufficient contrast, and ARIA labels on controls.
- Search announces its result count ("12 results") in a live region.
- All animation respects reduced-motion settings and has a Skip control.
- Touch targets of at least 44 px, including the smallest graph nodes.

**Privacy**

- Documents are processed in the browser and discarded; nothing is uploaded.
- No login, and no Aadhaar number is ever stored. Profile and applications live in `localStorage` and can be cleared from the Profile page.
- Sensitive fields (category, income, disability) are optional where possible, with a reason shown beside each.

**Quality**

- Mobile-first layout, tested on a real phone against the deployed URL.
- Empty, loading and error states on every screen, including a friendly message when a PDF cannot be read.
- Heavy animation is limited and tested for lag on a phone.
- The footer states that the data is sample data from public sources to be verified on the official site.

## Six-hour build plan

The full design is larger than six hours, so build it in layers: finish a complete core journey first, then add extras in priority order until time runs out. Estimates assume AI-assisted coding.

| # | Block | Minutes | Layer |
| --- | --- | --- | --- |
| 1 | Scaffold (Vite, React, TypeScript, Tailwind, router, tokens) and a first deploy of the empty app | 15 | Core |
| 2 | Scholarship data file, match engine, store | 35 | Core |
| 3 | Manual onboarding form and review | 25 | Core |
| 4 | Discover list, search, filters, ranking | 40 | Core |
| 5 | Score graph (fixed polar SVG) with list toggle | 30 | Core |
| 6 | Detail panel with eligibility graph and key facts | 35 | Core |
| 7 | Apply checklist, steps, progress ring | 25 | Core |
| 8 | Track dashboard: next actions, statuses, stats | 25 | Core |
| 9 | Polish: responsive, accessibility, empty states | 25 | Core |
| 10 | Final deploy, README, sample documents, phone test | 25 | Core |
| 11 | Track timeline graph | 25 | Extra 1 |
| 12 | PDF autofill and delete animation (income certificate first) | 30 | Extra 2 |
| 13 | Radar sweep intro | 10 | Extra 3 |
| 14 | Language switcher, templates, two languages | 15 | Extra 4 |
| 15 | Packet animation and journey graph | 20 | Extra 5 |
|  | Protected buffer | 15 |  |

Core is 280 minutes. Extras 1 to 3 fit in the remaining time with the buffer; extras 4 and 5 sit below the cut line and are built only if the schedule holds. If the six hours started at 4:35 PM, about 25 minutes of design time is already used, so drop the radar sweep and shrink the buffer, and start coding now.

**Cut order if behind:** packet animation, language switcher, radar sweep, PDF autofill (ship the "Try a sample document" demo with one parser), timeline graph (keep the status list). Never cut the match engine, the eligibility graph, Next Actions, accessibility fallbacks, or the deployment.

**Working rules**

- Get the match engine and data working first; everything depends on them.
- Make the core flow work end to end before any animation.
- Test the deployed URL on a phone before submitting.

## Demo, risks and submission

**60-second demo story.** Meet Ravi, a B.Tech OBC student.

1. He uploads a sample income certificate; the PDF is read, then visibly deleted.
2. He answers the two missing questions, and the radar settles on a counter: "You qualify for ₹4.2L across 11 scholarships."
3. The score graph shows his strongest matches as the biggest nodes; he clicks one and reads it in his language.
4. The eligibility graph shows one amber gap; the tip says which document unlocks it.
5. He starts the application, ticks documents, and the packet fills.
6. The dashboard shows Next Actions and his applications on a timeline, with a result in green.

**Risks and mitigations**

| Risk | Mitigation |
| --- | --- |
| Real PDFs parse badly in the demo | Mandatory review screen, and a "Try a sample document" button with prepared files in the repo |
| Dataset text is messy or outdated | Hand-check the five or six schemes shown in the demo, and label all data as sample |
| Animation eats the schedule | Core first; animations only in the extras layer, each under three seconds |
| Graphs fail on small screens | List view is the mobile default, with the graph as a toggle |
| Translation errors in eligibility | Rules rendered from templates; only explanations are pre-translated |
| Links break during evaluation | Deploy early, redeploy only after testing, and keep the repo public |

**Submission checklist**

- [ ] Participant details and project name
- [ ] Brief description of the solution
- [ ] Public live deployment URL, tested on a phone
- [ ] Public source-code repository URL
- [ ] README with setup steps, the data source credit (myScheme) and the privacy notes
- [ ] Sample documents and the demo story in the repo
- [ ] Submitted before the deadline, with links left accessible during evaluation
