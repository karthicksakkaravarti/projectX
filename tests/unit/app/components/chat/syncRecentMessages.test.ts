/**
 * Unit Tests: syncRecentMessages
 * Tests for the function that syncs message IDs from DB to local state
 */

import { syncRecentMessages } from '@/app/components/chat/syncRecentMessages'
import { getLastMessagesFromDb } from '@/lib/chat-store/messages/api'
import { writeToIndexedDB } from '@/lib/chat-store/persist'

jest.mock('@/lib/chat-store/messages/api', () => ({
    getLastMessagesFromDb: jest.fn(),
}))

jest.mock('@/lib/chat-store/persist', () => ({
    writeToIndexedDB: jest.fn(),
}))

const mockGetLastMessages = getLastMessagesFromDb as jest.Mock
const mockWriteDB = writeToIndexedDB as jest.Mock

describe('syncRecentMessages', () => {
    const setMessages = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        // Default implementation for setMessages: execute the updater function immediately
        setMessages.mockImplementation((updater) => {
            if (typeof updater === 'function') {
                return updater([])
            }
            return updater
        })
    })

    it('should do nothing if no messages form DB', async () => {
        mockGetLastMessages.mockResolvedValue([])

        await syncRecentMessages('chat-1', setMessages)

        // Should NOT call setMessages
        expect(setMessages).not.toHaveBeenCalled()
    })

    it('should update local messages with DB IDs if matching role found', async () => {
        const dbMessages = [
            { id: 'db-1', role: 'user', createdAt: new Date('2023-01-01') },
            { id: 'db-2', role: 'assistant', createdAt: new Date('2023-01-02') },
        ]
        mockGetLastMessages.mockResolvedValue(dbMessages)

        const localMessages = [
            { id: 'optimistic-1', role: 'user', content: 'hello' },
            { id: 'optimistic-2', role: 'assistant', content: 'hi' },
        ]

        // We need to capture the updater passed to setMessages
        let capturedUpdater: any
        setMessages.mockImplementation((updater) => {
            capturedUpdater = updater
        })

        await syncRecentMessages('chat-1', setMessages)

        expect(setMessages).toHaveBeenCalled()

        const result = capturedUpdater(localMessages)

        expect(result[0].id).toBe('db-1')
        expect(result[1].id).toBe('db-2')
        expect(mockWriteDB).toHaveBeenCalledWith('messages', {
            id: 'chat-1',
            messages: result
        })
    })

    it('should skip messages with non-matching roles', async () => {
        const dbMessages = [
            { id: 'db-1', role: 'user' },
        ]
        mockGetLastMessages.mockResolvedValue(dbMessages)

        const localMessages = [
            { id: 'optimistic-1', role: 'assistant' }, // Mismatch
        ]

        let capturedUpdater: any
        setMessages.mockImplementation((updater) => {
            capturedUpdater = updater
        })

        await syncRecentMessages('chat-1', setMessages)

        const result = capturedUpdater(localMessages)

        // Should not have changed
        expect(result[0].id).toBe('optimistic-1')
        expect(mockWriteDB).not.toHaveBeenCalled()
    })

    it('should handle optimistic messages without changes if IDs already match', async () => {
        const dbMessages = [
            { id: 'msg-1', role: 'user' },
        ]
        mockGetLastMessages.mockResolvedValue(dbMessages)

        const localMessages = [
            { id: 'msg-1', role: 'user' },
        ]

        let capturedUpdater: any
        setMessages.mockImplementation((updater) => {
            capturedUpdater = updater
        })

        await syncRecentMessages('chat-1', setMessages)

        const result = capturedUpdater(localMessages)
        expect(mockWriteDB).not.toHaveBeenCalled()
    })
})
