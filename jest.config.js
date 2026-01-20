const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.tsx'],

  // Module name mapping (aligns with tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/',
  ],

  // Coverage configuration - covering all directories
  collectCoverageFrom: [
    // Library code
    'lib/**/*.{ts,tsx}',

    // Application code
    'app/**/*.{ts,tsx}',

    // Shared components
    'components/**/*.{ts,tsx}',

    // Utilities
    'utils/**/*.{ts,tsx}',

    // Middleware
    'middleware.ts',

    // ===== EXCLUSIONS =====

    // Type definition files
    '!**/*.d.ts',
    '!**/types.ts',
    '!**/types/**',
    '!app/types/**',

    // Store files (Zustand stores with complex state)
    '!lib/chat-store/**',
    '!lib/model-store/**',
    '!lib/user-store/**',
    '!lib/user-preference-store/**',

    // Hooks that require complex mocking
    '!lib/hooks/**',

    // MCP and provider configuration
    '!lib/mcp/**',
    '!lib/providers/**',
    '!lib/models/data/**',
    '!lib/models/index.ts',
    '!lib/openproviders/index.ts',
    '!lib/openproviders/env.ts',

    // Server-side only code
    '!lib/supabase/**',
    '!lib/server/**',
    '!lib/user/**',
    '!utils/supabase/**',

    // Complex lib files
    '!lib/fetch.ts',
    '!lib/motion.ts',
    '!lib/routes.ts',
    '!lib/file-handling.ts',
    '!lib/api.ts',

    // Next.js generated files and layouts
    '!app/layout.tsx',
    '!app/layout-client.tsx',
    '!app/not-found.tsx',
    '!app/globals.css',

    // Image generation files
    '!app/icon.tsx',
    '!app/apple-icon.tsx',
    '!app/opengraph-image.tsx',

    // Icon components (SVG wrappers)
    '!components/icons/**',

    // Motion primitives (animation wrappers)
    '!components/motion-primitives/**',

    // Build and system directories
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],

  // Coverage thresholds (can be adjusted as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporter types
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
}

module.exports = createJestConfig(config)
