/**
 * Unit Tests: API Module
 */

import { UsageLimitError } from '@/lib/api'

describe('lib/api', () => {
    describe('UsageLimitError', () => {
        it('should create error with message', () => {
            const error = new UsageLimitError('Daily limit reached')

            expect(error.message).toBe('Daily limit reached')
            expect(error.code).toBe('DAILY_LIMIT_REACHED')
        })

        it('should be instance of Error', () => {
            const error = new UsageLimitError('Test message')

            expect(error).toBeInstanceOf(Error)
        })

        it('should have correct error code', () => {
            const error = new UsageLimitError('Limit exceeded')

            expect(error.code).toBe('DAILY_LIMIT_REACHED')
        })

        it('should preserve message', () => {
            const messages = [
                'You have reached your daily message limit',
                'Pro model limit exceeded',
                'Rate limit exceeded',
            ]

            messages.forEach((msg) => {
                const error = new UsageLimitError(msg)
                expect(error.message).toBe(msg)
            })
        })

        it('should be throwable', () => {
            expect(() => {
                throw new UsageLimitError('Test error')
            }).toThrow(UsageLimitError)
        })

        it('should be catchable as Error', () => {
            try {
                throw new UsageLimitError('Test error')
            } catch (e) {
                expect(e).toBeInstanceOf(Error)
                expect(e).toBeInstanceOf(UsageLimitError)
            }
        })
    })
})
