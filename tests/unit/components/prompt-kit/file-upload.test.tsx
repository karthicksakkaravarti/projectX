/**
 * Unit Tests: FileUpload Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FileUpload,
    FileUploadTrigger,
    FileUploadContent,
} from '@/components/prompt-kit/file-upload'

describe('FileUpload Component', () => {
    it('should render children and input', () => {
        const handleFiles = jest.fn()
        render(
            <FileUpload onFilesAdded={handleFiles}>
                <FileUploadTrigger>Upload</FileUploadTrigger>
            </FileUpload>
        )
        expect(screen.getByText('Upload')).toBeInTheDocument()
    })

    it('should trigger file selection on click', async () => {
        const user = userEvent.setup()
        const handleFiles = jest.fn()
        render(
            <FileUpload onFilesAdded={handleFiles}>
                <FileUploadTrigger>Upload</FileUploadTrigger>
            </FileUpload>
        )

        const file = new File(['hello'], 'hello.png', { type: 'image/png' })
        const input = document.querySelector('input[type="file"]') as HTMLInputElement

        // Simulating user upload
        await user.upload(input, file)

        expect(input.files?.[0]).toBe(file)
        expect(input.files).toHaveLength(1)
        expect(handleFiles).toHaveBeenCalled()
    })

    it('should handle drag and drop events (simulation)', () => {
        const handleFiles = jest.fn()
        render(
            <FileUpload onFilesAdded={handleFiles}>
                <FileUploadContent>Drop Here</FileUploadContent>
            </FileUpload>
        )

        // Drag and drop is hard to fully simulate with dataTransfer in JSDOM/RTL easily without helpers
        // But we can trigger event listeners if we knew where they are attached (window).

        // Let's at least check that FileUploadContent is not visible initially
        expect(screen.queryByText('Drop Here')).not.toBeInTheDocument()

        // Trigger drag enter on window
        fireEvent.dragEnter(window, {
            dataTransfer: { items: [{ kind: 'file' }] }
        })

        // Now content should appear (portal)
        expect(screen.getByText('Drop Here')).toBeInTheDocument()

        // Trigger drop
        fireEvent.drop(window, {
            dataTransfer: { files: [new File([''], 'test.png')] }
        })

        expect(handleFiles).toHaveBeenCalled()
    })
})
