#!/bin/bash

# Coverage Report Generator and Viewer
# This script helps you generate and view coverage reports locally

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Coverage Report Generator${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Clean previous coverage
if [ -d "coverage" ]; then
    print_status "Cleaning previous coverage reports..."
    rm -rf coverage
fi

# Run tests with coverage
print_status "Running tests with coverage..."
echo ""
npm run test:coverage

# Check if coverage was generated
if [ ! -d "coverage" ]; then
    print_error "Coverage report not generated!"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Coverage Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Display coverage summary
if [ -f "coverage/coverage-summary.json" ]; then
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    const threshold = 80;

    const getEmoji = (pct) => {
        if (pct >= 80) return '✅';
        if (pct >= 60) return '⚠️';
        return '❌';
    };

    console.log('📊 Coverage Metrics:');
    console.log('==========================================');
    console.log(\`Lines:      \${total.lines.pct.toFixed(2)}% (\${total.lines.covered}/\${total.lines.total}) \${getEmoji(total.lines.pct)}\`);
    console.log(\`Statements: \${total.statements.pct.toFixed(2)}% (\${total.statements.covered}/\${total.statements.total}) \${getEmoji(total.statements.pct)}\`);
    console.log(\`Functions:  \${total.functions.pct.toFixed(2)}% (\${total.functions.covered}/\${total.functions.total}) \${getEmoji(total.functions.pct)}\`);
    console.log(\`Branches:   \${total.branches.pct.toFixed(2)}% (\${total.branches.covered}/\${total.branches.total}) \${getEmoji(total.branches.pct)}\`);
    console.log('==========================================\n');

    const allMet = total.lines.pct >= threshold &&
                   total.statements.pct >= threshold &&
                   total.functions.pct >= threshold &&
                   total.branches.pct >= threshold;

    if (allMet) {
        console.log('✅ All coverage thresholds met! (≥80%)');
    } else {
        console.log('⚠️  Some coverage thresholds not met (<80%)');
    }
    "
else
    print_error "Coverage summary not found!"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Available Reports${NC}"
echo -e "${BLUE}========================================${NC}\n"

print_status "HTML Report: coverage/lcov-report/index.html"
print_status "LCOV Report: coverage/lcov.info"
print_status "JSON Summary: coverage/coverage-summary.json"

echo ""
echo -e "${YELLOW}Would you like to open the HTML report? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    print_status "Opening HTML coverage report..."

    # Detect OS and open accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open coverage/lcov-report/index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open coverage/lcov-report/index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start coverage/lcov-report/index.html
    else
        print_warning "Cannot automatically open browser. Please open coverage/lcov-report/index.html manually."
    fi
else
    print_status "You can view the report later by opening: coverage/lcov-report/index.html"
fi

echo ""
echo -e "${GREEN}✓ Done!${NC}"
