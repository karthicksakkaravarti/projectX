/**
 * Unit Tests: lib/utils.ts
 */

import { cn, formatNumber, debounce, isDev } from '@/lib/utils'

describe('lib/utils', () => {
    describe('cn (className utility)', () => {
        it('should merge class names correctly', () => {
            expect(cn('foo', 'bar')).toBe('foo bar')
        })

        it('should handle conditional classes', () => {
            expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
        })

        it('should handle undefined and null values', () => {
            expect(cn('base', undefined, null, 'end')).toBe('base end')
        })

        it('should merge Tailwind classes correctly', () => {
            expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
        })

        it('should handle empty inputs', () => {
            expect(cn()).toBe('')
        })

        it('should handle array inputs', () => {
            expect(cn(['foo', 'bar'])).toBe('foo bar')
        })

        it('should handle object syntax', () => {
            expect(cn({ active: true, disabled: false })).toBe('active')
        })
    })

    describe('formatNumber', () => {
        it('should format numbers with commas', () => {
            expect(formatNumber(1000)).toBe('1,000')
            expect(formatNumber(1000000)).toBe('1,000,000')
        })

        it('should handle small numbers', () => {
            expect(formatNumber(1)).toBe('1')
            expect(formatNumber(999)).toBe('999')
        })

        it('should handle zero', () => {
            expect(formatNumber(0)).toBe('0')
        })

        it('should handle negative numbers', () => {
            expect(formatNumber(-1000)).toBe('-1,000')
        })

        it('should handle decimals', () => {
            expect(formatNumber(1000.5)).toBe('1,000.5')
        })
    })

    describe('debounce', () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('should debounce function calls', () => {
            const fn = jest.fn()
            const debouncedFn = debounce(fn, 100)

            debouncedFn()
            debouncedFn()
            debouncedFn()

            expect(fn).not.toHaveBeenCalled()

            jest.advanceTimersByTime(100)

            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('should pass arguments to the debounced function', () => {
            const fn = jest.fn()
            const debouncedFn = debounce(fn, 100)

            debouncedFn('arg1', 'arg2')
            jest.advanceTimersByTime(100)

            expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
        })

        it('should reset timer on each call', () => {
            const fn = jest.fn()
            const debouncedFn = debounce(fn, 100)

            debouncedFn()
            jest.advanceTimersByTime(50)
            debouncedFn()
            jest.advanceTimersByTime(50)

            expect(fn).not.toHaveBeenCalled()

            jest.advanceTimersByTime(50)

            expect(fn).toHaveBeenCalledTimes(1)
        })
    })

    describe('isDev', () => {
        it('should be a boolean value', () => {
            expect(typeof isDev).toBe('boolean')
        })
    })
})
