# Sales Report - Multi-Company Desktop Application

A comprehensive desktop application for converting exported barcode sales reports (Excel) into Tally upload format and managing suppliers for multiple companies.

## 🚀 Features

- **Multi-Company Support**: Switch between Company A and Company B with isolated data
- **Responsive Design**: Auto-adjusts for laptop (13-15"), desktop (21-27"), and multi-monitor setups
- **Customer Management**: Complete CRUD operations with CSV import/export
- **Excel Processing**: Upload and parse barcode sales reports with validation
- **GST Split Logic**: Automatic invoice splitting for multiple GST rates
- **Tally Export**: Generate CSV files compatible with Tally software
- **Cross-Platform**: Windows and macOS support via Tauri

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: TailwindCSS v4 + Lucide React Icons
- **Desktop Framework**: Tauri (Rust-based)
- **Database**: SQLite with better-sqlite3
- **Form Management**: React Hook Form + Zod validation
- **Data Processing**: xlsx (Excel parsing) + papaparse (CSV)
- **Testing**: Playwright MCP server for enhanced E2E testing

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Rust toolchain (for Tauri)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sale-report-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Run Tauri development**
   ```bash
   npm run tauri dev
   ```

## 🏗️ Project Structure

```
sale-report-app/
├── src/
│   ├── utils/
│   │   ├── database.ts      # Database operations and models
│   │   ├── validation.ts    # Zod validation schemas
│   │   ├── cn.ts           # Utility for class names
│   │   └── responsiveUtils.ts # Responsive design helpers
│   ├── components/         # React components (to be added)
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # TailwindCSS v4 styles with CSS variables
├── src-tauri/             # Tauri backend (Rust)
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🎯 Current Status

### ✅ Completed (Sprint 0)
- [x] Project skeleton with Vite + React + TypeScript
- [x] Tauri configuration and dependencies
- [x] TailwindCSS v4 setup with responsive design and CSS variables
- [x] Database layer with SQLite and Rust backend
- [x] Basic responsive UI with company switching
- [x] Utility functions and validation schemas
- [x] ESLint and Prettier configuration
- [x] Git hooks with husky and lint-staged
- [x] Playwright MCP server integration for testing
- [x] TypeScript type checking and validation
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] Responsive design foundation for all screen sizes

### 🚧 In Progress
- [ ] Customer management module
- [ ] Excel file upload and parsing
- [ ] GST split logic implementation
- [ ] Tally CSV generation

### 📋 Planned Features
- [ ] Dashboard with analytics
- [ ] Audit logging system
- [ ] Cross-platform packaging
- [ ] Comprehensive testing with Playwright MCP
- [ ] Security and performance improvements

## 🎨 Responsive Design

The application is designed to work seamlessly across different screen sizes:

- **Laptop screens (13-15")**: Compact layouts, collapsible sidebar, horizontal scrolling for tables
- **Desktop screens (21-27")**: Full layouts, expanded sidebar, multi-column displays
- **Multi-monitor setups**: Adaptive layouts that utilize available screen real estate
- **Touch-friendly controls**: Larger buttons and touch targets for laptop screens

## 🧪 Testing

The project uses Playwright MCP server for enhanced testing capabilities:

- **E2E Testing**: Complete user workflows
- **Accessibility Testing**: WCAG 2.1 AA compliance
- **Performance Testing**: Lighthouse performance audits
- **Cross-Platform Testing**: Windows and macOS with different screen resolutions
- **Responsive Design Testing**: UI adaptation across screen sizes

## 📊 Database Schema

The application uses SQLite with the following core tables:

- `companies` - Company information
- `customers` - Customer data (company-scoped)
- `uploaded_reports` - Uploaded Excel files
- `report_rows` - Parsed data from reports
- `tally_exports` - Generated Tally CSV files
- `audit_logs` - User action tracking
- `invoice_mappings` - Original to split invoice mappings

## 🔧 Development Scripts

### Core Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run tauri dev` - Start Tauri development
- `npm run tauri build` - Build Tauri application

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run Playwright E2E tests
- `npm run test:ui` - Run Playwright tests with UI
- `npm run test:headed` - Run Playwright tests in headed mode
- `npm run test:debug` - Run Playwright tests in debug mode

## 🤝 Contributing

1. Follow the project structure and coding standards
2. Ensure responsive design works across all screen sizes
3. Write tests for new features
4. Use Playwright MCP server for enhanced testing
5. Follow the Definition of Done (DoD) checklist

## 📈 Success Metrics

- **Technical**: >90% test coverage, >95% build success rate
- **User Experience**: >90% task completion rate, <5% error rate
- **Business**: >95% successful conversions, >99% data accuracy
- **Responsive Design**: Works on all target screen sizes

## 🔒 Security & Compliance

- Dependency scanning and vulnerability assessment
- Data encryption at rest (optional)
- Audit logging for all user actions
- GDPR-like data retention policies

## 📞 Support

For questions about the project:
- Review the detailed documentation in the project plan
- Check the sprint timeline and milestones
- Use the provided issue templates for bug reports

---

**Note**: This project is designed for a single-repo desktop application with responsive design for multiple PC/laptop screen sizes, using the latest TailwindCSS v4 with CSS variables for theming.
