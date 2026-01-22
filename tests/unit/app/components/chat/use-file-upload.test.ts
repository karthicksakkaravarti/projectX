/**
 * Unit Tests: useFileUpload hook
 */

import { renderHook, act, waitFor } from "@testing-library/react"
import { useFileUpload } from "@/app/components/chat/use-file-upload"

// Mock dependencies
jest.mock("@/components/ui/toast", () => ({
    toast: jest.fn(),
}))

jest.mock("@/lib/file-handling", () => ({
    checkFileUploadLimit: jest.fn(),
    processFiles: jest.fn(),
}))

// Mock URL methods
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

describe("useFileUpload", () => {
    const mockToast = require("@/components/ui/toast").toast
    const { checkFileUploadLimit, processFiles } = require("@/lib/file-handling")
    
    beforeEach(() => {
        jest.clearAllMocks()
        checkFileUploadLimit.mockResolvedValue(undefined)
        processFiles.mockResolvedValue([])
        URL.createObjectURL = jest.fn(() => "blob:test-url")
        URL.revokeObjectURL = jest.fn()
    })

    afterAll(() => {
        URL.createObjectURL = originalCreateObjectURL
        URL.revokeObjectURL = originalRevokeObjectURL
    })

    describe("initial state", () => {
        it("should initialize with empty files array", () => {
            const { result } = renderHook(() => useFileUpload())
            expect(result.current.files).toEqual([])
        })
    })

    describe("handleFileUpload", () => {
        it("should add files to the state", () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })

            act(() => {
                result.current.handleFileUpload([file])
            })

            expect(result.current.files).toHaveLength(1)
            expect(result.current.files[0]).toBe(file)
        })

        it("should append to existing files", () => {
            const { result } = renderHook(() => useFileUpload())
            const file1 = new File(["test1"], "test1.txt", { type: "text/plain" })
            const file2 = new File(["test2"], "test2.txt", { type: "text/plain" })

            act(() => {
                result.current.handleFileUpload([file1])
            })
            act(() => {
                result.current.handleFileUpload([file2])
            })

            expect(result.current.files).toHaveLength(2)
        })
    })

    describe("handleFileRemove", () => {
        it("should remove specific file from state", () => {
            const { result } = renderHook(() => useFileUpload())
            const file1 = new File(["test1"], "test1.txt", { type: "text/plain" })
            const file2 = new File(["test2"], "test2.txt", { type: "text/plain" })

            act(() => {
                result.current.handleFileUpload([file1, file2])
            })

            expect(result.current.files).toHaveLength(2)

            act(() => {
                result.current.handleFileRemove(file1)
            })

            expect(result.current.files).toHaveLength(1)
            expect(result.current.files[0]).toBe(file2)
        })
    })

    describe("handleFileUploads", () => {
        it("should return empty array when no files", async () => {
            const { result } = renderHook(() => useFileUpload())

            let uploadResult: any
            await act(async () => {
                uploadResult = await result.current.handleFileUploads("user-123", "chat-456")
            })

            expect(uploadResult).toEqual([])
        })

        it("should process files successfully", async () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })
            const processedAttachment = { name: "test.txt", url: "https://example.com/test.txt" }
            
            processFiles.mockResolvedValue([processedAttachment])

            act(() => {
                result.current.handleFileUpload([file])
            })

            let uploadResult: any
            await act(async () => {
                uploadResult = await result.current.handleFileUploads("user-123", "chat-456")
            })

            expect(uploadResult).toEqual([processedAttachment])
            expect(checkFileUploadLimit).toHaveBeenCalledWith("user-123")
            expect(processFiles).toHaveBeenCalledWith([file], "chat-456", "user-123")
            expect(result.current.files).toEqual([])
        })

        it("should return null and show toast when daily limit reached", async () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })
            
            checkFileUploadLimit.mockRejectedValue({
                code: "DAILY_FILE_LIMIT_REACHED",
                message: "You have reached your daily limit"
            })

            act(() => {
                result.current.handleFileUpload([file])
            })

            let uploadResult: any
            await act(async () => {
                uploadResult = await result.current.handleFileUploads("user-123", "chat-456")
            })

            expect(uploadResult).toBeNull()
            expect(mockToast).toHaveBeenCalledWith({
                title: "You have reached your daily limit",
                status: "error"
            })
        })

        it("should use default message when daily limit reached without message", async () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })
            
            checkFileUploadLimit.mockRejectedValue({
                code: "DAILY_FILE_LIMIT_REACHED"
            })

            act(() => {
                result.current.handleFileUpload([file])
            })

            await act(async () => {
                await result.current.handleFileUploads("user-123", "chat-456")
            })

            expect(mockToast).toHaveBeenCalledWith({
                title: "Daily file limit reached",
                status: "error"
            })
        })

        it("should continue when checkFileUploadLimit throws non-limit error", async () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })
            const processedAttachment = { name: "test.txt", url: "https://example.com/test.txt" }
            
            checkFileUploadLimit.mockRejectedValue({
                code: "OTHER_ERROR",
                message: "Some other error"
            })
            processFiles.mockResolvedValue([processedAttachment])

            act(() => {
                result.current.handleFileUpload([file])
            })

            let uploadResult: any
            await act(async () => {
                uploadResult = await result.current.handleFileUploads("user-123", "chat-456")
            })

            // Should continue and process files despite other error
            expect(uploadResult).toEqual([processedAttachment])
        })

        it("should return null and show toast when processFiles fails", async () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })
            
            processFiles.mockRejectedValue(new Error("Processing failed"))

            act(() => {
                result.current.handleFileUpload([file])
            })

            let uploadResult: any
            await act(async () => {
                uploadResult = await result.current.handleFileUploads("user-123", "chat-456")
            })

            expect(uploadResult).toBeNull()
            expect(mockToast).toHaveBeenCalledWith({
                title: "Failed to process files",
                status: "error"
            })
        })
    })

    describe("createOptimisticAttachments", () => {
        it("should create optimistic attachments for image files", () => {
            const { result } = renderHook(() => useFileUpload())
            const imageFile = new File(["test"], "test.png", { type: "image/png" })

            const attachments = result.current.createOptimisticAttachments([imageFile])

            expect(attachments).toEqual([{
                name: "test.png",
                contentType: "image/png",
                url: "blob:test-url"
            }])
            expect(URL.createObjectURL).toHaveBeenCalledWith(imageFile)
        })

        it("should create optimistic attachments for non-image files with empty url", () => {
            const { result } = renderHook(() => useFileUpload())
            const textFile = new File(["test"], "test.txt", { type: "text/plain" })

            const attachments = result.current.createOptimisticAttachments([textFile])

            expect(attachments).toEqual([{
                name: "test.txt",
                contentType: "text/plain",
                url: ""
            }])
        })

        it("should handle multiple files", () => {
            const { result } = renderHook(() => useFileUpload())
            const imageFile = new File(["test"], "test.png", { type: "image/png" })
            const textFile = new File(["test"], "test.txt", { type: "text/plain" })

            const attachments = result.current.createOptimisticAttachments([imageFile, textFile])

            expect(attachments).toHaveLength(2)
            expect(attachments[0].url).toBe("blob:test-url")
            expect(attachments[1].url).toBe("")
        })
    })

    describe("cleanupOptimisticAttachments", () => {
        it("should revoke blob URLs", () => {
            const { result } = renderHook(() => useFileUpload())
            const attachments = [
                { url: "blob:test-url-1" },
                { url: "blob:test-url-2" }
            ]

            result.current.cleanupOptimisticAttachments(attachments)

            expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url-1")
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url-2")
        })

        it("should not revoke non-blob URLs", () => {
            const { result } = renderHook(() => useFileUpload())
            const attachments = [
                { url: "https://example.com/image.png" },
                { url: "" }
            ]

            result.current.cleanupOptimisticAttachments(attachments)

            expect(URL.revokeObjectURL).not.toHaveBeenCalled()
        })

        it("should handle undefined attachments", () => {
            const { result } = renderHook(() => useFileUpload())

            // Should not throw
            result.current.cleanupOptimisticAttachments(undefined)

            expect(URL.revokeObjectURL).not.toHaveBeenCalled()
        })

        it("should handle attachments without url", () => {
            const { result } = renderHook(() => useFileUpload())
            const attachments = [
                { url: undefined },
                {}
            ]

            result.current.cleanupOptimisticAttachments(attachments)

            expect(URL.revokeObjectURL).not.toHaveBeenCalled()
        })

        it("should handle mixed attachments", () => {
            const { result } = renderHook(() => useFileUpload())
            const attachments = [
                { url: "blob:test-url" },
                { url: "https://example.com/image.png" },
                { url: undefined }
            ]

            result.current.cleanupOptimisticAttachments(attachments)

            expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url")
        })
    })

    describe("setFiles", () => {
        it("should allow directly setting files", () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })

            act(() => {
                result.current.setFiles([file])
            })

            expect(result.current.files).toEqual([file])
        })

        it("should allow clearing files", () => {
            const { result } = renderHook(() => useFileUpload())
            const file = new File(["test"], "test.txt", { type: "text/plain" })

            act(() => {
                result.current.handleFileUpload([file])
            })
            
            expect(result.current.files).toHaveLength(1)

            act(() => {
                result.current.setFiles([])
            })

            expect(result.current.files).toEqual([])
        })
    })
})
