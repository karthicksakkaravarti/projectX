/**
 * Unit Tests: useFileUpload Hook
 * Tests for file upload handling logic
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileUpload } from '@/app/components/chat/use-file-upload'
import { toast } from '@/components/ui/toast'
import { checkFileUploadLimit, processFiles } from '@/lib/file-handling'

// Mock dependencies
jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

jest.mock('@/lib/file-handling', () => ({
    checkFileUploadLimit: jest.fn(),
    processFiles: jest.fn(),
}))

describe('useFileUpload Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should initialize with empty files', () => {
        const { result } = renderHook(() => useFileUpload())
        expect(result.current.files).toEqual([])
    })

    describe('handleFileUpload', () => {
        it('should add files to state', () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File([''], 'test.png', { type: 'image/png' })

            act(() => {
                result.current.handleFileUpload([file])
            })

            expect(result.current.files).toHaveLength(1)
            expect(result.current.files[0]).toBe(file)
        })
    })

    describe('handleFileRemove', () => {
        it('should remove file from state', () => {
            const { result } = renderHook(() => useFileUpload())
            const file1 = new File([''], '1.png', { type: 'image/png' })
            const file2 = new File([''], '2.png', { type: 'image/png' })

            act(() => {
                result.current.handleFileUpload([file1, file2])
            })

            act(() => {
                result.current.handleFileRemove(file1)
            })

            expect(result.current.files).toHaveLength(1)
            expect(result.current.files[0]).toBe(file2)
        })
    })

    describe('handleFileUploads process', () => {
        it('should return empty array if no files', async () => {
            const { result } = renderHook(() => useFileUpload())

            const attachments = await result.current.handleFileUploads('user-1', 'chat-1')

            expect(attachments).toEqual([])
        })

        it('should check limits and process files', async () => {
            (checkFileUploadLimit as jest.Mock).mockResolvedValue(true);
            (processFiles as jest.Mock).mockResolvedValue([{ url: 'processed-url' }])

            const { result } = renderHook(() => useFileUpload())
            const file = new File([''], 'test.png', { type: 'image/png' })

            act(() => {
                result.current.handleFileUpload([file])
            })

            let attachments;
            await act(async () => {
                attachments = await result.current.handleFileUploads('user-1', 'chat-1')
            })

            expect(checkFileUploadLimit).toHaveBeenCalledWith('user-1')
            expect(processFiles).toHaveBeenCalledWith([file], 'chat-1', 'user-1')
            expect(attachments).toEqual([{ url: 'processed-url' }])

            // Should clear files after successful process
            expect(result.current.files).toEqual([])
        })

        it('should handle limit error', async () => {
            const error = { code: 'DAILY_FILE_LIMIT_REACHED', message: 'Limit reached' };
            (checkFileUploadLimit as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => useFileUpload())
            const file = new File([''], 'test.png', { type: 'image/png' })

            act(() => {
                result.current.handleFileUpload([file])
            })

            const attachments = await result.current.handleFileUploads('user-1', 'chat-1')

            expect(attachments).toBeNull()
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
        })
    })

    describe('optimistic attachments', () => {
        it('should create optimistic attachments', () => {
            // Mock URL.createObjectURL
            global.URL.createObjectURL = jest.fn(() => 'blob:url')

            const { result } = renderHook(() => useFileUpload())
            const file = new File([''], 'test.png', { type: 'image/png' })

            const optimistic = result.current.createOptimisticAttachments([file])

            expect(optimistic[0].url).toBe('blob:url')
            expect(optimistic[0].contentType).toBe('image/png')
        })
    })
})
