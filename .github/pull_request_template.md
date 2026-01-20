## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Changes Made

<!-- List the key changes made in this PR -->

-
-
-

## Testing

<!-- Describe the tests you've added or updated -->

### Test Coverage

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Coverage thresholds are met (≥80% for all metrics)

### Test Commands Run

```bash
# Add the commands you ran to test your changes
npm test
npm run test:coverage
npm run test:e2e  # if applicable
```

### Coverage Report

<!-- The bot will automatically comment with coverage details -->
<!-- You can also run locally: ./scripts/coverage-report.sh -->

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Checklist

<!-- Mark completed items with an "x" -->

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
- [ ] I have checked my code and corrected any misspellings

## Code Quality

- [ ] ESLint passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)

## Related Issues

<!-- Link to related issues using: Closes #123 or Fixes #456 -->

Closes #

## Additional Notes

<!-- Add any additional notes, concerns, or questions here -->

---

**Note**: The CI/CD pipeline will automatically:
- ✅ Run all tests with coverage
- 📊 Generate coverage reports
- 💬 Comment on this PR with coverage summary
- 🎭 Run E2E tests (if applicable)
- 🔍 Perform linting and type checking
- 🏗️ Build the application

Please ensure all checks pass before requesting a review.
