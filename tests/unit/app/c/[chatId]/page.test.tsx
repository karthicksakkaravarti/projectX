/**
 * Unit Tests: Chat Page Component
 * Tests for the dynamic chat page route [chatId]
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import Page from '@/app/c/[chatId]/page'

// Mock variable for isSupabaseEnabled
let mockIsSupabaseEnabled = true

// Mock dependencies
jest.mock('@/app/components/chat/chat-container', () => ({
    ChatContainer: () => <div data-testid="chat-container">Chat Container</div>,
}))

jest.mock('@/app/components/layout/layout-app', () => ({
    LayoutApp: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="layout-app">{children}</div>
    ),
}))

jest.mock('@/lib/chat-store/messages/provider', () => ({
    MessagesProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="messages-provider">{children}</div>
    ),
}))

jest.mock('@/lib/supabase/config', () => ({
    get isSupabaseEnabled() {
        return mockIsSupabaseEnabled
    },
}))

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

jest.mock('next/navigation', () => ({
    redirect: jest.fn(() => {
        throw new Error('NEXT_REDIRECT')
    }),
}))

// Import mocks after mocking
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as supabaseConfig from '@/lib/supabase/config'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Chat Page [chatId]', () => {
    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockIsSupabaseEnabled = true
        mockCreateClient.mockResolvedValue(mockSupabase as any)
    })

    describe('rendering', () => {
        it('should render ChatContainer when authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            const Component = await Page()
            render(Component)

            expect(screen.getByTestId('chat-container')).toBeInTheDocument()
        })

        it('should render MessagesProvider wrapper', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            const Component = await Page()
            render(Component)

            expect(screen.getByTestId('messages-provider')).toBeInTheDocument()
        })

        it('should render LayoutApp wrapper', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            const Component = await Page()
            render(Component)

            expect(screen.getByTestId('layout-app')).toBeInTheDocument()
        })

        it('should render when Supabase is disabled', async () => {
            mockIsSupabaseEnabled = false

            const Component = await Page()
            render(Component)

            expect(screen.getByTestId('chat-container')).toBeInTheDocument()
        })
    })

    describe('authentication', () => {
        it('should redirect to home when user is not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            } as any)

            await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should redirect when getUser returns error', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: null,
                error: new Error('Auth error') as any,
            } as any)

            await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should redirect when user data is missing', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: null,
                error: null,
            } as any)

            await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should check authentication when Supabase is enabled', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            await Page()

            expect(mockSupabase.auth.getUser).toHaveBeenCalled()
        })

        it('should not check authentication when Supabase is disabled', async () => {
            mockIsSupabaseEnabled = false

            await Page()

            expect(mockSupabase.auth.getUser).not.toHaveBeenCalled()
        })
    })

    describe('Supabase client handling', () => {
        it('should skip auth check when Supabase client is null', async () => {
            mockCreateClient.mockResolvedValue(null as any)

            const Component = await Page()
            render(Component)

            expect(screen.getByTestId('chat-container')).toBeInTheDocument()
            expect(mockRedirect).not.toHaveBeenCalled()
        })

        it('should create Supabase client when enabled', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            await Page()

            expect(mockCreateClient).toHaveBeenCalled()
        })

        it('should not create Supabase client when disabled', async () => {
            mockIsSupabaseEnabled = false

            await Page()

            expect(mockCreateClient).not.toHaveBeenCalled()
        })
    })

    describe('component hierarchy', () => {
        it('should render components in correct order', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123', email: 'test@example.com' } },
                error: null,
            } as any)

            const Component = await Page()
            const { container } = render(Component)

            const messagesProvider = screen.getByTestId('messages-provider')
            const layoutApp = screen.getByTestId('layout-app')
            const chatContainer = screen.getByTestId('chat-container')

            // Check hierarchy
            expect(messagesProvider).toContainElement(layoutApp)
            expect(layoutApp).toContainElement(chatContainer)
        })
    })

    describe('edge cases', () => {
        it('should handle async errors in getUser', async () => {
            mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

            await expect(Page()).rejects.toThrow()
        })

        it('should handle undefined user object', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: undefined },
                error: null,
            } as any)

            await expect(Page()).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })
    })
})
