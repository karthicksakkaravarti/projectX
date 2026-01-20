/**
 * Unit Tests: Auth Callback Route
 * Tests for the OAuth callback handler
 */

import { GET } from '@/app/auth/callback/route'
import { NextResponse } from 'next/server'

// Mock variable for isSupabaseEnabled
let mockIsSupabaseEnabled = true

// Mock dependencies
jest.mock('@/lib/supabase/config', () => ({
    get isSupabaseEnabled() {
        return mockIsSupabaseEnabled
    },
}))

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

jest.mock('@/lib/supabase/server-guest', () => ({
    createGuestServerClient: jest.fn(),
}))

jest.mock('next/server', () => ({
    NextResponse: {
        redirect: jest.fn((url) => ({ redirect: url })),
    },
}))

// Import mocks after mocking
import { createClient } from '@/lib/supabase/server'
import { createGuestServerClient } from '@/lib/supabase/server-guest'

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockCreateGuestServerClient = createGuestServerClient as jest.MockedFunction<typeof createGuestServerClient>
const mockRedirect = NextResponse.redirect as jest.MockedFunction<typeof NextResponse.redirect>

describe('Auth Callback Route', () => {
    const mockRequest = (params: { code?: string; next?: string } = {}) => {
        const url = new URL('http://localhost:3000/auth/callback')
        if (params.code) url.searchParams.set('code', params.code)
        if (params.next) url.searchParams.set('next', params.next)
        
        return {
            url: url.toString(),
            headers: new Headers({
                host: 'localhost:3000',
            }),
        } as Request
    }

    const mockSupabase = {
        auth: {
            exchangeCodeForSession: jest.fn(),
        },
    }

    const mockSupabaseAdmin = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => {})
        mockIsSupabaseEnabled = true
        mockCreateClient.mockResolvedValue(mockSupabase as any)
        mockCreateGuestServerClient.mockResolvedValue(mockSupabaseAdmin as any)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Supabase configuration', () => {
        it('should redirect to error when Supabase is not enabled', async () => {
            mockIsSupabaseEnabled = false
            
            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error?message=')
            )
            // URL-encoded message
            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Supabase.*not.*enabled/i)
            )
        })

        it('should redirect to error when Supabase client is null', async () => {
            mockCreateClient.mockResolvedValue(null as any)
            
            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error?message=')
            )
        })

        it('should redirect to error when admin client is null', async () => {
            mockCreateGuestServerClient.mockResolvedValue(null as any)
            
            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error?message=')
            )
        })
    })

    describe('authentication code validation', () => {
        it('should redirect to error when code is missing', async () => {
            const request = mockRequest()
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error?message=')
            )
            // URL-encoded message
            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Missing.*authentication.*code/i)
            )
        })

        it('should redirect to error when code is empty', async () => {
            const request = mockRequest({ code: '' })
            await GET(request)

            // URL-encoded message
            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Missing.*authentication.*code/i)
            )
        })
    })

    describe('successful authentication', () => {
        it('should exchange code for session', async () => {
            const code = 'valid-auth-code'
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code })
            await GET(request)

            expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(code)
        })

        it('should insert new user into database', async () => {
            const userId = 'user-123'
            const userEmail = 'test@example.com'
            
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: userId, email: userEmail },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users')
            expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userId,
                    email: userEmail,
                    message_count: 0,
                    premium: false,
                })
            )
        })

        it('should redirect to home by default', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('http://localhost:3000/')
            )
        })

        it('should redirect to custom next path', async () => {
            const nextPath = '/dashboard'
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code: 'test-code', next: nextPath })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining(nextPath)
            )
        })

        it('should set default favorite models', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    favorite_models: expect.any(Array),
                })
            )
        })
    })

    describe('authentication errors', () => {
        it('should redirect to error when session exchange fails', async () => {
            const errorMessage = 'Invalid code'
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: null,
                error: new Error(errorMessage) as any,
            } as any)

            const request = mockRequest({ code: 'invalid-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('/auth/error?message=')
            )
            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining(encodeURIComponent(errorMessage))
            )
        })

        it('should log auth errors to console', async () => {
            const errorMessage = 'Auth failed'
            const consoleErrorSpy = jest.spyOn(console, 'error')
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: null,
                error: new Error(errorMessage) as any,
            } as any)

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Auth error:',
                expect.any(Error)
            )
        })
    })

    describe('user validation', () => {
        it('should redirect to error when user is missing', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: { user: null, session: {} },
                error: null,
            } as any)

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Missing.*user.*info/i)
            )
        })

        it('should redirect to error when user ID is missing', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: null, email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Missing.*user.*info/i)
            )
        })

        it('should redirect to error when user email is missing', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: null },
                    session: {},
                },
                error: null,
            } as any)

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/Missing.*user.*info/i)
            )
        })
    })

    describe('user insertion errors', () => {
        it('should handle duplicate user error (23505)', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({
                error: { code: '23505', message: 'duplicate key' } as any,
            })

            const request = mockRequest({ code: 'test-code' })
            const result = await GET(request)

            // Should not log error for duplicate user
            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringContaining('http://localhost:3000/')
            )
        })

        it('should log non-duplicate insert errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error')
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({
                error: { code: 'OTHER_ERROR', message: 'Database error' } as any,
            })

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Error inserting user:',
                expect.any(Object)
            )
        })

        it('should handle unexpected insert errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error')
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockRejectedValue(new Error('Unexpected error'))

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Unexpected user insert error:',
                expect.any(Error)
            )
        })
    })

    describe('protocol detection', () => {
        it('should use http for localhost', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const request = mockRequest({ code: 'test-code' })
            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/^http:/)
            )
        })

        it('should use https for production domains', async () => {
            mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: {},
                },
                error: null,
            } as any)
            mockSupabaseAdmin.insert.mockResolvedValue({ error: null })

            const url = new URL('http://example.com/auth/callback')
            url.searchParams.set('code', 'test-code')
            
            const request = {
                url: url.toString(),
                headers: new Headers({
                    host: 'example.com',
                }),
            } as Request

            await GET(request)

            expect(mockRedirect).toHaveBeenCalledWith(
                expect.stringMatching(/^https:/)
            )
        })
    })
})
