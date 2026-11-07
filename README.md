# Grantly

Grantly is a client-only scholarship navigator. Discover uses a fixed SVG radar and ranked list. The detail view explains individual rules. Apply keeps a reusable document checklist, and Track shows dates and statuses reported by the student.

## Run locally

Use Node 22 or later.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Deploy the Vite project to Vercel with `npm run build` and output directory `dist`. The included rewrite lets direct route visits and refreshes reach the React router.

## Try the demo

Open **Try the demo** to explore Ravi’s fictional matches and seeded applications. Select a radar node, open its eligibility explanation, prepare the checklist, and record a status. **Demo mode** switches between independent local workspaces. Reset the demo on the Profile page. Onboarding also offers an example income certificate.

## Data and privacy

The source-linked catalogue contains a small hand-curated set of partial public references from the Ministry of Education, Telangana ePASS and Reliance Foundation. India’s [myScheme](https://www.myscheme.gov.in/) and the [public myScheme dataset](https://huggingface.co/datasets/Navraj025/gov_myscheme) are discovery references. The app does not import the dataset or treat sample data as current application guidance. Each real listing links to its source and leaves the deadline unknown. The catalogue is below the brief’s 30–40 record target. Demo records, dates and amounts are fictional.

The browser stores profile fields, document type names and application updates in localStorage. PDF reading is limited to income certificates and the first four pages. Scanned pages use English OCR, which may download the OCR engine and language files. Selected PDFs and passwords are handled in memory and are never uploaded or saved in browser storage. Review suggested values before saving. Clear your local profile and application history from Profile.

The current build uses English. The radar, eligibility graph and timeline have text equivalents. Apply links to provider references and records status changes manually.

