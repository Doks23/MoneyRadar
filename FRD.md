# Functional Requirement Document (FRD) — MoneyRadar

## 1. Document Control
* **System Name:** MoneyRadar (Premium Financial Intelligence Platform)
* **Status:** Active (Retirement Planning Module Decommissioned)
* **Architecture:** Client-Side Single Page Application (SPA) with optional Server-Side/Client-Side GenAI proxies
* **Last Updated:** May 2026

---

## 2. Executive Summary & Purpose
**MoneyRadar** is a personal finance intelligence utility designed to aggregate, parse, reconcile, and visualize bank statements, credit card bills, and ledger documents. 

The application enables users to upload heterogeneous financial statement files (PDF, CSV, TSV, TXT, and scanned image formats), extracts and categorizes individual transaction entries, handles multi-statement merges, and displays spending trends. 

### Core Product Directives
1. **Absolute Data Privacy:** Financial information operates strictly inside the user's browser runtime. All parsed structures, categorization states, custom rules, and visualization frames are stored locally via React state and `localStorage`.
2. **Dual-Engine Parsing:** Leverage Gemini AI API structured extraction schemas, fallback-enabled by highly configurable client-side regex & fuzzy string similarity algorithms.
3. **Meticulous Data Integrity:** Provide robust transaction-level CRUD controls, manual adjustments, bulk editing interfaces, and automatic duplicate detection.
4. **Out of Scope (Explicit):** General wealth projections, investment modeling, and retirement corpus planning utilities have been completely decommissioned.

---

## 3. System Architecture & Workflow Pipeline
```
[User Statement File]
         │
         ▼
 ┌───────────────┐          Scanned / Static Raw Image
 │ File Upload  ├─────────────────────────────────────► [ Tesseract OCR Engine ]
 └───────┬───────┘                                                 │
         │ Text Layer Detected                                     ▼
         ▼                                                 [ Cleaned Text Stream ]
 ┌───────────────┐                                                 │
 │ PDF Decrypt   │◄────────────────────────────────────────────────┘
 │ Control Block │ (If password encrypted: triggers secure interactive challenge modal)
 └───────┬───────┘
         │ Decrypted Text / Image Payload
         ▼
 ┌──────────────────────────────────────────────┐
 │             Dual Parsing Engine              │
 ├──────────────────────┬───────────────────────┤
 │ 1. Structured GenAI  │ 2. Text/Fuzzy Parser  │
 │  (Gemini API with    │    (FuzzyCategor +    │
 │   Strict Schema)     │  Regex Heuristics)    │
 └──────────┬───────────┴───────────┬───────────┘
            │                       │
            ▼                       ▼
      ┌───────────────────────────────────┐
      │  Income & Expense Categorization  │
      ├───────────────────────────────────┤
      │   • Priority I: User Rule Map     │
      │   • Priority II: Merchant Pattern │
      │   • Priority III: Match Fallback  │
      └─────────────────┬─────────────────┘
                        │ Normalized Transaction State []
                        ▼
            ┌───────────────────────┐
            │   Information Views   │
            ├───────────────────────┤
            │  • Interactive Ledger │
            │  • Trend Graphs (SVG) │
            │  • Aggregated Stats   │
            │  • Export & Audits    │
            └───────────────────────┘
```

---


## 5. Functional Requirements Spec

### F-REQ-101: Interactive File Upload & Ingest Pipeline
* **Multiple Document Multi-Ingest:** The system must accept simultaneous uploads of PDF, CSV, TXT, and png/jpeg/jpg image files.
* **Interactive Decryption Prompt:** If an ingested PDF contains encryption flags, the application must immediately pause progress, invoke `/components/PasswordModal.tsx`, and prompt the user for the password. The system must attempt decryption in the browser and loop on failure with a clear error without crashing.
* **Tesseract OCR Scanning Fallback:** If a PDF document contains fewer than 10 lines of selectable text, the platform must flag it as an image-only container, run in-browser OCR via Tesseract.js, clean the text token strings, and map them into the parsed stream.
* **Dynamic Pipeline Progress Tracking:** Displays real-time status indicators ("Analyzing X of Y statements...") and appends logging histories (including processing durations, success outputs, and exact debit/credit item totals) to the run log.

### F-REQ-102: Dual-Mode Parsing Core
1. **GenAI Mode (Primary):**
   - Coordinates with `gemini-3.1-flash-lite-preview` or configured Gemini models.
   - Enforces a rigorous JSON response schema comprising total income, positive total expense, currency, bank naming, and individual transaction rows with keys: `[date, description, amount, category, bankName, currency, sourceFile]`.
   - Forces Gemini to output formatted date stamps (`YYYY-MM-DD`).
   - Automatically detects reversal or adjustment pairs (equal positive and negative amounts within brief dates) and categorizes them both as `Adjustment`.
2. **Rule-Based Mode (Deterministic Offline Fallback):**
   - Automatically triggers if user API keys are absent or if network issues prevent Gemini communication.
   - Uses `/utils/statementParser.ts` header patterns to identify transaction boundary beginnings.
   - Leverages localized Regex matching arrays to detect bank names, currencies, and floating debit/credit figures.

### F-REQ-103: Dynamic Rules Engine & Categorization Hierarchy
Categorization evaluates keywords on a continuous case-insensitive check. The evaluation precedence is as follows:
1. **Rule Level I - User Custom Priority Mapping:** Evaluates criteria specified in `/components/CategoryMapping.tsx`. If direct keyword match or regular expression bounds (e.g., `amazon|flipkart`) are satisfied, those assignments are applied immediately.
2. **Rule Level II - Default Dynamic Rules:** Applies pre-packaged keywords (e.g., `blinkit` mapping to `Groceries`, `swiggy` to `Dining`).
3. **Rule Level III - String Similarity (Levenshtein Distance):** Computes fuzzy match heuristics on previous description inputs. Matches with a score above 0.6 apply historical categories.
4. **Rule Level IV - Default Fallback:** Applies `Misc` for debit transactions and `Income` for credits.

### F-REQ-104: Comprehensive Transaction Ledger
* **Search and Category Filtering:** Real-time text-based search against description tags, combined with multi-category selects and custom timeframe inputs.
* **Ledger Entries CRUD:**
  - **Inline Editing:** Users can modify the transaction date, amount, description, bank, or category inline. When a category is modified, the system suggests saving it as a global automated custom rule.
  - **Custom Addition Modal:** Direct form inputs to inject manual cash, bank, or adjustment lines into the running transaction dataset.
  - **Bulk Actions:** Checkbox column to support mass deletion of selected records, or bulk reassignment of categories across selected items.
* **Deduplication Wizard:** Automatically detects identical transaction descriptions occurring on matching dates with matching amounts. Displays a modal breakdown asking the user to confirm duplicate purges.

### F-REQ-105: Dynamic Analytics and Trend Charts
* **Aggregate Highlight Cards:** Calculates and updates Total Income, Total Expenses, and Net Balance margins dynamically as files are adjusted, added, or deleted.
* **Pie Breakdown Visualization (Spend Mix):**
  - Renders category shares using the Recharts `PieChart` library.
  - Provides a filter toggle to group negligible categories (e.g., categories containing <2% of total slice) into an interactive `Other` category to prevent visual clutter.
  - Interactive slice tooltips displaying total sum, and total count.
* **Trend Analysis (Month-on-Month):**
  - A grouped `BarChart` projecting monthly spending trends categorized by name.
* **Context Preservation during Toggles:** View state changes, filters, and custom ranges must not trigger re-renders that reset the underlying loaded files or temporary rules.

### F-REQ-106: Data Management, Import & Export
* **JSON Rules Custom Matrix:** Allows users to export their custom mapping rules as standard `.csv` models and upload them back to easily migrate configurations.
* **Full Financial Statement Export:** Enables exporting the unified transaction database into formatted CSV or JSON spreadsheets at any time.

---

## 6. Core Database & Model Schemas

```typescript
export interface Transaction {
  id: string;                    // Universally Unique Identifier (UUID)
  date: string;                  // Standard Date Envelope: YYYY-MM-DD
  description: string;           // Cleansed string detailing payment parameters
  amount: number;                // Inflow positive (+), Outflow negative (-)
  category: string;              // Applied category (e.g. Shopping, Transport, Income)
  bankName: string;              // Extracted source financial institution
  currency: string;              // ISO code (defaults to 'INR')
  sourceFile: string;            // Original statement filename
  isManuallyEdited?: boolean;    // Flag indicating manual ledger override
}

export interface CategorizationRule {
  keyword: string;               // Keyword or RegExp pattern matched against description
  category: string;              // Category target bound to match
}

export interface AnalysisResult {
  totalIncome: number;           // Total summation of positive ledger lines
  totalExpenses: number;         // Positive representation of aggregate outflows
  netBalance: number;            // Derived margin: totalIncome - totalExpenses
  transactions: Transaction[];   // Chronological transaction sequence
  expensesByCategory: {          // Normalized aggregate category mappings
    category: string;
    amount: number;
  }[];
  monthlyExpensesByCategory: {   // Normalized aggregate monthly segments
    month: string;               // Segment ID prefix YYYY-MM
    expenses: {
      category: string;
      amount: number;
    }[];
  }[];
  bankNames: string[];           // Financial institutions verified in execution
  currency: string;              // Prevailing currency string Code
  statementCount: number;        // File ingest count
}

export interface AnalysisLogEntry {
  id: string;                    // Run UUID
  fileName: string;              // Upload identifier
  status: 'Success' | 'Error' | 'Skipped';
  totalTransactions: number;     // Extracted elements boundary
  creditCount: number;           // Incoming items identified
  creditAmount: number;          // Mass inbound credit volume
  debitCount: number;            // Outflow items identified
  debitAmount: number;           // Mass outbound debit volume
  startTime: Date;               // Ingestion timestamp
  endTime: Date;                 // Computation completion timestamp
  durationSeconds: number;       // Elapsed computation span
  message: string;               // Text string capture (success notes, failure traces)
}
```

---

## 7. Security and Privacy Boundaries
* **Browser Sandbox Boundary:** The application does not deploy external database calls or secondary telemetry logging. All operational workflows happen purely inside the user's active browser process. Heuristic data cannot transit back to any remote persistent hosts out of user control.
* **Gemini API Key Protection:** The Gemini API key inputted by the user is recorded directly into browser-encrypted `localStorage` key space (`gemini_api_key`).
* **Environment Configuration Integration:** If `process.env.GEMINI_API_KEY` exists inside the workspace configuration files, the application automatically mounts it without hardcoding secrets, keeping credentials safe.

---

## 8. Non-Functional Requirements & Performance Goals
* **Responsiveness Under Volume:** The transaction list must remain fully responsive and paginate smoothly with datasets containing up to 10,000 transactions.
* **Decoupled Render Pipeline:** Aggregations and SVG chart projection layers are memoized via `useMemo` hooks to avoid unnecessary re-computations or layout shifts during pagination or text searching.
* **Responsive Visual Framework:** Mobile layouts adapt automatically to touch environments, scaling tables into readable ledger cards and moving filtering rails below visualizations.
