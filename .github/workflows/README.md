# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing, coverage reporting, and CI/CD.

## Workflows

### 1. Test and Coverage (`test-coverage.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

**Features:**
- ✅ Runs Jest unit tests with coverage
- 📊 Generates coverage reports (LCOV, HTML, JSON)
- 💬 Comments on PRs with coverage summary
- 📁 Uploads coverage artifacts
- ✅ Validates coverage thresholds (80% minimum)
- 🎭 Runs Playwright E2E tests
- 📹 Uploads E2E test videos and reports

**Coverage Thresholds:**
- Lines: 80%
- Statements: 80%
- Functions: 80%
- Branches: 80%

**Artifacts Generated:**
- `coverage-reports/` - Contains LCOV, HTML, and JSON coverage reports
- `playwright-report/` - E2E test results
- `playwright-videos/` - E2E test execution videos

### 2. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Tags matching `v*`

**Jobs:**
1. **Validate** - Linting, type checking, and tests
2. **Build** - Application build with caching
3. **Docker** - Build and push Docker images to GitHub Container Registry

## Viewing Coverage Reports

### 1. In GitHub Actions

After a workflow run:
1. Go to the Actions tab
2. Click on a workflow run
3. Scroll to the "Artifacts" section
4. Download `coverage-reports.zip`
5. Extract and open `coverage/lcov-report/index.html` in your browser

### 2. In Pull Request Comments

For PRs, the bot automatically comments with:
- Coverage percentages for all metrics
- Status indicators (✅ passed, ⚠️ warning, ❌ failed)
- Comparison against 80% threshold
- Link to detailed reports

### 3. Locally

Run tests with coverage locally:

```bash
# Run all tests with coverage
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

## Coverage Services (Optional)

The workflow includes commented-out integrations for popular coverage services:

### Codecov

1. Sign up at [codecov.io](https://codecov.io)
2. Get your repository token
3. Add `CODECOV_TOKEN` to GitHub Secrets
4. Uncomment the Codecov step in `test-coverage.yml`

### Coveralls

1. Sign up at [coveralls.io](https://coveralls.io)
2. Connect your repository
3. Uncomment the Coveralls step in `test-coverage.yml`

## Test Scripts

Available npm scripts:

```bash
npm test                  # Run all unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:api         # Run API tests
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests (unit + E2E)
```

## Coverage Report Structure

```
coverage/
├── lcov.info                 # LCOV format (used by coverage tools)
├── coverage-summary.json     # JSON summary
├── lcov-report/             # HTML report
│   ├── index.html           # Main coverage page
│   └── [files]              # Per-file coverage
└── coverage-final.json      # Detailed JSON report
```

## Troubleshooting

### Coverage Thresholds Not Met

If the workflow fails due to coverage:
1. Check the coverage report to see which files lack coverage
2. Add tests for uncovered code
3. Review `jest.config.js` to ensure files are correctly included/excluded

### E2E Tests Failing

If Playwright tests fail:
1. Download the `playwright-report` artifact
2. Extract and open `index.html` to see test results
3. Download `playwright-videos` to see video recordings of failures

### Workflow Not Triggering

Ensure:
- You're pushing to `main` or `develop` branches
- Or creating a PR targeting these branches
- The workflow file is in the correct location: `.github/workflows/`

## Configuration

### Adjusting Coverage Thresholds

Edit `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,    // Adjust these values
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

### Adding/Excluding Files from Coverage

Edit `jest.config.js` in the `collectCoverageFrom` array:

```javascript
collectCoverageFrom: [
  'lib/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  // Add more patterns
  '!lib/excluded-folder/**',  // Exclude specific folders
],
```

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   npm run test:coverage
   ```

2. **Keep coverage above thresholds**
   - Add tests for new features
   - Maintain at least 80% coverage

3. **Review coverage reports**
   - Check HTML reports for uncovered lines
   - Focus on critical business logic

4. **Monitor E2E tests**
   - Review videos when tests fail
   - Keep E2E tests fast and reliable

5. **Use artifacts**
   - Download reports for deeper analysis
   - Share reports with team members

## Badges (Optional)

Add badges to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Test%20and%20Coverage/badge.svg)
![Coverage](https://img.shields.io/codecov/c/github/YOUR_USERNAME/YOUR_REPO)
```

## Support

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Coverage.js](https://istanbul.js.org/)
