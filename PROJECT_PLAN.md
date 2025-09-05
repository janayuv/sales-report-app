# Sale Report (Multi-Company) - Project Plan

## Project Overview

**Goal**: Desktop app to convert exported barcode sales reports (Excel) into Tally upload format and manage customers for two separate companies (Company A, Company B).

**Key Modules**: Company switch, Customer management, Report upload & parsing, Tally conversion engine (GST split rules), Dashboard & audit logs, Packaging & release, Tests & docs.

**Tech Stack**: React + Vite + TypeScript + Tauri + TailwindCSS + Shadcn UI + SQLite.

**UX Pattern**: Odoo-like list+form workflow. Company selector top-left. Company-scoped data. **Responsive design for multiple PC/laptop screen sizes with auto-adjustment.**

**Testing Tools**: Playwright MCP server for enhanced E2E testing, accessibility testing, and cross-platform validation.

## Global Rules

- **Company-scoped**: All CRUD + uploads + exports tied to selected company (A/B)
- **Excel format**: Both companies use same format. Uploaded file must be validated
- **Customer mapping**: Unmapped customer names flagged as "Missing customers" with inline match/add UI; block Tally generation until resolved
- **GST split rule**: For a given invoice_no, group rows by (invoice_no, gst_rate). If single gst_rate → one tally record. If multiple gst_rates → create one tally record per gst_rate and append suffixes to invoice_no for subsequent splits: original (no suffix), then A, B, C... Example: invoice 251 with rates 9% & 14% → 251 (9%) and 251A (14%). Preserve line totals; recalc grouped sums (CGST_AMT, SGST_AMT, IGST_AMT). Round monetary values to 2 decimals before grouping.
- **Responsive Design**: UI must auto-adjust for different screen sizes (laptop 13-15", desktop 21-27", multi-monitor setups). Use TailwindCSS responsive breakpoints and fluid layouts.
- **Cross-Platform Testing**: Use Playwright MCP server for comprehensive testing across Windows/macOS with different screen resolutions and device orientations.

## Database Schema

```sql
-- Companies(id, name, key)
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers(id, company_id, customer_name, tally_name, gst_no, category, created_at)
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    tally_name TEXT NOT NULL,
    gst_no TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, customer_name)
);

-- UploadedReports(id, company_id, filename, uploaded_at, status, parsed_hash)
CREATE TABLE uploaded_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'uploaded',
    parsed_hash TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- ReportRows(id, uploaded_report_id, invoice_no, invoice_date, customer_name_raw, gst_rate, cgst_amt, sgst_amt, igst_amt, total_amount, extra_json)
CREATE TABLE report_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploaded_report_id INTEGER NOT NULL,
    invoice_no TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    customer_name_raw TEXT NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    cgst_amt DECIMAL(10,2) NOT NULL,
    sgst_amt DECIMAL(10,2) NOT NULL,
    igst_amt DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    extra_json TEXT,
    FOREIGN KEY (uploaded_report_id) REFERENCES uploaded_reports(id)
);

-- TallyExports(id, company_id, uploaded_report_id, generated_at, file_path, notes)
CREATE TABLE tally_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    uploaded_report_id INTEGER NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (uploaded_report_id) REFERENCES uploaded_reports(id)
);

-- AuditLogs(id, company_id, user_action, details_json, timestamp)
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    user_action TEXT NOT NULL,
    details_json TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- InvoiceMappings(id, company_id, original_invoice_no, split_invoice_no, gst_rate, created_at)
CREATE TABLE invoice_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    original_invoice_no TEXT NOT NULL,
    split_invoice_no TEXT NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

## Sprint Plan

### Sprint 0 — Setup & Repo

#### Epic: Project Infrastructure
**Epic ID**: EPIC-001  
**Description**: Set up the foundational project structure and development environment

**Features**:
- **FEAT-001**: Project Skeleton Setup
  - **Tasks**:
    - TASK-001: Initialize Vite + React + TypeScript project
    - TASK-002: Add Tauri configuration and dependencies
    - TASK-003: Configure TailwindCSS and Shadcn UI
    - TASK-004: Set up SQLite with better-sqlite3
    - TASK-005: Configure TypeScript paths and build settings
    - TASK-005A: Set up responsive design foundation with TailwindCSS breakpoints
    - TASK-005B: Configure Playwright MCP server integration
  - **Acceptance Criteria**: `npm run dev` + Tauri dev run without runtime errors; responsive design breakpoints configured; Playwright MCP server accessible
  - **Priority**: P0
  - **Estimate**: 10 hours

- **FEAT-002**: Development Tools & Quality
  - **Tasks**:
    - TASK-006: Add ESLint configuration
    - TASK-007: Add Prettier configuration
    - TASK-008: Create comprehensive README.md
    - TASK-009: Add development scripts (dev, build, test, lint)
    - TASK-010: Set up Git hooks with husky
    - TASK-010A: Configure Playwright MCP server testing scripts
  - **Acceptance Criteria**: All dev tools configured and working; Playwright MCP server testing available
  - **Priority**: P1
  - **Estimate**: 5 hours

### Sprint 1 — DB & Core Models

#### Epic: Database Layer
**Epic ID**: EPIC-002  
**Description**: Design and implement the database layer with all core models

**Features**:
- **FEAT-003**: Database Schema Design
  - **Tasks**:
    - TASK-011: Design SQLite schema for all tables
    - TASK-012: Create database migration system
    - TASK-013: Implement database initialization
    - TASK-014: Add database connection management
    - TASK-015: Create database utilities and helpers
  - **Acceptance Criteria**: DB initializes, seeds Company A + B, sample supplier present
  - **Priority**: P0
  - **Estimate**: 12 hours

- **FEAT-004**: Core Models Implementation
  - **Tasks**:
    - TASK-016: Implement Company model with CRUD operations
    - TASK-017: Implement Supplier model with company-scoped operations
    - TASK-018: Implement UploadedReport model
    - TASK-019: Implement ReportRow model
    - TASK-020: Implement TallyExport model
    - TASK-021: Implement AuditLog model
  - **Acceptance Criteria**: All models can be created, read, updated, deleted
  - **Priority**: P0
  - **Estimate**: 16 hours

### Sprint 2 — App Shell & Company Switch

#### Epic: Application Shell
**Epic ID**: EPIC-003  
**Description**: Create the main application shell with company switching functionality

**Features**:
- **FEAT-005**: App Shell & Navigation
  - **Tasks**:
    - TASK-022: Create AppShell component with layout
    - TASK-023: Implement CompanySelector component (persisted)
    - TASK-024: Create left navigation menu (Dashboard, Suppliers, Reports, Audit, Settings)
    - TASK-025: Implement global company context provider
    - TASK-026: Add routing system with React Router
    - TASK-026A: Implement responsive navigation that adapts to screen size
    - TASK-026B: Add collapsible sidebar for smaller screens
  - **Acceptance Criteria**: Switching company loads company-specific data; UI adapts to different screen sizes (laptop/desktop/multi-monitor)
  - **Priority**: P0
  - **Estimate**: 20 hours

- **FEAT-006**: Company Context & State Management
  - **Tasks**:
    - TASK-027: Implement company context with React Context API
    - TASK-028: Add company persistence in localStorage
    - TASK-029: Create company data loading utilities
    - TASK-030: Add company switching animations and feedback
    - TASK-030A: Ensure responsive state management for different screen sizes
  - **Acceptance Criteria**: Company selection persists across app restarts; state management works across different screen sizes
  - **Priority**: P1
  - **Estimate**: 10 hours

### Sprint 3 — Customers Module

#### Epic: Customer Management
**Epic ID**: EPIC-004  
**Description**: Complete customer management system with CRUD operations

**Features**:
- **FEAT-007**: Customers List View
  - **Tasks**:
    - TASK-031: Create CustomersList component with TanStack Table
    - TASK-032: Add columns: customer_name, tally_name, gst_no, category, matched_flag
    - TASK-033: Implement sorting and filtering
    - TASK-034: Add bulk actions (delete, export)
    - TASK-035: Implement pagination
    - TASK-035A: Make table responsive with horizontal scrolling on smaller screens
    - TASK-035B: Add card view option for mobile/tablet layouts
  - **Acceptance Criteria**: Full CRUD per company; table adapts to screen size with responsive design
  - **Priority**: P0
  - **Estimate**: 16 hours

- **FEAT-008**: Customer Form & Validation
  - **Tasks**:
    - TASK-036: Create CustomerForm component with React Hook Form
    - TASK-037: Add Zod validation schema
    - TASK-038: Implement form submission and error handling
    - TASK-039: Add form field validation and error messages
    - TASK-040: Create customer edit modal/dialog
    - TASK-040A: Make form responsive with stacked layout on smaller screens
    - TASK-040B: Add touch-friendly form controls for laptop screens
  - **Acceptance Criteria**: Form validates and saves customer data correctly; responsive design works on all screen sizes
  - **Priority**: P0
  - **Estimate**: 14 hours

- **FEAT-009**: Customer Import/Export
  - **Tasks**:
    - TASK-041: Implement CSV import functionality
    - TASK-042: Add CSV export functionality
    - TASK-043: Create bulk match UI for missing customers
    - TASK-044: Add import validation and error handling
    - TASK-045: Implement duplicate detection during import
    - TASK-045A: Make import/export UI responsive for different screen sizes
  - **Acceptance Criteria**: Can import/export customer data in CSV format; UI adapts to screen size
  - **Priority**: P1
  - **Estimate**: 14 hours

### Sprint 4 — Report Upload & Parse

#### Epic: Report Processing
**Epic ID**: EPIC-005  
**Description**: Excel report upload, parsing, and validation system

**Features**:
- **FEAT-010**: Report Upload Interface
  - **Tasks**:
    - TASK-046: Create ReportUpload component with drag-and-drop
    - TASK-047: Add file type validation (.xls/.xlsx)
    - TASK-048: Implement upload progress indicator
    - TASK-049: Add file size validation
    - TASK-050: Create upload error handling and user feedback
    - TASK-050A: Make upload area responsive for different screen sizes
    - TASK-050B: Add touch-friendly upload controls for laptop screens
  - **Acceptance Criteria**: Can upload Excel files with proper validation; responsive design works on all devices
  - **Priority**: P0
  - **Estimate**: 12 hours

- **FEAT-011**: Excel Parser & Validation
  - **Tasks**:
    - TASK-051: Implement excelParser.ts utility
    - TASK-052: Add schema validation for Excel format
    - TASK-053: Parse Excel to ReportRows model
    - TASK-054: Handle parsing errors and edge cases
    - TASK-055: Add data normalization and cleaning
  - **Acceptance Criteria**: Parsed preview displays rows; missing suppliers detected
  - **Priority**: P0
  - **Estimate**: 16 hours

- **FEAT-012**: Report Preview & Missing Customers
  - **Tasks**:
    - TASK-056: Create ReportPreview component
    - TASK-057: Display parsed rows in table format
    - TASK-058: Show missing customers list with inline match/add UI
    - TASK-059: Implement customer matching suggestions
    - TASK-060: Add data editing capabilities for parsed rows
    - TASK-060A: Make preview table responsive with horizontal scrolling
    - TASK-060B: Add compact view option for smaller screens
  - **Acceptance Criteria**: Missing customers detected and actionable; responsive design adapts to screen size
  - **Priority**: P0
  - **Estimate**: 16 hours

### Sprint 5 — Tally Conversion Engine

#### Epic: Tally Export System
**Epic ID**: EPIC-006  
**Description**: GST split rules and Tally CSV generation engine

**Features**:
- **FEAT-013**: Tally Conversion Engine
  - **Tasks**:
    - TASK-061: Implement tallyConverter.ts utility
    - TASK-062: Group by invoice_no & gst_rate
    - TASK-063: Apply splitting rules and suffixes (A/B/C...)
    - TASK-064: Sum CGST/SGST/IGST per split
    - TASK-065: Generate Tally CSV matching sample format
  - **Acceptance Criteria**: CSV matches sample; GST split logic covered in unit tests
  - **Priority**: P0
  - **Estimate**: 20 hours

- **FEAT-014**: Conversion Validation & Blocking
  - **Tasks**:
    - TASK-066: Block generation if unmapped customers remain
    - TASK-067: Add conversion validation rules
    - TASK-068: Implement error reporting for conversion issues
    - TASK-069: Create conversion status tracking
  - **Acceptance Criteria**: Cannot generate Tally CSV with unmapped customers
  - **Priority**: P0
  - **Estimate**: 8 hours

- **FEAT-015**: Preview & Download
  - **Tasks**:
    - TASK-070: Create Tally preview component
    - TASK-071: Add CSV download functionality
    - TASK-072: Implement file naming conventions
    - TASK-073: Add export history tracking
    - TASK-073A: Make preview responsive for different screen sizes
    - TASK-073B: Add touch-friendly download controls
  - **Acceptance Criteria**: Can preview and download generated Tally CSV; responsive design works on all devices
  - **Priority**: P1
  - **Estimate**: 12 hours

### Sprint 6 — Dashboard, Audit & Reports

#### Epic: Analytics & Monitoring
**Epic ID**: EPIC-007  
**Description**: Dashboard, audit logging, and reporting system

**Features**:
- **FEAT-016**: Dashboard Cards
  - **Tasks**:
    - TASK-074: Create Dashboard component with cards
    - TASK-075: Add recent uploads card
    - TASK-076: Add conversions card
    - TASK-077: Add missing suppliers card
    - TASK-078: Implement real-time data updates
    - TASK-078A: Make dashboard cards responsive with grid layout
    - TASK-078B: Add compact view for smaller screens
  - **Acceptance Criteria**: Dashboard displays key metrics and recent activity; responsive grid adapts to screen size
  - **Priority**: P1
  - **Estimate**: 16 hours

- **FEAT-017**: Audit Logging System
  - **Tasks**:
    - TASK-079: Implement audit logging for all actions
    - TASK-080: Create AuditList component
    - TASK-081: Add audit log filtering and search
    - TASK-082: Implement audit export functionality
    - TASK-083: Add audit log retention policies
    - TASK-083A: Make audit list responsive with horizontal scrolling
  - **Acceptance Criteria**: Actions recorded with timestamps and details; responsive design works on all screen sizes
  - **Priority**: P1
  - **Estimate**: 18 hours

- **FEAT-018**: Reports & Analytics
  - **Tasks**:
    - TASK-084: Create reports generation system
    - TASK-085: Add conversion success rate tracking
    - TASK-086: Implement supplier mapping analytics
    - TASK-087: Add data export capabilities
    - TASK-087A: Make reports responsive for different screen sizes
  - **Acceptance Criteria**: Can generate and export various reports; responsive design adapts to screen size
  - **Priority**: P2
  - **Estimate**: 14 hours

### Sprint 7 — Packaging, Tests & CI

#### Epic: Quality Assurance & Deployment
**Epic ID**: EPIC-008  
**Description**: Testing, packaging, and continuous integration

**Features**:
- **FEAT-019**: Tauri Packaging
  - **Tasks**:
    - TASK-088: Configure Tauri packaging for Windows
    - TASK-089: Configure Tauri packaging for macOS
    - TASK-090: Add installer generation
    - TASK-091: Implement auto-update system
    - TASK-092: Add code signing configuration
  - **Acceptance Criteria**: Build produces installer
  - **Priority**: P0
  - **Estimate**: 16 hours

- **FEAT-020**: Unit Testing
  - **Tasks**:
    - TASK-093: Set up Jest testing framework
    - TASK-094: Write unit tests for tallyConverter.ts
    - TASK-095: Test conversion and parser edge cases
    - TASK-096: Add model and utility tests
    - TASK-097: Implement test coverage reporting
  - **Acceptance Criteria**: Unit tests cover critical business logic
  - **Priority**: P0
  - **Estimate**: 20 hours

- **FEAT-021**: E2E Testing with Playwright MCP
  - **Tasks**:
    - TASK-098: Set up Playwright for E2E testing
    - TASK-099: Create E2E tests for upload→map→generate flow
    - TASK-100: Add company switching tests
    - TASK-101: Test supplier management workflows
    - TASK-102: Add cross-platform testing
    - TASK-102A: Use Playwright MCP server for enhanced E2E testing
    - TASK-102B: Test responsive design across different screen sizes
    - TASK-102C: Add accessibility testing with Playwright MCP tools
    - TASK-102D: Test performance with Playwright MCP performance tools
  - **Acceptance Criteria**: E2E tests cover main user workflows; responsive design tested across screen sizes; accessibility and performance validated
  - **Priority**: P1
  - **Estimate**: 24 hours

- **FEAT-022**: CI/CD Pipeline
  - **Tasks**:
    - TASK-103: Set up GitHub Actions workflow
    - TASK-104: Configure automated testing
    - TASK-105: Add automated building
    - TASK-106: Implement release automation
    - TASK-107: Add quality gates and checks
    - TASK-107A: Integrate Playwright MCP server in CI pipeline
    - TASK-107B: Add responsive design testing in CI
  - **Acceptance Criteria**: CI passes; Playwright MCP server integrated; responsive design validated in CI
  - **Priority**: P1
  - **Estimate**: 16 hours

### Sprint 8 — Improvements & Hardening

#### Epic: Improvements & Hardening
**Epic ID**: EPIC-009  
**Description**: Add missing quality gates, security, performance, usability and release improvements to the base plan

**Features**:

**Documentation & Onboarding**:
- **FEAT-023**: Runbook & Release Playbook
  - **Tasks**:
    - TASK-108: Create comprehensive runbook covering dev→QA→release→rollback
    - TASK-109: Document packaging steps and installer signing
    - TASK-110: Add auto-update release publishing instructions
    - TASK-111: Create dry-run release validation process
  - **Acceptance Criteria**: Runbook includes step-by-step packaging commands, signing instructions, and rollback steps; validated by performing a dry-run release
  - **Labels**: doc, infra
  - **Priority**: P0
  - **Estimate**: 6 hours

- **FEAT-024**: Developer Onboarding & Environment Matrix
  - **Tasks**:
    - TASK-112: Document setup steps for Windows/macOS
    - TASK-113: Add Tauri prerequisites and Node version requirements
    - TASK-114: Create troubleshooting guide
    - TASK-115: Add environment validation scripts
  - **Acceptance Criteria**: New dev can start app and run tests following the doc with no further help
  - **Labels**: doc
  - **Priority**: P1
  - **Estimate**: 4 hours

- **FEAT-025**: Sample Excel Files & Test Vectors
  - **Tasks**:
    - TASK-116: Create minimal sample spreadsheet files for Company A/B
    - TASK-117: Add full and edge-case sample files
    - TASK-118: Generate expected Tally outputs for each sample
    - TASK-119: Create unit-test fixtures
  - **Acceptance Criteria**: CI uses these samples in unit/e2e tests
  - **Labels**: doc, qa
  - **Priority**: P0
  - **Estimate**: 4 hours

**Technical & Architecture**:
- **FEAT-026**: Data Backup & Restore
  - **Tasks**:
    - TASK-120: Add UI for manual DB export/import
    - TASK-121: Implement DB backup scheduling guidance
    - TASK-122: Create backup validation and restore process
    - TASK-123: Add backup encryption options
  - **Acceptance Criteria**: User can export DB file and import to restore state; test restores sample dataset
  - **Labels**: feature, infra
  - **Priority**: P0
  - **Estimate**: 8 hours

- **FEAT-027**: Encrypted DB at Rest
  - **Tasks**:
    - TASK-124: Implement optional DB encryption with password
    - TASK-125: Add encryption toggle in settings
    - TASK-126: Create encryption key management
    - TASK-127: Document encryption process and limitations
  - **Acceptance Criteria**: DB encryption toggle is available; encrypted DB cannot be opened without password; documented
  - **Labels**: security, feature
  - **Priority**: P1
  - **Estimate**: 12 hours

- **FEAT-028**: File Streaming Parser for Large Excel Files
  - **Tasks**:
    - TASK-128: Implement streaming Excel parser
    - TASK-129: Add memory usage monitoring
    - TASK-130: Create progress indicators for large files
    - TASK-131: Add performance metrics collection
  - **Acceptance Criteria**: 50k-row test file parses without >1GB memory and UI remains responsive; performance metrics recorded
  - **Labels**: feature, perf
  - **Priority**: P1
  - **Estimate**: 12 hours

- **FEAT-029**: Supplier Fuzzy-Matching & Suggested Mapping
  - **Tasks**:
    - TASK-132: Implement 3-tier matching: exact → canonicalized → fuzzy
    - TASK-133: Add Levenshtein/token similarity algorithms
    - TASK-134: Create confidence score calculation
    - TASK-135: Add "apply suggestion" UI functionality
  - **Acceptance Criteria**: Matching suggestions cover >95% of known variations in test dataset; UI exposes "apply suggestion"
  - **Labels**: feature, qa
  - **Priority**: P0
  - **Estimate**: 10 hours

**Security & Compliance**:
- **FEAT-030**: Dependency Scanning & SCA
  - **Tasks**:
    - TASK-136: Add GitHub Actions job for `npm audit`
    - TASK-137: Implement dependency scanning
    - TASK-138: Add vulnerability notification system
    - TASK-139: Create dependency upgrade documentation
  - **Acceptance Criteria**: CI fails or flags PR on critical vulnerabilities; documentation for upgrade process included
  - **Labels**: security, infra
  - **Priority**: P0
  - **Estimate**: 4 hours

- **FEAT-031**: Secrets Management & CI Best Practices
  - **Tasks**:
    - TASK-140: Document signing keys storage
    - TASK-141: Add auto-update tokens management
    - TASK-142: Implement encrypted secrets in GitHub Actions
    - TASK-143: Create verification steps documentation
  - **Acceptance Criteria**: Keys removed from repo; CI uses stored secrets; verification steps documented
  - **Labels**: security, infra
  - **Priority**: P0
  - **Estimate**: 3 hours

- **FEAT-032**: Data Retention & GDPR-like Guidance
  - **Tasks**:
    - TASK-144: Document retention policy for financial data
    - TASK-145: Add backup retention guidelines
    - TASK-146: Implement "Purge old uploads > X days" UI
    - TASK-147: Create retention rules documentation
  - **Acceptance Criteria**: UI includes "Purge old uploads > X days" and doc explains retention rules
  - **Labels**: doc, security
  - **Priority**: P2
  - **Estimate**: 3 hours

**Testing & QA**:
- **FEAT-033**: Unit Test Coverage Threshold (Conversion Logic)
  - **Tasks**:
    - TASK-148: Add Jest job for >90% coverage enforcement
    - TASK-149: Ensure coverage for `tallyConverter.ts` and `excelParser.ts`
    - TASK-150: Add tests for split logic, rounding, and edge cases
    - TASK-151: Implement coverage reporting in CI
  - **Acceptance Criteria**: CI enforces coverage threshold; tests for split logic, rounding, and edge cases exist
  - **Labels**: qa, infra
  - **Priority**: P0
  - **Estimate**: 6 hours

- **FEAT-034**: E2E Test Matrix & CI Gating with Playwright MCP
  - **Tasks**:
    - TASK-152: Add Playwright E2E tests for Company A and B
    - TASK-153: Create upload → map → generate flow tests
    - TASK-154: Add failing-case test (missing supplier)
    - TASK-155: Implement CI gating for E2E tests
    - TASK-155A: Use Playwright MCP server for enhanced E2E testing
    - TASK-155B: Test responsive design across multiple screen sizes
    - TASK-155C: Add accessibility testing with Playwright MCP tools
    - TASK-155D: Test performance with Playwright MCP performance tools
  - **Acceptance Criteria**: CI runs E2E and must pass before merge to main; failing-case verified; responsive design and accessibility tested across screen sizes
  - **Labels**: qa
  - **Priority**: P0
  - **Estimate**: 18 hours

- **FEAT-035**: Performance Tests & Metric Targets
  - **Tasks**:
    - TASK-156: Add benchmarks for parsing speed (1k/10k/50k rows)
    - TASK-157: Implement memory usage benchmarks
    - TASK-158: Add perf checks in CI (optional job)
    - TASK-159: Create baseline results storage
    - TASK-159A: Use Playwright MCP performance testing tools
  - **Acceptance Criteria**: Documented target (e.g., parse 10k rows < 10s); run locally and store baseline results; performance tested across different screen sizes
  - **Labels**: qa, perf
  - **Priority**: P2
  - **Estimate**: 8 hours

**UX & Accessibility**:
- **FEAT-036**: Conflict Resolution UI for Supplier Mapping
  - **Tasks**:
    - TASK-160: Create compact modal for ambiguous matches
    - TASK-161: Add side-by-side previews
    - TASK-162: Implement "apply to all similar" functionality
    - TASK-163: Add bulk resolution workflow
    - TASK-163A: Make modal responsive for different screen sizes
  - **Acceptance Criteria**: Users can resolve bulk ambiguous names in under 2 minutes for 100 names; responsive design works on all screen sizes
  - **Labels**: feature, ux
  - **Priority**: P1
  - **Estimate**: 10 hours

- **FEAT-037**: WCAG 2.1 AA Baseline with Playwright MCP
  - **Tasks**:
    - TASK-164: Ensure keyboard navigation
    - TASK-165: Add ARIA attributes on forms
    - TASK-166: Implement color contrast checks
    - TASK-167: Add screen-reader compatibility for key flows
    - TASK-167A: Use Playwright MCP accessibility testing tools
    - TASK-167B: Test accessibility across different screen sizes
  - **Acceptance Criteria**: Accessibility audit pass for core pages with no critical issues; accessibility tested across all screen sizes
  - **Labels**: ux, qa
  - **Priority**: P1
  - **Estimate**: 14 hours

**Data & Business Rules**:
- **FEAT-038**: Configurable Suffix Strategy & Auditability
  - **Tasks**:
    - TASK-168: Make invoice-suffix strategy configurable (A/B/C or numeric -2, -3)
    - TASK-169: Store original→split mappings in DB for traceability
    - TASK-170: Add admin configuration UI
    - TASK-171: Include original mapping in exports
  - **Acceptance Criteria**: Admin can change suffix pattern; mapping table exists; export includes original mapping
  - **Labels**: feature, infra
  - **Priority**: P1
  - **Estimate**: 6 hours

- **FEAT-039**: Negative/Zero Tax Rows & Returns
  - **Tasks**:
    - TASK-172: Add rules to detect returns/credit notes
    - TASK-173: Implement negative tax row handling
    - TASK-174: Create separate CSV section for returns
    - TASK-175: Add distinct indicators per Tally format
  - **Acceptance Criteria**: Return rows flagged and exported to separate CSV section or with distinct indicator per Tally format
  - **Labels**: feature, qa
  - **Priority**: P1
  - **Estimate**: 6 hours

**Operations & Release**:
- **FEAT-040**: Staging Channel + Release Channel Strategy
  - **Tasks**:
    - TASK-176: Add staging (internal) and production releases
    - TASK-177: Implement different auto-update channels
    - TASK-178: Document release gating process
    - TASK-179: Add staging verification workflow
  - **Acceptance Criteria**: Staging build published to internal channel and verified before promoting to production
  - **Labels**: infra
  - **Priority**: P0
  - **Estimate**: 6 hours

- **FEAT-041**: Installer Signing & Notarization (macOS)
  - **Tasks**:
    - TASK-180: Document code-signing for Windows
    - TASK-181: Add macOS notarization automation
    - TASK-182: Implement CI steps for signing
    - TASK-183: Document secrets handling for signing keys
  - **Acceptance Criteria**: Installer signed and macOS notarization passes; documented secrets handling for signing keys
  - **Labels**: infra, security
  - **Priority**: P0
  - **Estimate**: 10 hours

**Observability & Support**:
- **FEAT-042**: Local Activity Logs & Support Export
  - **Tasks**:
    - TASK-184: Add "Export troubleshooting bundle" functionality
    - TASK-185: Include DB snapshot metadata and recent logs
    - TASK-186: Add last uploaded sample file (user opt-in)
    - TASK-187: Implement size capping and user permission
  - **Acceptance Criteria**: Support bundle can be generated and redacted; size capped and user permission required
  - **Labels**: infra, ux
  - **Priority**: P1
  - **Estimate**: 5 hours

- **FEAT-043**: Analytics (Opt-in) Usage Telemetry for Core Flows
  - **Tasks**:
    - TASK-188: Add opt-in telemetry for anonymous metrics
    - TASK-189: Track uploads processed, conversions, failure rate
    - TASK-190: Create privacy policy documentation
    - TASK-191: Build sample dashboard for product team
  - **Acceptance Criteria**: Telemetry is opt-in, anonymized, and documented with privacy policy; sample dashboard created for product team
  - **Labels**: infra, product
  - **Priority**: P2
  - **Estimate**: 6 hours

**Project Management**:
- **FEAT-044**: Definition of Done (DoD) to README
  - **Tasks**:
    - TASK-192: Define DoD for tasks (tests, docs, type coverage, PR description)
    - TASK-193: Create PR template with DoD checklist
    - TASK-194: Add maintainer confirmation process
    - TASK-195: Document DoD enforcement
  - **Acceptance Criteria**: PR template enforces DoD checklist; maintainers confirm adherence
  - **Labels**: process, doc
  - **Priority**: P0
  - **Estimate**: 2 hours

- **FEAT-045**: Release Checklist in GitHub
  - **Tasks**:
    - TASK-196: Create release checklist (test pass, signed artifacts, CHANGELOG updated, release notes)
    - TASK-197: Add checklist to GitHub repository
    - TASK-198: Document checklist usage process
    - TASK-199: Add checklist validation steps
  - **Acceptance Criteria**: Checklist is available and used for each release
  - **Labels**: process
  - **Priority**: P0
  - **Estimate**: 2 hours

## Acceptance Criteria Examples

### Upload & Parse Flow
- Upload sample file → parsed preview + missing suppliers list (unique supplier names)
- File validation rejects invalid formats with clear error messages
- Parsed data displays in organized table with editable fields
- **UI adapts to different screen sizes (laptop 13-15", desktop 21-27", multi-monitor)**

### Supplier Mapping
- Map suppliers → generate Tally CSV with correctly aggregated CGST/SGST/IGST
- Missing suppliers flagged with inline match/add UI
- Bulk supplier import/export functionality works correctly
- **Responsive design works on all screen sizes with appropriate layouts**

### GST Split Logic
- Invoice with multiple GST rates → outputs invoice, invoiceA (or invoiceB) rows with correct sums
- No data loss during conversion
- Rounding to 2 decimals applied correctly
- Suffix generation follows A, B, C... pattern

### Company Data Isolation
- Supplier in Company A does not affect Company B
- All data operations respect company context
- Company switching loads appropriate data

### Responsive Design Requirements
- **Laptop screens (13-15")**: Compact layouts, collapsible sidebar, horizontal scrolling for tables
- **Desktop screens (21-27")**: Full layouts, expanded sidebar, multi-column displays
- **Multi-monitor setups**: Adaptive layouts that utilize available screen real estate
- **Touch-friendly controls**: Larger buttons and touch targets for laptop screens
- **Fluid typography**: Text scales appropriately with screen size

## Components & Utilities

### Core Components
- `CompanySelector`: Company switching with persistence
- `AppShell`: Main application layout with responsive design
- `SuppliersList`: Supplier management table with responsive table/card views
- `SupplierForm`: Supplier creation/editing form with responsive layout
- `ReportUpload`: File upload interface with responsive design
- `ReportPreview`: Parsed data preview with responsive table
- `TallyGenerator`: CSV generation interface
- `AuditList`: Audit log display with responsive design
- `DashboardCards`: Key metrics display with responsive grid

### Utilities
- `excelParser.ts`: Excel parsing and validation
- `supplierMatcher.ts`: Fuzzy/exact supplier matching
- `tallyConverter.ts`: GST grouping and CSV generation
- `database.ts`: Database connection and utilities
- `validation.ts`: Zod schemas and validation
- `responsiveUtils.ts`: Screen size detection and responsive helpers

### Key Libraries
- `xlsx/exceljs`: Excel file processing
- `papaparse`: CSV parsing and generation
- `better-sqlite3`: Database operations
- `zod + react-hook-form`: Form validation
- `tanstack-table`: Data table management with responsive features
- `playwright`: E2E testing with MCP server integration

## Edge Cases & Rules

### Invoice Suffix Logic
- Original invoice keeps original number
- Subsequent splits get A, B, C... suffixes
- Maintain mapping table to avoid collisions across uploads
- Handle edge cases with existing suffixes

### Rounding Rules
- Round to 2 decimals before grouping
- Document rounding choice in user manual
- Ensure consistency across all monetary calculations

### Data Validation
- Flag missing required fields in preview
- Allow inline editing of parsed data
- Validate GST rates and amounts
- Handle partial or corrupted data gracefully

### Company Isolation
- Mappings do not cross company boundaries
- All operations respect company context
- Data export/import scoped to selected company

### Responsive Design Rules
- **Breakpoints**: Use TailwindCSS breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Fluid layouts**: Use flexbox and grid for responsive layouts
- **Touch targets**: Minimum 44px for touch-friendly controls
- **Typography**: Use responsive text sizing (text-sm on mobile, text-base on desktop)
- **Tables**: Horizontal scrolling on smaller screens, card view option
- **Forms**: Stacked layout on mobile, side-by-side on desktop

## QA & Testing Strategy

### Unit Tests Coverage
- `tallyConverter.ts` covering:
  - Single-rate invoices
  - Multi-rate invoices requiring splits and suffixes
  - Rounding/precision edge cases
  - Missing supplier blocking
- Database operations and models
- Validation utilities
- Excel parsing edge cases

### E2E Test Scenarios with Playwright MCP
- Complete upload → map suppliers → generate CSV flow
- Company switching and data isolation
- Supplier management workflows
- Error handling and validation
- Cross-platform compatibility
- **Responsive design testing across different screen sizes**
- **Accessibility testing with Playwright MCP tools**
- **Performance testing with Playwright MCP performance tools**

### Performance Testing
- Large file upload and processing
- Database query performance
- Memory usage optimization
- Startup time optimization
- **Responsive design performance across different screen sizes**

### Playwright MCP Server Integration
- **Enhanced E2E Testing**: Use Playwright MCP server for comprehensive testing
- **Accessibility Testing**: Automated accessibility checks with axe-core
- **Performance Testing**: Lighthouse performance audits
- **Cross-Platform Testing**: Test on Windows and macOS with different screen resolutions
- **Responsive Design Testing**: Test UI adaptation across screen sizes
- **Security Testing**: Automated security audits
- **Code Quality**: ESLint and TypeScript checks
- **Docker Testing**: Container-based testing for consistency

## Deliverables

### Working Application
- Desktop app (dev build + packaged installer)
- Cross-platform compatibility (Windows/macOS)
- Complete user workflow implementation
- **Responsive design that works on all screen sizes**

### Documentation
- README with setup instructions
- Contributor guide with development setup
- User manual with workflow examples
- API documentation for utilities
- **Responsive design guidelines and best practices**

### Quality Assurance
- Unit test suite with >90% coverage
- E2E test suite covering main workflows with Playwright MCP
- CI/CD pipeline with automated testing
- Performance benchmarks
- **Responsive design testing across screen sizes**
- **Accessibility testing with Playwright MCP tools**

### Deployment
- Windows installer (.msi/.exe)
- macOS app bundle (.dmg)
- Auto-update system
- Release notes and changelog

## Risk Mitigation

### Technical Risks
- **Excel parsing complexity**: Use proven libraries and extensive testing
- **GST calculation accuracy**: Implement comprehensive unit tests
- **Cross-platform compatibility**: Early testing on target platforms
- **Database performance**: Optimize queries and add indexing
- **Responsive design complexity**: Use TailwindCSS and test across screen sizes
- **Playwright MCP integration**: Ensure proper setup and configuration

### Project Risks
- **Scope creep**: Strict adherence to sprint boundaries
- **Quality issues**: Comprehensive testing strategy with Playwright MCP
- **Timeline delays**: Buffer time in sprint planning
- **User adoption**: Focus on UX and usability across all screen sizes

## Success Metrics

### Technical Metrics
- Test coverage >90%
- Build success rate >95%
- Performance benchmarks met
- Zero critical bugs in production
- **Responsive design works on all target screen sizes**

### User Experience Metrics
- Task completion rate >90%
- Error rate <5%
- User satisfaction score >4.0/5.0
- **Responsive design satisfaction across different screen sizes**

### Business Metrics
- Successful conversions >95%
- Data accuracy >99%
- Processing time <30 seconds for standard files
- User adoption rate >80%
