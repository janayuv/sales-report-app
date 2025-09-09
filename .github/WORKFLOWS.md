# GitHub Workflows Documentation

This document describes all the GitHub Actions workflows configured for the Sales Report application.

## Overview

The project uses a comprehensive CI/CD pipeline with multiple workflows to ensure code quality, security, performance, and reliable deployments.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Trigger:** Push to main/master/develop branches, Pull Requests

**Purpose:** Main continuous integration and deployment pipeline

**Jobs:**
- **Lint & Format**: ESLint, Prettier, Rust formatting checks
- **Type Check**: TypeScript and Rust type checking
- **Unit Tests**: Frontend (Vitest) and Rust tests with coverage
- **Build**: Multi-platform builds (Linux, Windows, macOS)
- **E2E Tests**: Playwright end-to-end testing
- **Security**: npm audit and Rust security audit
- **Deploy**: Auto-deployment on main branch

**Key Features:**
- Multi-platform support
- Artifact uploads
- Coverage reporting
- Auto-deployment

### 2. Code Quality (`code-quality.yml`)

**Trigger:** Pull Requests, Push to main/master/develop

**Purpose:** Comprehensive code quality checks

**Jobs:**
- **Code Quality Checks**: ESLint, TypeScript strict mode, Prettier, Rust Clippy
- **PR Quality Comment**: Automated PR comments with quality metrics

**Key Features:**
- Detailed linting reports
- PR quality comments
- Artifact uploads for reports

### 3. Performance Testing (`performance.yml`)

**Trigger:** Pull Requests, Push to main/master

**Purpose:** Performance and load testing

**Jobs:**
- **Performance Tests**: Lighthouse CI, bundle analysis
- **Memory Usage Test**: Memory consumption testing
- **Load Testing**: Artillery load testing

**Key Features:**
- Lighthouse performance audits
- Bundle size analysis
- Memory usage monitoring
- Load testing with Artillery

### 4. Release Management (`release.yml`)

**Trigger:** Git tags (v*), Manual dispatch

**Purpose:** Automated release creation and management

**Jobs:**
- **Create Release**: Multi-platform builds, checksums, release notes
- **Update Version**: Package.json version bumping
- **Notify Release**: Release notifications

**Key Features:**
- Multi-platform builds
- Checksum generation
- Automated release notes
- Version bumping

### 5. Security Scan (`security.yml`)

**Trigger:** Push, Pull Requests, Weekly schedule

**Purpose:** Comprehensive security scanning

**Jobs:**
- **Security Scan**: npm audit, Rust audit, Trivy, CodeQL
- **Dependency Review**: PR dependency analysis

**Key Features:**
- Multiple security scanners
- Dependency vulnerability scanning
- SARIF report uploads
- Weekly scheduled scans

### 6. Accessibility Testing (`accessibility.yml`)

**Trigger:** Pull Requests, Push to main/master

**Purpose:** Accessibility compliance testing

**Jobs:**
- **Accessibility Tests**: axe-core, Lighthouse, pa11y

**Key Features:**
- Multiple accessibility tools
- PR accessibility comments
- Comprehensive accessibility reports

### 7. Docker Build & Test (`docker.yml`)

**Trigger:** Push, Pull Requests, Manual dispatch

**Purpose:** Docker containerization and testing

**Jobs:**
- **Docker Build**: Multi-architecture builds
- **Docker Test**: Container testing
- **Deploy Staging**: Staging deployment

**Key Features:**
- Multi-architecture builds
- Container vulnerability scanning
- Staging deployment

### 8. Workflow Status (`status.yml`)

**Trigger:** Workflow completion

**Purpose:** Workflow status monitoring and reporting

**Jobs:**
- **Check Workflow Status**: Status tracking and PR comments

**Key Features:**
- Workflow status monitoring
- PR status updates

### 9. Dependabot Auto-merge (`dependabot.yml`)

**Trigger:** Dependabot Pull Requests

**Purpose:** Automated dependency updates

**Jobs:**
- **Auto-merge Dependabot PRs**: Auto-merge minor/patch updates

**Key Features:**
- Automated dependency updates
- Security update prioritization

### 10. Notifications (`notifications.yml`)

**Trigger:** Workflow completion, PR events, releases

**Purpose:** Notification system for workflow events

**Jobs:**
- **Notify Success**: Success notifications
- **Notify Failure**: Failure notifications
- **Notify PR Merged**: PR merge notifications
- **Notify Release**: Release notifications

**Key Features:**
- Comprehensive notification system
- Customizable notification channels

## Configuration

### Required Secrets

Add these secrets to your repository settings:

```yaml
# Docker Hub (for docker.yml)
DOCKERHUB_USERNAME: your-dockerhub-username
DOCKERHUB_TOKEN: your-dockerhub-token

# Notifications (for notifications.yml)
SLACK_WEBHOOK_URL: your-slack-webhook-url
DISCORD_WEBHOOK_URL: your-discord-webhook-url

# Code Quality (optional)
CODECOV_TOKEN: your-codecov-token
```

### Environment Variables

The workflows use these environment variables:

```yaml
CARGO_TERM_COLOR: always
RUST_BACKTRACE: 1
```

## Usage

### Running Workflows

1. **Automatic**: Workflows run automatically on push/PR events
2. **Manual**: Use "Actions" tab in GitHub to run workflows manually
3. **Scheduled**: Security scans run weekly on Mondays at 2 AM

### Monitoring

- Check the "Actions" tab for workflow status
- Review artifacts for detailed reports
- Monitor PR comments for quality metrics

### Troubleshooting

1. **Failed Builds**: Check the specific job logs
2. **Missing Dependencies**: Ensure all system dependencies are installed
3. **Permission Issues**: Verify repository secrets and permissions

## Customization

### Adding New Checks

1. Create a new workflow file in `.github/workflows/`
2. Define triggers and jobs
3. Add to the status workflow for monitoring

### Modifying Existing Workflows

1. Edit the workflow file
2. Test with a pull request
3. Monitor the results

### Adding Notifications

1. Configure webhook URLs in repository secrets
2. Uncomment notification code in `notifications.yml`
3. Customize notification messages

## Best Practices

1. **Keep workflows fast**: Use caching and parallel jobs
2. **Fail fast**: Put quick checks first
3. **Use artifacts**: Store reports for later analysis
4. **Monitor costs**: Be mindful of GitHub Actions minutes
5. **Update regularly**: Keep actions and dependencies updated

## Support

For issues with workflows:
1. Check the workflow logs
2. Review this documentation
3. Create an issue in the repository
4. Check GitHub Actions documentation
