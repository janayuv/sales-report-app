# Sale Report (Multi-Company) - Project Plan

A comprehensive project plan for building a desktop application to convert exported barcode sales reports (Excel) into Tally upload format and manage suppliers for two separate companies.

## 📋 Project Overview

**Goal**: Desktop app to convert exported barcode sales reports (Excel) into Tally upload format and manage suppliers for two separate companies (Company A, Company B).

**Tech Stack**: React + Vite + TypeScript + Tauri + TailwindCSS + Shadcn UI + SQLite

**UX Pattern**: Odoo-like list+form workflow with company selector top-left and company-scoped data. **Responsive design for multiple PC/laptop screen sizes with auto-adjustment.**

**Testing Tools**: Playwright MCP server for enhanced E2E testing, accessibility testing, and cross-platform validation.

## 🗂️ Documentation Structure

This repository contains the complete project planning documentation:

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete project plan with epics, features, tasks, and technical details
- **[GITHUB_ISSUES_TEMPLATE.md](./GITHUB_ISSUES_TEMPLATE.md)** - GitHub issues templates for easy issue creation
- **[SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md)** - Sprint timeline and milestone overview

## 🚀 Quick Start

### For Project Managers
1. Review [SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md) for timeline and milestones
2. Use [GITHUB_ISSUES_TEMPLATE.md](./GITHUB_ISSUES_TEMPLATE.md) to create issues in your repository
3. Set up sprint milestones based on the 9-week timeline

### For Developers
1. Start with [PROJECT_PLAN.md](./PROJECT_PLAN.md) for technical details
2. Follow the sprint structure from Sprint 0 to Sprint 8
3. Use the acceptance criteria in each feature for validation

### For Stakeholders
1. Review [SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md) for project timeline
2. Check [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed requirements
3. Focus on acceptance criteria for each sprint

## 📅 Sprint Overview

| Sprint | Focus | Duration | Effort |
|--------|-------|----------|--------|
| **Sprint 0** | Setup & Repo | Week 1 | ~15 hours |
| **Sprint 1** | DB & Core Models | Week 2 | ~28 hours |
| **Sprint 2** | App Shell & Company Switch | Week 3 | ~30 hours |
| **Sprint 3** | Suppliers Module | Week 4 | ~44 hours |
| **Sprint 4** | Report Upload & Parse | Week 5 | ~44 hours |
| **Sprint 5** | Tally Conversion Engine | Week 6 | ~40 hours |
| **Sprint 6** | Dashboard, Audit & Reports | Week 7 | ~48 hours |
| **Sprint 7** | Packaging, Tests & CI | Week 8 | ~76 hours |
| **Sprint 8** | Improvements & Hardening | Week 9 | ~140 hours |

**Total**: 9 weeks, ~425 hours

## 🎯 Key Features

### Core Functionality
- **Company Management**: Switch between Company A and Company B with isolated data
- **Supplier Management**: CRUD operations with CSV import/export
- **Excel Processing**: Upload and parse barcode sales reports
- **GST Split Logic**: Automatic invoice splitting for multiple GST rates
- **Tally Export**: Generate CSV files compatible with Tally software

### Technical Highlights
- **Cross-Platform**: Windows and macOS support via Tauri
- **Modern UI**: React + TailwindCSS + Shadcn UI
- **Type Safety**: Full TypeScript implementation
- **Data Integrity**: SQLite with proper relationships
- **Quality Assurance**: Comprehensive testing strategy
- **Security**: Dependency scanning, encrypted DB, secrets management
- **Performance**: Streaming parsers, memory optimization
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive Design**: Auto-adjusts for laptop (13-15"), desktop (21-27"), and multi-monitor setups
- **Enhanced Testing**: Playwright MCP server for comprehensive E2E, accessibility, and performance testing

## 🔧 Global Rules

- **Company-scoped**: All CRUD + uploads + exports tied to selected company
- **Excel format**: Both companies use same format with validation
- **Supplier mapping**: Unmapped suppliers flagged with inline match/add UI
- **GST split rule**: Group by invoice_no & gst_rate, apply suffixes (A, B, C...)
- **Responsive Design**: UI must auto-adjust for different screen sizes using TailwindCSS breakpoints
- **Cross-Platform Testing**: Use Playwright MCP server for comprehensive testing across Windows/macOS

## 📊 Database Schema

The application uses SQLite with the following core tables:
- `companies` - Company information
- `suppliers` - Supplier data (company-scoped)
- `uploaded_reports` - Uploaded Excel files
- `report_rows` - Parsed data from reports
- `tally_exports` - Generated Tally CSV files
- `audit_logs` - User action tracking
- `invoice_mappings` - Original to split invoice mappings

## 🧪 Testing Strategy

- **Unit Tests**: Critical business logic, especially GST calculations (>90% coverage)
- **E2E Tests**: Complete user workflows with Playwright MCP server
- **Integration Tests**: Database operations and file processing
- **Performance Tests**: Large file handling and memory usage
- **Security Tests**: Dependency scanning and vulnerability assessment
- **Accessibility Tests**: WCAG 2.1 AA compliance verification with Playwright MCP
- **Responsive Design Tests**: UI adaptation across different screen sizes
- **Cross-Platform Tests**: Windows and macOS with different screen resolutions

## 🚀 Deployment & Monitoring

- **Windows**: MSI/EXE installer with code signing
- **macOS**: DMG app bundle with notarization
- **Auto-update**: Built-in update mechanism with staging/production channels
- **CI/CD**: Comprehensive GitHub Actions pipeline with:
  - **Security Scanning**: Automated vulnerability detection and dependency monitoring
  - **Performance Monitoring**: Bundle size analysis and optimization suggestions
  - **Health Checks**: Automated application health monitoring every 6 hours
  - **Quality Assurance**: TypeScript compilation, linting, and testing
  - **Dependency Management**: Automated updates via Dependabot
  - **Production Monitoring**: Real-time alerts for critical issues

## 📈 Success Metrics

- **Technical**: >90% test coverage, >95% build success rate, <1 critical security vulnerability
- **User Experience**: >90% task completion rate, <5% error rate, WCAG 2.1 AA compliance
- **Business**: >95% successful conversions, >99% data accuracy, <30s processing time
- **Responsive Design**: Works on all target screen sizes (laptop 13-15", desktop 21-27", multi-monitor)

## 🔒 Security & Compliance

- **Dependency Scanning**: Automated vulnerability detection with weekly security audits
- **Secrets Management**: Secure handling of signing keys and tokens
- **Data Encryption**: Optional database encryption at rest
- **Data Retention**: GDPR-like data retention policies
- **Audit Logging**: Comprehensive action tracking
- **Automated Monitoring**: Real-time security alerts and issue creation
- **Dependency Updates**: Automated dependency updates via Dependabot
- **Security Workflows**: Comprehensive CI/CD security scanning for both Node.js and Rust

## 📱 Responsive Design

- **Laptop screens (13-15")**: Compact layouts, collapsible sidebar, horizontal scrolling for tables
- **Desktop screens (21-27")**: Full layouts, expanded sidebar, multi-column displays
- **Multi-monitor setups**: Adaptive layouts that utilize available screen real estate
- **Touch-friendly controls**: Larger buttons and touch targets for laptop screens
- **Fluid typography**: Text scales appropriately with screen size
- **Breakpoints**: TailwindCSS responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)

## 🧪 Playwright MCP Server Integration

- **Enhanced E2E Testing**: Comprehensive testing across different screen sizes and platforms
- **Accessibility Testing**: Automated accessibility checks with axe-core
- **Performance Testing**: Lighthouse performance audits
- **Cross-Platform Testing**: Test on Windows and macOS with different screen resolutions
- **Responsive Design Testing**: Test UI adaptation across screen sizes
- **Security Testing**: Automated security audits
- **Code Quality**: ESLint and TypeScript checks
- **Docker Testing**: Container-based testing for consistency

## 🔄 CI/CD Workflows & Automation

### Security & Dependency Management
- **Security Scanning**: Weekly automated security audits for Node.js and Rust dependencies
- **Dependency Monitoring**: Automated dependency health checks and outdated package detection
- **Dependabot Integration**: Automated dependency updates with smart auto-merge for minor/patch updates
- **Vulnerability Alerts**: Real-time alerts for critical security issues

### Performance & Quality
- **Performance Optimization**: Weekly bundle size analysis and optimization suggestions
- **Health Monitoring**: Application health checks every 6 hours
- **Quality Assurance**: Automated TypeScript compilation, linting, and testing
- **Build Verification**: Comprehensive build and test verification

### Production Monitoring
- **Automated Alerts**: Critical issue creation for production failures
- **Weekly Reports**: Automated performance and health reports
- **Artifact Storage**: Build artifacts and reports stored for 30 days
- **Issue Management**: Automated issue creation with proper labeling and assignment

### Workflow Schedule
- **Security Scans**: Weekly (Monday 2 AM)
- **Health Checks**: Every 6 hours
- **Performance Analysis**: Weekly (Sunday 2 AM)
- **Dependency Updates**: Weekly (Monday 9 AM)
- **Monitoring Reports**: Weekly (Monday 9 AM)

## 🤝 Contributing

1. Review the project plan and sprint structure
2. Create issues using the provided templates
3. Follow the acceptance criteria for each feature
4. Ensure all tests pass before marking complete
5. Follow the Definition of Done (DoD) checklist
6. Test responsive design across different screen sizes
7. Use Playwright MCP server for enhanced testing

## 📞 Support

For questions about the project plan:
- Review the detailed documentation in [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- Check the sprint timeline in [SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md)
- Use the issue templates in [GITHUB_ISSUES_TEMPLATE.md](./GITHUB_ISSUES_TEMPLATE.md)

---

**Note**: This project plan is designed for a single-repo desktop application with responsive design for multiple PC/laptop screen sizes. The reference repository `https://github.com/janayuv/import-manager.git` should be used only for dependency patterns and architecture reference.
