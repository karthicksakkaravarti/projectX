# Testing Framework Documentation

This document provides a comprehensive guide to the testing framework set up for **ProjectX**.

## 📁 Test Structure

```
tests/
├── setup.ts                    # Global test setup (mocks, cleanup)
├── mocks/
│   ├── handlers.ts             # MSW API mock handlers
│   ├── server.ts               # MSW server for Node.js (Jest)
│   └── browser.ts              # MSW worker for browser (E2E)
├── utils/
│   └── test-utils.tsx          # Custom render, factories, helpers
├── unit/                       # Unit tests
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── config.test.ts
│   ├── components/
│   │   └── ui/
│   │       └── button.test.tsx
│   └── hooks/
│       └── use-mobile.test.ts
├── integration/                # Integration tests
│   └── (component integration tests)
├── api/                        # API route tests
│   ├── chat.test.ts
│   └── rate-limits.test.ts
└── e2e/                        # End-to-end tests (Playwright)
    ├── global-setup.ts
    ├── global-teardown.ts
    ├── home.e2e.ts
    └── chat.e2e.ts
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:all
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run with Watch Mode
```bash
npm run test:watch
```

### Run with Coverage
```bash
npm run test:coverage
```

## 🧪 Test Types

### Unit Tests
Test individual functions, hooks, and components in isolation.

```bash
npm run test:unit
```

**Location:** `tests/unit/`

**Examples:**
- `lib/utils.test.ts` - Tests for utility functions
- `components/ui/button.test.tsx` - Tests for Button component
- `hooks/use-mobile.test.ts` - Tests for useIsMobile hook

### Integration Tests
Test how multiple components or modules work together.

```bash
npm run test:integration
```

**Location:** `tests/integration/`

### API Tests
Test API routes and backend logic.

```bash
npm run test:api
```

**Location:** `tests/api/`

### End-to-End Tests (Playwright)
Test complete user flows in a real browser.

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

**Location:** `tests/e2e/`

## 📊 Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format (for CI integration)

### Coverage Thresholds

The project has minimum coverage thresholds configured:
- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

## 🛠️ Test Utilities

### Custom Render Function

Use `renderWithProviders` for components that need providers:

```tsx
import { renderWithProviders } from '@/tests/utils/test-utils'

test('renders with providers', () => {
  const { user } = renderWithProviders(<MyComponent />)
  
  // `user` is from @testing-library/user-event
  await user.click(screen.getByRole('button'))
})
```

### Test Data Factories

Create consistent test data:

```tsx
import { factories } from '@/tests/utils/test-utils'

const user = factories.user({ name: 'Custom Name' })
const chat = factories.chat({ title: 'Test Chat' })
const message = factories.message({ content: 'Hello!' })
```

### MSW Mocks

API requests are automatically mocked using MSW. To add custom handlers:

```tsx
import { server } from '@/tests/mocks/server'
import { http, HttpResponse } from 'msw'

test('handles error response', async () => {
  server.use(
    http.get('/api/endpoint', () => {
      return HttpResponse.json({ error: 'Error' }, { status: 500 })
    })
  )
  
  // Test error handling...
})
```

## 📝 Writing Tests

### Unit Test Template

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    
    render(<MyComponent onClick={onClick} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(onClick).toHaveBeenCalled()
  })
})
```

### E2E Test Template

```tsx
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should work correctly', async ({ page }) => {
    await page.fill('input', 'test')
    await page.click('button')
    
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `jest.config.ts` | Jest configuration |
| `playwright.config.ts` | Playwright E2E configuration |
| `tests/setup.ts` | Global test setup |

## 🏃 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

## 📚 Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees
2. **Use accessible queries** - Prefer `getByRole`, `getByLabelText`
3. **Mock external dependencies** - Use MSW for API calls
4. **Keep tests isolated** - Each test should be independent
5. **Use factories for test data** - Consistent and maintainable
6. **Write descriptive test names** - Clearly describe what's being tested

## 🔗 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
