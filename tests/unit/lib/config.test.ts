/**
 * Unit Tests: lib/config.ts
 */

import {
    NON_AUTH_DAILY_MESSAGE_LIMIT,
    AUTH_DAILY_MESSAGE_LIMIT,
    REMAINING_QUERY_ALERT_THRESHOLD,
    DAILY_FILE_UPLOAD_LIMIT,
    DAILY_LIMIT_PRO_MODELS,
    NON_AUTH_ALLOWED_MODELS,
    FREE_MODELS_IDS,
    MODEL_DEFAULT,
    APP_NAME,
    APP_DOMAIN,
    SUGGESTIONS,
    SYSTEM_PROMPT_DEFAULT,
    MESSAGE_MAX_LENGTH,
} from '@/lib/config'

describe('lib/config', () => {
    describe('Rate Limits', () => {
        it('should have correct non-auth daily message limit', () => {
            expect(NON_AUTH_DAILY_MESSAGE_LIMIT).toBe(5)
        })

        it('should have correct auth daily message limit', () => {
            expect(AUTH_DAILY_MESSAGE_LIMIT).toBe(1000)
        })

        it('should have correct remaining query alert threshold', () => {
            expect(REMAINING_QUERY_ALERT_THRESHOLD).toBe(2)
        })

        it('should have correct daily file upload limit', () => {
            expect(DAILY_FILE_UPLOAD_LIMIT).toBe(5)
        })

        it('should have correct daily limit for pro models', () => {
            expect(DAILY_LIMIT_PRO_MODELS).toBe(500)
        })

        it('auth limit should be greater than non-auth limit', () => {
            expect(AUTH_DAILY_MESSAGE_LIMIT).toBeGreaterThan(NON_AUTH_DAILY_MESSAGE_LIMIT)
        })
    })

    describe('Models', () => {
        it('should have non-auth allowed models array', () => {
            expect(Array.isArray(NON_AUTH_ALLOWED_MODELS)).toBe(true)
            expect(NON_AUTH_ALLOWED_MODELS.length).toBeGreaterThan(0)
        })

        it('should have free models array', () => {
            expect(Array.isArray(FREE_MODELS_IDS)).toBe(true)
            expect(FREE_MODELS_IDS.length).toBeGreaterThan(0)
        })

        it('should have a default model', () => {
            expect(MODEL_DEFAULT).toBeDefined()
            expect(typeof MODEL_DEFAULT).toBe('string')
        })

        it('default model should be in non-auth allowed models', () => {
            expect(NON_AUTH_ALLOWED_MODELS).toContain(MODEL_DEFAULT)
        })

        it('default model should be in free models', () => {
            expect(FREE_MODELS_IDS).toContain(MODEL_DEFAULT)
        })
    })

    describe('App Configuration', () => {
        it('should have app name', () => {
            expect(APP_NAME).toBe('ProjectX')
        })

        it('should have valid app domain', () => {
            expect(APP_DOMAIN).toMatch(/^https?:\/\//)
        })

        it('should have max message length', () => {
            expect(MESSAGE_MAX_LENGTH).toBe(10000)
            expect(MESSAGE_MAX_LENGTH).toBeGreaterThan(0)
        })
    })

    describe('Suggestions', () => {
        it('should have suggestions array', () => {
            expect(Array.isArray(SUGGESTIONS)).toBe(true)
            expect(SUGGESTIONS.length).toBeGreaterThan(0)
        })

        it('each suggestion should have required properties', () => {
            SUGGESTIONS.forEach((suggestion) => {
                expect(suggestion).toHaveProperty('label')
                expect(suggestion).toHaveProperty('highlight')
                expect(suggestion).toHaveProperty('prompt')
                expect(suggestion).toHaveProperty('items')
                expect(suggestion).toHaveProperty('icon')
            })
        })

        it('each suggestion should have items array', () => {
            SUGGESTIONS.forEach((suggestion) => {
                expect(Array.isArray(suggestion.items)).toBe(true)
                expect(suggestion.items.length).toBeGreaterThan(0)
            })
        })

        it('should have specific suggestion categories', () => {
            const labels = SUGGESTIONS.map((s) => s.label)
            expect(labels).toContain('Summary')
            expect(labels).toContain('Code')
            expect(labels).toContain('Design')
            expect(labels).toContain('Research')
        })
    })

    describe('System Prompt', () => {
        it('should have a default system prompt', () => {
            expect(SYSTEM_PROMPT_DEFAULT).toBeDefined()
            expect(typeof SYSTEM_PROMPT_DEFAULT).toBe('string')
        })

        it('system prompt should mention ProjectX', () => {
            expect(SYSTEM_PROMPT_DEFAULT).toContain('ProjectX')
        })

        it('system prompt should be a reasonable length', () => {
            expect(SYSTEM_PROMPT_DEFAULT.length).toBeGreaterThan(100)
            expect(SYSTEM_PROMPT_DEFAULT.length).toBeLessThan(2000)
        })
    })
})
