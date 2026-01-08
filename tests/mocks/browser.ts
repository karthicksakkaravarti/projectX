/**
 * MSW Browser Setup for E2E tests
 */

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Create the mock worker for browser environment
export const worker = setupWorker(...handlers)
