/**
 * Unit Tests: app/components/chat/get-sources.ts
 */

import { getSources } from '@/app/components/chat/get-sources'
import type { Message as MessageAISDK } from '@/app/types/chat.types'

describe('getSources', () => {
    describe('Empty and null inputs', () => {
        it('should return empty array for undefined parts', () => {
            expect(getSources(undefined)).toEqual([])
        })

        it('should return empty array for empty parts array', () => {
            expect(getSources([])).toEqual([])
        })
    })

    describe('Source type parts', () => {
        it('should extract sources from source type parts', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: { url: 'https://example.com', title: 'Example' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ url: 'https://example.com', title: 'Example' })
        })

        it('should extract multiple sources', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: { url: 'https://example1.com', title: 'Example 1' }
                },
                {
                    type: 'source',
                    source: { url: 'https://example2.com', title: 'Example 2' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(2)
        })
    })

    describe('Tool invocation parts', () => {
        it('should extract sources from tool invocation results', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'search',
                        state: 'result',
                        result: [
                            { url: 'https://search-result.com', title: 'Search Result' }
                        ],
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ url: 'https://search-result.com', title: 'Search Result' })
        })

        it('should handle summarizeSources tool with citations', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'summarizeSources',
                        state: 'result',
                        result: {
                            result: [
                                {
                                    citations: [
                                        { url: 'https://citation1.com', title: 'Citation 1' },
                                        { url: 'https://citation2.com', title: 'Citation 2' }
                                    ]
                                }
                            ]
                        },
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(2)
        })

        it('should ignore tool invocations that are not in result state', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'search',
                        state: 'call',
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(0)
        })

        it('should handle non-array tool results', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'singleResult',
                        state: 'result',
                        result: { url: 'https://single.com', title: 'Single' },
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
        })
    })

    describe('Mixed part types', () => {
        it('should handle mixed source and tool-invocation parts', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: { url: 'https://source.com', title: 'Source' }
                },
                {
                    type: 'text',
                    text: 'Some text'
                },
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'search',
                        state: 'result',
                        result: [
                            { url: 'https://tool-result.com', title: 'Tool Result' }
                        ],
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(2)
        })

        it('should filter out non-source/tool-invocation parts', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'text',
                    text: 'Some text'
                },
                {
                    type: 'source',
                    source: { url: 'https://valid.com', title: 'Valid' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
            expect(result[0].url).toBe('https://valid.com')
        })
    })

    describe('Source validation', () => {
        it('should filter out sources without url', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: { title: 'No URL' } as { url: string; title: string }
                },
                {
                    type: 'source',
                    source: { url: 'https://valid.com', title: 'Valid' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
            expect(result[0].url).toBe('https://valid.com')
        })

        it('should filter out sources with empty url', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: { url: '', title: 'Empty URL' }
                },
                {
                    type: 'source',
                    source: { url: 'https://valid.com', title: 'Valid' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
            expect(result[0].url).toBe('https://valid.com')
        })

        it('should filter out non-object sources', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'source',
                    source: null as unknown as { url: string }
                },
                {
                    type: 'source',
                    source: 'string' as unknown as { url: string }
                },
                {
                    type: 'source',
                    source: { url: 'https://valid.com', title: 'Valid' }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(1)
        })
    })

    describe('Flattening nested arrays', () => {
        it('should flatten nested array results from tools', () => {
            const parts: MessageAISDK['parts'] = [
                {
                    type: 'tool-invocation',
                    toolInvocation: {
                        toolName: 'multiSearch',
                        state: 'result',
                        result: [
                            [
                                { url: 'https://nested1.com', title: 'Nested 1' },
                                { url: 'https://nested2.com', title: 'Nested 2' }
                            ]
                        ],
                        toolCallId: 'test-id',
                        args: {}
                    }
                }
            ]

            const result = getSources(parts)
            expect(result).toHaveLength(2)
        })
    })
})
