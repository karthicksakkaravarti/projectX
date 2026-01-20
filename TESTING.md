# Testing Guide

Complete guide for running tests and understanding coverage reports in this project.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [GitHub Actions](#github-actions)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (great for development)
npm run test:watch

# Generate and view coverage report
./scripts/coverage-report.sh
```

## 🧪 Test Types

### 1. Unit Tests
Located in `tests/unit/`
- Tests individual components and functions in isolation
- Fast execution
- Mock external dependencies

### 2. Integration Tests
Located in `tests/integration/`
- Tests interaction between multiple components
- May involve API calls and data flow

### 3. API Tests
Located in `tests/api/`
- Tests API endpoints and server-side logic
- Validates request/response handling

### 4. E2E Tests
Located in `tests/e2e/`
- Tests complete user workflows using Playwright
- Runs in actual browser environment
- Tests full application stack

## 🏃 Running Tests

### Basic Commands

```bash
# Run all unit tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only API tests
npm run test:api

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run all tests (unit + E2E)
npm run test:all
```

### Advanced Test Filtering

```bash
# Run tests matching a pattern
npm test -- --testPathPattern=chat

# Run tests in a specific file
npm test -- path/to/test-file.test.tsx

# Run tests with a specific name
npm test -- --testNamePattern="should render correctly"

# Update snapshots
npm test -- -u
```

## 📊 Coverage Reports

### Understanding Coverage

Coverage measures how much of your code is executed during tests:

- **Lines**: Percentage of code lines executed
- **Statements**: Percentage of statements executed
- **Functions**: Percentage of functions called
- **Branches**: Percentage of conditional branches taken

**Thresholds**: This project requires **≥80%** coverage for all metrics.

### Viewing Coverage Reports

#### 1. Terminal Output
```bash
npm run test:coverage
# Shows summary in terminal
```

#### 2. HTML Report (Recommended)
```bash
# Generate and open HTML report
./scripts/coverage-report.sh

# Or manually:
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

#### 3. Coverage Files

After running tests with coverage:

```
coverage/
├── lcov.info              # LCOV format for tools
├── coverage-summary.json  # JSON summary
├── coverage-final.json    # Detailed JSON
└── lcov-report/          # HTML report
    └── index.html        # Main page
```

### Interpreting Coverage

#### ✅ Good Coverage (≥80%)
- Green indicators
- Meets project requirements
- Ready for merge

#### ⚠️ Warning (60-79%)
- Yellow indicators
- Add more tests before merging

#### ❌ Poor Coverage (<60%)
- Red indicators
- Requires significant test additions

## 🤖 GitHub Actions

### Automated Testing

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

### Workflow Features

1. **Test Execution**
   - Runs all Jest tests with coverage
   - Runs Playwright E2E tests
   - Validates coverage thresholds

2. **Coverage Reports**
   - Generates HTML, LCOV, and JSON reports
   - Uploads artifacts (available for 30 days)
   - Comments on PRs with coverage summary

3. **PR Comments**
   - Automatic coverage summary on every PR
   - Shows metrics with status indicators
   - Links to detailed reports

### Viewing Reports in GitHub

1. Go to Actions tab
2. Click on a workflow run
3. Scroll to Artifacts section
4. Download:
   - `coverage-reports` - Test coverage
   - `playwright-report` - E2E test results
   - `playwright-videos` - E2E execution videos

### Coverage Integration Services

Optional integrations available:

#### Codecov
```yaml
# Uncomment in .github/workflows/test-coverage.yml
- name: Upload to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

#### Coveralls
```yaml
# Uncomment in .github/workflows/test-coverage.yml
- name: Upload to Coveralls
  uses: coverallsapp/github-action@v2
```

## ✍️ Writing Tests

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const onClick = jest.fn();
    render(<MyComponent onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Best Practices

1. **Descriptive Test Names**
   ```typescript
   // ✅ Good
   it('should display error message when API call fails', () => {})

   // ❌ Bad
   it('test error', () => {})
   ```

2. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should update count when button clicked', async () => {
     // Arrange
     render(<Counter />);
     const button = screen.getByRole('button');

     // Act
     await userEvent.click(button);

     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

3. **Test User Behavior, Not Implementation**
   ```typescript
   // ✅ Good - tests what user sees
   expect(screen.getByText('Welcome')).toBeInTheDocument();

   // ❌ Bad - tests implementation details
   expect(wrapper.state('isVisible')).toBe(true);
   ```

4. **Mock External Dependencies**
   ```typescript
   jest.mock('@/lib/api', () => ({
     fetchUser: jest.fn(),
   }));
   ```

5. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Test Files Location

Place test files next to the code they test:
```
app/components/Button/
├── Button.tsx
└── Button.test.tsx
```

Or in the tests directory:
```
tests/
├── unit/
│   └── components/
│       └── Button.test.tsx
├── integration/
└── e2e/
```

## 🔧 Troubleshooting

### Tests Failing Locally

```bash
# Clear Jest cache
npm test -- --clearCache

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Check for snapshot updates needed
npm test -- -u
```

### Coverage Not Generated

```bash
# Ensure coverage command is correct
npm run test:coverage

# Check jest.config.js has correct coverageDirectory
# Should be: coverageDirectory: '<rootDir>/coverage'

# Verify reporters are configured
# Should include: coverageReporters: ['text', 'lcov', 'html']
```

### E2E Tests Failing

```bash
# Install/update Playwright browsers
npx playwright install

# Run in headed mode to see what's happening
npm run test:e2e:headed

# Debug mode with inspector
npm run test:e2e:debug

# Check test results
npm run test:e2e:report
```

### GitHub Actions Failing

1. Check the Actions tab for error logs
2. Download artifacts for detailed reports
3. Ensure secrets are configured (if using external services)
4. Verify workflow triggers are correct

### Low Coverage Warnings

```bash
# Identify uncovered files
npm run test:coverage
# Check coverage/lcov-report/index.html for details

# Add tests for uncovered code
# Focus on:
# - Critical business logic
# - User-facing features
# - Error handling paths
```

## 📚 Additional Resources

### Testing Libraries
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Coverage Tools
- [Istanbul.js](https://istanbul.js.org/)
- [Codecov](https://codecov.io/)
- [Coveralls](https://coveralls.io/)

## 🎯 Coverage Goals

Current thresholds (can be adjusted in `jest.config.js`):

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Statements | 80% |
| Functions | 80% |
| Branches | 80% |

### Excluded from Coverage

The following are intentionally excluded (see `jest.config.js`):
- Type definition files
- Store files (Zustand)
- Complex hooks requiring heavy mocking
- Server-side only code
- Next.js generated files
- Icon and animation components

## 💡 Tips

1. **Run tests before committing**
   ```bash
   npm run test:coverage
   ```

2. **Use watch mode during development**
   ```bash
   npm run test:watch
   ```

3. **Check coverage locally before pushing**
   ```bash
   ./scripts/coverage-report.sh
   ```

4. **Keep tests fast**
   - Mock expensive operations
   - Avoid unnecessary renders
   - Use `screen.getByRole` over `container.querySelector`

5. **Test edge cases**
   - Empty states
   - Error conditions
   - Loading states
   - User interactions

## 🆘 Getting Help

- Check existing tests for examples
- Review [.github/workflows/README.md](.github/workflows/README.md)
- See test setup in [tests/setup.tsx](tests/setup.tsx)
- Open an issue for test infrastructure problems

---

**Happy Testing! 🎉**
