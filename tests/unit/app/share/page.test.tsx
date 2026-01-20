/**
 * Unit Tests: Share Chat Page (app/share/[chatId]/page.tsx)
 * 
 * This is a Next.js Server Component that fetches chat data
 * and renders the Article component for shared chats.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock navigation functions
const mockRedirect = jest.fn()
const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
    redirect: (url: string) => {
        mockRedirect(url)
        throw new Error('NEXT_REDIRECT')
    },
    notFound: () => {
        mockNotFound()
        throw new Error('NEXT_NOT_FOUND')
    }
}))

// Mock Supabase
const mockFrom = jest.fn()
const mockSupabaseClient = {
    from: mockFrom
}

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

// Mock Article component
jest.mock('@/app/share/[chatId]/article', () => ({
    __esModule: true,
    default: ({ title, subtitle, date, messages }: any) => (
        <div data-testid="article">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <time>{date}</time>
            <div data-testid="messages-count">{messages.length} messages</div>
        </div>
    )
}))

jest.mock('@/lib/config', () => ({
    APP_DOMAIN: 'https://projectx.com'
}))

describe('Share Chat Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('when Supabase is disabled', () => {
        beforeEach(() => {
            jest.resetModules()
            jest.mock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: false
            }))
        })

        it('should return notFound', async () => {
            const PageModule = await import('@/app/share/[chatId]/page')
            const ShareChat = PageModule.default
            const params = Promise.resolve({ chatId: 'chat-123' })

            await expect(ShareChat({ params })).rejects.toThrow('NEXT_NOT_FOUND')
            expect(mockNotFound).toHaveBeenCalled()
        })
    })

    describe('when Supabase is enabled', () => {
        beforeEach(() => {
            jest.resetModules()
            jest.mock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: true
            }))
        })

        it('should redirect if chat not found', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'chats') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: new Error('Not found')
                                })
                            })
                        })
                    }
                }
                return {}
            })

            const PageModule = await import('@/app/share/[chatId]/page')
            const ShareChat = PageModule.default
            const params = Promise.resolve({ chatId: 'chat-123' })

            await expect(ShareChat({ params })).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should redirect if messages not found', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'chats') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { id: 'chat-123', title: 'Test Chat', created_at: '2024-01-01' },
                                    error: null
                                })
                            })
                        })
                    }
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                order: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: new Error('No messages')
                                })
                            })
                        })
                    }
                }
                return {}
            })

            const PageModule = await import('@/app/share/[chatId]/page')
            const ShareChat = PageModule.default
            const params = Promise.resolve({ chatId: 'chat-123' })

            await expect(ShareChat({ params })).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should render Article when chat and messages are found', async () => {
            const mockMessages = [
                { id: '1', role: 'user', content: 'Hello' },
                { id: '2', role: 'assistant', content: 'Hi there!' }
            ]

            mockFrom.mockImplementation((table: string) => {
                if (table === 'chats') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: {
                                        id: 'chat-123',
                                        title: 'Test Chat',
                                        created_at: '2024-01-15'
                                    },
                                    error: null
                                })
                            })
                        })
                    }
                }
                if (table === 'messages') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                order: jest.fn().mockResolvedValue({
                                    data: mockMessages,
                                    error: null
                                })
                            })
                        })
                    }
                }
                return {}
            })

            const PageModule = await import('@/app/share/[chatId]/page')
            const ShareChat = PageModule.default
            const params = Promise.resolve({ chatId: 'chat-123' })

            const result = await ShareChat({ params })
            render(result)

            expect(screen.getByTestId('article')).toBeInTheDocument()
            expect(screen.getByText('Test Chat')).toBeInTheDocument()
            expect(screen.getByText('A conversation in ProjectX')).toBeInTheDocument()
            expect(screen.getByText('2 messages')).toBeInTheDocument()
        })
    })

    describe('generateMetadata', () => {
        beforeEach(() => {
            jest.resetModules()
            jest.mock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: true
            }))
        })

        it('should return metadata with chat title', async () => {
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { title: 'My Amazing Chat', created_at: '2024-01-01' },
                            error: null
                        })
                    })
                })
            })

            const PageModule = await import('@/app/share/[chatId]/page')
            const { generateMetadata } = PageModule
            const params = Promise.resolve({ chatId: 'chat-123' })

            const metadata = await generateMetadata({ params })

            expect(metadata.title).toBe('My Amazing Chat')
            expect(metadata.description).toBe('A chat in ProjectX')
            expect(metadata.openGraph?.url).toBe('https://projectx.com/share/chat-123')
        })

        it('should use default title if chat has no title', async () => {
            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { title: null, created_at: '2024-01-01' },
                            error: null
                        })
                    })
                })
            })

            const PageModule = await import('@/app/share/[chatId]/page')
            const { generateMetadata } = PageModule
            const params = Promise.resolve({ chatId: 'chat-123' })

            const metadata = await generateMetadata({ params })

            expect(metadata.title).toBe('Chat')
        })
    })
})
