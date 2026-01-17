/**
 * Integration Tests: Chat API Logic
 */

import { validateAndTrackUsage } from '@/app/api/chat/api'
import { getAllModels } from '@/lib/models'
import { getProviderForModel } from '@/lib/openproviders/provider-map'

// Mock dependencies
jest.mock('@/lib/models', () => ({
    getAllModels: jest.fn().mockResolvedValue([
        {
            id: 'gpt-4.1-nano',
            name: 'GPT-4.1 Nano',
            provider: 'openai',
            apiSdk: jest.fn().mockReturnValue({}),
        },
    ]),
}))

jest.mock('@/lib/openproviders/provider-map', () => ({
    getProviderForModel: jest.fn().mockReturnValue('openai'),
}))

jest.mock('@/lib/usage', () => ({
    checkDailyMessageLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 995,
        limit: 1000,
        resetTime: new Date().toISOString(),
    }),
    checkProModelLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 495,
        limit: 500,
        resetTime: new Date().toISOString(),
    }),
}))

jest.mock('@/lib/user-keys', () => ({
    getUserApiKey: jest.fn().mockResolvedValue('test-api-key'),
}))

describe('Chat API Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('validateAndTrackUsage', () => {
        it('should return null for valid authenticated user', async () => {
            const result = await validateAndTrackUsage(
                'test-user-id',
                'gpt-4.1-nano',
                true
            )

            expect(result).toBeNull()
        })

        it('should return error for rate limit exceeded', async () => {
            const { checkDailyMessageLimit } = require('@/lib/usage')
            checkDailyMessageLimit.mockResolvedValueOnce({
                allowed: false,
                remaining: 0,
                limit: 5,
                resetTime: new Date().toISOString(),
            })

            const result = await validateAndTrackUsage(
                'guest-user-id',
                'gpt-4.1-nano',
                false
            )

            expect(result).toBeTruthy()
            expect(result?.error).toContain('Daily message limit')
        })

        it('should return error for pro model limit exceeded', async () => {
            const { checkProModelLimit } = require('@/lib/usage')
            checkProModelLimit.mockResolvedValueOnce({
                allowed: false,
                remaining: 0,
                limit: 500,
                resetTime: new Date().toISOString(),
            })

            const result = await validateAndTrackUsage(
                'test-user-id',
                'gpt-4o',
                true
            )

            expect(result).toBeTruthy()
            expect(result?.error).toContain('pro model')
        })
    })

    describe('getAllModels', () => {
        it('should return available models', async () => {
            const models = await getAllModels()

            expect(Array.isArray(models)).toBe(true)
            expect(models.length).toBeGreaterThan(0)
            expect(models[0]).toHaveProperty('id')
            expect(models[0]).toHaveProperty('name')
            expect(models[0]).toHaveProperty('provider')
        })
    })

    describe('getProviderForModel', () => {
        it('should return correct provider for model', () => {
            const provider = getProviderForModel('gpt-4.1-nano')

            expect(provider).toBe('openai')
        })
    })
})
