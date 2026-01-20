/**
 * Unit Tests: Project Page (app/p/[projectId]/page.tsx)
 * 
 * This is a Next.js Server Component that handles authentication
 * and project verification before rendering the ProjectView.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock dependencies before importing Page
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
    redirect: (url: string) => {
        mockRedirect(url)
        throw new Error('NEXT_REDIRECT')
    }
}))

// Mock Supabase
const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockSupabaseClient = {
    auth: {
        getUser: mockGetUser
    },
    from: mockFrom
}

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

// Mock child components
jest.mock('@/app/components/layout/layout-app', () => ({
    LayoutApp: ({ children }: any) => <div data-testid="layout-app">{children}</div>
}))

jest.mock('@/app/p/[projectId]/project-view', () => ({
    ProjectView: ({ projectId }: any) => <div data-testid="project-view">{projectId}</div>
}))

jest.mock('@/lib/chat-store/messages/provider', () => ({
    MessagesProvider: ({ children }: any) => <div data-testid="messages-provider">{children}</div>
}))

// Import after mocks are set up
import Page from '@/app/p/[projectId]/page'

describe('Project Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('when Supabase is disabled', () => {
        beforeEach(() => {
            jest.doMock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: false
            }))
        })

        it('should render without authentication check', async () => {
            // Re-import with new mock
            jest.resetModules()
            jest.mock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: false
            }))

            const PageComponent = (await import('@/app/p/[projectId]/page')).default
            const params = Promise.resolve({ projectId: 'test-project-123' })

            const { container } = render(await PageComponent({ params }))

            expect(screen.getByTestId('messages-provider')).toBeInTheDocument()
            expect(screen.getByTestId('layout-app')).toBeInTheDocument()
            expect(screen.getByTestId('project-view')).toBeInTheDocument()
            expect(screen.getByText('test-project-123')).toBeInTheDocument()
        })
    })

    describe('when Supabase is enabled', () => {
        beforeEach(() => {
            jest.resetModules()
            jest.mock('@/lib/supabase/config', () => ({
                isSupabaseEnabled: true
            }))
        })

        it('should redirect if user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: null, error: new Error('No user') })

            const PageComponent = (await import('@/app/p/[projectId]/page')).default
            const params = Promise.resolve({ projectId: 'test-project-123' })

            await expect(PageComponent({ params })).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should redirect if project does not belong to user', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Not found')
                            })
                        })
                    })
                })
            })

            const PageComponent = (await import('@/app/p/[projectId]/page')).default
            const params = Promise.resolve({ projectId: 'test-project-123' })

            await expect(PageComponent({ params })).rejects.toThrow('NEXT_REDIRECT')
            expect(mockRedirect).toHaveBeenCalledWith('/')
        })

        it('should render when user owns the project', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null
            })

            mockFrom.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 'test-project-123', name: 'My Project' },
                                error: null
                            })
                        })
                    })
                })
            })

            const PageComponent = (await import('@/app/p/[projectId]/page')).default
            const params = Promise.resolve({ projectId: 'test-project-123' })

            const result = await PageComponent({ params })
            render(result)

            expect(screen.getByTestId('project-view')).toBeInTheDocument()
            expect(screen.getByText('test-project-123')).toBeInTheDocument()
        })
    })
})
