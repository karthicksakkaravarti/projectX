/**
 * Playwright E2E Global Setup
 * Runs once before all tests
 */

import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting E2E test suite...')

    // You can add global setup logic here:
    // - Start test database
    // - Seed test data
    // - Configure environment

    // Store test configuration in environment
    process.env.TEST_ENV = 'e2e'

    console.log('✅ Global setup complete')
}

export default globalSetup
