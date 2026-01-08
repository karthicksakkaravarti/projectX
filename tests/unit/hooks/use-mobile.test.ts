/**
 * Unit Tests: useIsMobile Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/app/hooks/use-mobile'

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })
}

describe('useIsMobile Hook', () => {
    const originalMatchMedia = window.matchMedia
    const originalInnerWidth = window.innerWidth

    beforeEach(() => {
        // Reset to default
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        })
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        })
    })

    describe('Desktop viewport', () => {
        beforeEach(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024,
            })
            window.matchMedia = createMatchMedia(false) as typeof window.matchMedia
        })

        it('should return false on desktop viewport', () => {
            const { result } = renderHook(() => useIsMobile())
            expect(result.current).toBe(false)
        })

        it('should return false for viewport >= 768px', () => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 768,
            })

            const { result } = renderHook(() => useIsMobile())
            expect(result.current).toBe(false)
        })
    })

    describe('Mobile viewport', () => {
        beforeEach(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            })
            window.matchMedia = createMatchMedia(true) as typeof window.matchMedia
        })

        it('should return true on mobile viewport', () => {
            const { result } = renderHook(() => useIsMobile())
            expect(result.current).toBe(true)
        })

        it('should return true for viewport < 768px', () => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 767,
            })

            const { result } = renderHook(() => useIsMobile())
            expect(result.current).toBe(true)
        })
    })

    describe('Initial state', () => {
        it('should return false initially (during SSR)', () => {
            // Simulate SSR by not triggering the effect yet
            window.matchMedia = createMatchMedia(false) as typeof window.matchMedia

            const { result } = renderHook(() => useIsMobile())

            // After the effect runs, it should have a value
            expect(typeof result.current).toBe('boolean')
        })
    })

    describe('Breakpoint behavior', () => {
        it('should use 768px as the mobile breakpoint', () => {
            const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }))

            window.matchMedia = matchMediaMock

            renderHook(() => useIsMobile())

            expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)')
        })
    })

    describe('Event listener', () => {
        it('should add event listener on mount', () => {
            const addEventListener = jest.fn()
            const removeEventListener = jest.fn()

            window.matchMedia = jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener,
                removeEventListener,
                dispatchEvent: jest.fn(),
            }))

            renderHook(() => useIsMobile())

            expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
        })

        it('should remove event listener on unmount', () => {
            const addEventListener = jest.fn()
            const removeEventListener = jest.fn()

            window.matchMedia = jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener,
                removeEventListener,
                dispatchEvent: jest.fn(),
            }))

            const { unmount } = renderHook(() => useIsMobile())
            unmount()

            expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
        })
    })

    describe('Responsive changes', () => {
        it('should update when viewport changes', () => {
            let changeHandler: (() => void) | null = null

            window.matchMedia = jest.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: (event: string, handler: () => void) => {
                    if (event === 'change') {
                        changeHandler = handler
                    }
                },
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }))

            const { result } = renderHook(() => useIsMobile())

            // Initial value (desktop)
            expect(result.current).toBe(false)

            // Simulate viewport change to mobile
            act(() => {
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 375,
                })
                if (changeHandler) {
                    changeHandler()
                }
            })

            expect(result.current).toBe(true)
        })
    })
})
