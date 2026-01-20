# Test & Coverage - Quick Start Guide

Quick reference for running tests and viewing coverage reports.

## 🚀 Run Tests Locally

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (great for development!)
npm run test:watch

# Quick coverage report with auto-open browser
./scripts/coverage-report.sh
```

## 📊 View Coverage Report

### Option 1: Automated Script (Recommended)
```bash
./scripts/coverage-report.sh
```
✅ Runs tests
✅ Shows summary with colors
✅ Opens HTML report in browser

### Option 2: Manual
```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## 🤖 GitHub Actions

### What Happens Automatically

When you push or create a PR:

1. **Tests Run** → All Jest unit tests execute
2. **Coverage Generated** → Reports created in multiple formats
3. **Bot Comments** → Coverage summary posted on PR
4. **Checks Pass/Fail** → Based on 80% threshold
5. **Artifacts Uploaded** → Reports available for 30 days

### Example Bot Comment on PR

```
📊 Test Coverage Report

| Metric | Coverage | Status |
|--------|----------|--------|
| Lines | 85.2% (1245/1461) | 🟢 ✅ |
| Statements | 84.8% (1389/1637) | 🟢 ✅ |
| Functions | 82.1% (245/298) | 🟢 ✅ |
| Branches | 81.5% (289/354) | 🟢 ✅ |

✅ All coverage thresholds met!
```

## 📁 What Was Created

```
.github/
├── workflows/
│   ├── test-coverage.yml          # ← Main test workflow
│   ├── ci-cd.yml                   # ← Updated (tests enabled)
│   └── README.md                   # ← Workflow docs
└── pull_request_template.md        # ← PR template with checklist

scripts/
└── coverage-report.sh              # ← Helper script

TESTING.md                          # ← Complete guide
TEST_SETUP_SUMMARY.md              # ← Detailed summary
QUICK_START.md                     # ← This file
```

## 🎯 Coverage Requirements

All metrics must be **≥80%**:
- ✅ Lines: 80%
- ✅ Statements: 80%
- ✅ Functions: 80%
- ✅ Branches: 80%

## 📖 More Information

- **Complete Guide**: See [TESTING.md](TESTING.md)
- **Setup Summary**: See [TEST_SETUP_SUMMARY.md](TEST_SETUP_SUMMARY.md)
- **Workflow Details**: See [.github/workflows/README.md](.github/workflows/README.md)

## 🔥 Common Commands

| Command | What It Does |
|---------|--------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests on file changes |
| `npm run test:coverage` | Run tests + generate coverage |
| `npm run test:unit` | Run only unit tests |
| `npm run test:e2e` | Run E2E tests |
| `./scripts/coverage-report.sh` | Coverage + auto-open report |

## ✅ Verify Setup Works

```bash
# 1. Run tests
npm test

# 2. Generate coverage
npm run test:coverage

# 3. Check coverage exists
ls coverage/lcov-report/index.html

# 4. Use helper script
./scripts/coverage-report.sh
```

All commands should complete successfully!

## 🆘 Need Help?

1. Read [TESTING.md](TESTING.md) for complete guide
2. Check [.github/workflows/README.md](.github/workflows/README.md) for CI/CD info
3. Review existing test files in `tests/` for examples

---

**Ready to test! 🎉**
