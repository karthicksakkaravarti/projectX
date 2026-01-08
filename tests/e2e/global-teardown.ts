/**
 * Playwright E2E Global Teardown
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Cleaning up after E2E tests...')

    // You can add global teardown logic here:
    // - Stop test database
    // - Clean up test data
    // - Reset environment

    console.log('✅ Global teardown complete')
}

export default globalTeardown
