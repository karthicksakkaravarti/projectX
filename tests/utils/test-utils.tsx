/**
 * Test Utilities and Helpers
 * Custom render functions and testing utilities
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'

// Types
export type UserEventInstance = ReturnType<typeof userEvent.setup>

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient
    initialRoute?: string
}

interface CustomRenderResult extends RenderResult {
    user: UserEventInstance
}

/**
 * Create a fresh QueryClient for tests
 */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    })
}

/**
 * All-in-one Provider wrapper for tests
 */
interface ProvidersProps {
    children: React.ReactNode
    queryClient?: QueryClient
}

function AllProviders({ children, queryClient }: ProvidersProps): ReactElement {
    const client = queryClient || createTestQueryClient()

    return (
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
    ui: ReactElement,
    options: CustomRenderOptions = {}
): CustomRenderResult {
    const { queryClient, ...renderOptions } = options

    const user = userEvent.setup()

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <AllProviders queryClient={queryClient}>{children}</AllProviders>
    )

    return {
        user,
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    }
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create mock props with defaults
 */
export function createMockProps<T extends object>(
    overrides: Partial<T> = {}
): T {
    return { ...overrides } as T
}

/**
 * Mock React Context value
 */
export function mockContextValue<T>(defaultValue: T, overrides: Partial<T> = {}): T {
    return { ...defaultValue, ...overrides }
}

/**
 * Test data factories
 */
export const factories = {
    user: (overrides: Partial<UserProfile> = {}): UserProfile => ({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: null,
        anonymous: false,
        created_at: new Date().toISOString(),
        ...overrides,
    }),

    chat: (overrides: Partial<ChatData> = {}): ChatData => ({
        id: 'test-chat-id',
        title: 'Test Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        model: 'gpt-4.1-nano',
        pinned: false,
        ...overrides,
    }),

    message: (overrides: Partial<MessageData> = {}): MessageData => ({
        id: 'test-message-id',
        chat_id: 'test-chat-id',
        role: 'user',
        content: 'Test message content',
        created_at: new Date().toISOString(),
        ...overrides,
    }),

    model: (overrides: Partial<ModelData> = {}): ModelData => ({
        id: 'gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        provider: 'openai',
        contextWindow: 128000,
        ...overrides,
    }),
}

// Type definitions for factories
interface UserProfile {
    id: string
    email: string
    name: string
    avatar_url: string | null
    anonymous: boolean
    created_at: string
}

interface ChatData {
    id: string
    title: string
    created_at: string
    updated_at: string
    model: string
    pinned: boolean
}

interface MessageData {
    id: string
    chat_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
}

interface ModelData {
    id: string
    name: string
    provider: string
    contextWindow: number
}

/**
 * DOM query helpers
 */
export const queries = {
    /**
     * Find button by accessible name
     */
    findButton: (container: HTMLElement, name: string) =>
        container.querySelector(`button[aria-label="${name}"], button:has-text("${name}")`),

    /**
     * Find input by label text
     */
    findInputByLabel: (container: HTMLElement, label: string) => {
        const labelElement = Array.from(container.querySelectorAll('label')).find(
            (el) => el.textContent?.includes(label)
        )
        if (labelElement) {
            const forAttr = labelElement.getAttribute('for')
            if (forAttr) {
                return container.querySelector(`#${forAttr}`)
            }
        }
        return null
    },
}

/**
 * Assertion helpers
 */
export const assertions = {
    /**
     * Assert element is visible
     */
    isVisible: (element: Element | null): boolean => {
        if (!element) return false
        const style = window.getComputedStyle(element)
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        )
    },

    /**
     * Assert element has class
     */
    hasClass: (element: Element | null, className: string): boolean => {
        return element?.classList.contains(className) ?? false
    },
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { userEvent }
