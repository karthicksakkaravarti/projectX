/**
 * Jest Test Setup File
 * This file runs before each test file
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE = 'test-service-role-key'
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')
process.env.CSRF_SECRET = 'test-csrf-secret'

// Mock scrollIntoView for jsdom (used by command/select components)
Element.prototype.scrollIntoView = jest.fn()

// Mock global Response for API route tests that use `new Response()`
// This is needed because jsdom doesn't provide the Response constructor
if (typeof global.Response === 'undefined') {
    class MockResponse {
        public status: number
        public headers: Headers
        private body: string

        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.body = typeof body === 'string' ? body : ''
            this.status = init?.status || 200
            this.headers = new Map() as unknown as Headers
        }

        async json() {
            return JSON.parse(this.body)
        }

        async text() {
            return this.body
        }
    }

    // @ts-expect-error - mocking global Response
    global.Response = MockResponse
}

// Mock global Request for API route tests that use `new Request()`
if (typeof global.Request === 'undefined') {
    class MockRequest {
        public url: string
        public method: string
        private body: string | null

        constructor(url: string, init?: RequestInit) {
            this.url = url
            this.method = init?.method || 'GET'
            this.body = init?.body as string | null || null
        }

        async json() {
            return this.body ? JSON.parse(this.body) : {}
        }

        async text() {
            return this.body || ''
        }
    }

    // @ts-expect-error - mocking global Request
    global.Request = MockRequest
}

// Polyfill TextEncoder/TextDecoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util')
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder
}

// Mock indexedDB at module level so it's available during imports
const indexedDBMock = {
    open: jest.fn().mockReturnValue({
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: {
            close: jest.fn(),
            objectStoreNames: {
                contains: jest.fn().mockReturnValue(true),
            },
            createObjectStore: jest.fn(),
            version: 1,
        },
    }),
    deleteDatabase: jest.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
    }),
}

try {
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', { value: indexedDBMock, configurable: true, writable: true })
    }
    Object.defineProperty(global, 'indexedDB', { value: indexedDBMock, configurable: true, writable: true })
} catch (e) {
    // @ts-ignore
    global.indexedDB = indexedDBMock
}

// Cleanup after each test
afterEach(() => {
    cleanup()
    jest.clearAllMocks()
})

// Mock window.matchMedia
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })

    // Mock IntersectionObserver
    const IntersectionObserverMock = jest.fn(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        takeRecords: jest.fn().mockReturnValue([]),
        unobserve: jest.fn(),
    }))
    global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

    // Mock ResizeObserver
    const ResizeObserverMock = jest.fn(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }))
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

    // Mock scrollTo
    window.scrollTo = jest.fn()

    // Mock localStorage
    const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
})

// Reset mocks after all tests
afterAll(() => {
    jest.restoreAllMocks()
})

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || ''
        if (
            message.includes('Warning: ReactDOM.render is no longer supported') ||
            message.includes('Warning: An update to') ||
            message.includes('act(...)') ||
            message.includes('Not implemented: navigation')
        ) {
            return
        }
        originalError.call(console, ...args)
    }
})

afterAll(() => {
    console.error = originalError
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}))

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: function MockImage(props: { src?: string; alt?: string;[key: string]: unknown }) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''} />
    },
}))
