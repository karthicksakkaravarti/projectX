/**
 * Unit Tests: ProjectView Component
 * 
 * Comprehensive tests covering all code paths including:
 * - Initial render states
 * - Submit functionality
 * - Error handling
 * - Chat creation
 * - Reload functionality
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock functions to track calls and control behavior
const mockCreateNewChat = jest.fn()
const mockBumpChat = jest.fn()
const mockCacheAndAddMessage = jest.fn()
const mockHandleSubmit = jest.fn()
const mockSetInput = jest.fn()
const mockSetMessages = jest.fn()
const mockReload = jest.fn()
const mockStop = jest.fn()
const mockToast = jest.fn()
const mockSetFiles = jest.fn()
const mockHandleFileUploads = jest.fn()
const mockCreateOptimisticAttachments = jest.fn()
const mockCleanupOptimisticAttachments = jest.fn()

// Track onSend callback
let capturedOnSend: (() => void) | null = null
let capturedOnValueChange: ((value: string) => void) | null = null
let capturedOnReload: (() => void) | null = null

// Variable mocks for different test scenarios
let mockChats: any[] = []
let mockMessages: any[] = []
let mockUser: any = { id: 'user-1' }
let mockInput = ''
let mockProjectData: any = { name: 'My Project' }
let mockPathname = '/p/project-123'
let mockFiles: any[] = []
let mockOnError: ((error: Error) => void) | null = null

// Mock toast
jest.mock('@/components/ui/toast', () => ({
    toast: (args: any) => mockToast(args)
}))

// Mock ChatInput to capture callbacks
jest.mock('@/app/components/chat-input/chat-input', () => ({
    ChatInput: ({ value, onValueChange, onSend, onSelectModel, status }: any) => {
        capturedOnSend = onSend
        capturedOnValueChange = onValueChange
        return (
            <div data-testid="chat-input">
                <input
                    data-testid="chat-input-field"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                />
                <button data-testid="send-button" onClick={onSend}>Send</button>
                <span data-testid="status">{status}</span>
            </div>
        )
    }
}))

// Mock Conversation to capture onReload
jest.mock('@/app/components/chat/conversation', () => ({
    Conversation: ({ messages, onReload, onDelete, onEdit }: any) => {
        capturedOnReload = onReload
        return (
            <div data-testid="conversation">
                <button data-testid="reload-button" onClick={onReload}>Reload</button>
                {messages.map((m: any, i: number) => (
                    <div key={i} data-testid="message">
                        <span>{m.content}</span>
                        <button onClick={() => onDelete(m.id)}>Delete</button>
                        <button onClick={() => onEdit(m.id, 'edited')}>Edit</button>
                    </div>
                ))}
            </div>
        )
    }
}))

jest.mock('@/app/components/layout/sidebar/project-chat-item', () => ({
    ProjectChatItem: ({ chat, formatDate }: any) => (
        <div data-testid="project-chat-item">
            <span>{chat.title || 'Untitled'}</span>
            <span data-testid="formatted-date">{formatDate(chat.created_at)}</span>
        </div>
    )
}))

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => ({
        chats: mockChats,
        createNewChat: mockCreateNewChat,
        bumpChat: mockBumpChat
    })
}))

jest.mock('@/lib/chat-store/messages/provider', () => ({
    useMessages: () => ({ cacheAndAddMessage: mockCacheAndAddMessage })
}))

jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => ({ user: mockUser })
}))

jest.mock('@/app/components/chat/use-file-upload', () => ({
    useFileUpload: () => ({
        files: mockFiles,
        setFiles: mockSetFiles,
        handleFileUploads: mockHandleFileUploads,
        createOptimisticAttachments: mockCreateOptimisticAttachments,
        cleanupOptimisticAttachments: mockCleanupOptimisticAttachments,
        handleFileUpload: jest.fn(),
        handleFileRemove: jest.fn(),
    })
}))

// Mock useChat to capture onError callback
jest.mock('@ai-sdk/react', () => ({
    useChat: (config: any) => {
        mockOnError = config.onError
        return {
            messages: mockMessages,
            input: mockInput,
            handleSubmit: mockHandleSubmit,
            status: 'ready',
            reload: mockReload,
            stop: mockStop,
            setMessages: mockSetMessages,
            setInput: mockSetInput,
        }
    }
}))

jest.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: mockProjectData }),
    useMutation: () => ({ mutate: jest.fn() })
}))

jest.mock('next/navigation', () => ({
    usePathname: () => mockPathname,
    useRouter: () => ({ push: jest.fn() })
}))

jest.mock('@/app/components/chat/use-chat-operations', () => ({
    useChatOperations: () => ({
        handleDelete: jest.fn(),
        handleEdit: jest.fn()
    })
}))

jest.mock('@/app/components/chat/use-model', () => ({
    useModel: () => ({
        selectedModel: 'gpt-4',
        handleModelChange: jest.fn()
    })
}))

// Import after mocks
import { ProjectView } from '@/app/p/[projectId]/project-view'

describe('ProjectView Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        capturedOnSend = null
        capturedOnValueChange = null
        capturedOnReload = null
        mockOnError = null

        // Reset mocks to defaults
        mockChats = []
        mockMessages = []
        mockUser = { id: 'user-1' }
        mockInput = ''
        mockProjectData = { name: 'My Project' }
        mockPathname = '/p/project-123'
        mockFiles = []

        mockCreateNewChat.mockResolvedValue({ id: 'new-chat-123' })
        mockHandleFileUploads.mockResolvedValue([])
        mockCreateOptimisticAttachments.mockReturnValue([])
    })

    describe('Initial Render', () => {
        it('should render project name', () => {
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByText('My Project')).toBeInTheDocument()
        })

        it('should render chat input', () => {
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByTestId('chat-input')).toBeInTheDocument()
        })

        it('should show "No chats yet" when no chats exist', () => {
            mockChats = []
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByText('No chats yet')).toBeInTheDocument()
        })
    })

    describe('With Existing Chats', () => {
        it('should show "Recent chats" section when chats exist', () => {
            mockChats = [
                { id: 'chat-1', title: 'First Chat', project_id: 'project-123', created_at: '2024-01-01' }
            ]
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByText('Recent chats')).toBeInTheDocument()
        })

        it('should format dates correctly', () => {
            mockChats = [
                { id: 'chat-1', title: 'Test Chat', project_id: 'project-123', created_at: '2024-06-15' }
            ]
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByTestId('formatted-date')).toHaveTextContent('Jun 15, 2024')
        })

        it('should only show chats belonging to the current project', () => {
            mockChats = [
                { id: 'chat-1', title: 'Project Chat', project_id: 'project-123', created_at: '2024-01-01' },
                { id: 'chat-2', title: 'Other Chat', project_id: 'other-project', created_at: '2024-01-02' }
            ]
            render(<ProjectView projectId="project-123" />)
            expect(screen.getAllByTestId('project-chat-item')).toHaveLength(1)
        })
    })

    describe('Submit Functionality', () => {
        it('should not submit when user is null', async () => {
            mockUser = null
            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            expect(mockCreateNewChat).not.toHaveBeenCalled()
        })

        it('should create new chat when submitting first message', async () => {
            mockInput = 'Hello world'
            mockMessages = []
            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockCreateNewChat).toHaveBeenCalled()
            })
        })

        it('should call handleSubmit after creating chat', async () => {
            mockInput = 'Hello world'
            mockMessages = []
            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockHandleSubmit).toHaveBeenCalled()
            })
        })

        it('should show error toast when message is too long', async () => {
            // Create a very long message (MESSAGE_MAX_LENGTH is typically around 12000)
            mockInput = 'a'.repeat(15000)
            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'error'
                    })
                )
            })
        })

        it('should handle file uploads when files exist', async () => {
            mockInput = 'Message with file'
            mockFiles = [{ name: 'test.txt', type: 'text/plain' }]
            mockCreateOptimisticAttachments.mockReturnValue([{ id: 'opt-1' }])
            mockHandleFileUploads.mockResolvedValue([{ id: 'attachment-1' }])

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockCreateOptimisticAttachments).toHaveBeenCalled()
                expect(mockHandleFileUploads).toHaveBeenCalled()
            })
        })

        it('should cleanup when file upload fails', async () => {
            mockInput = 'Message with file'
            mockFiles = [{ name: 'test.txt' }]
            mockCreateOptimisticAttachments.mockReturnValue([{ id: 'opt-1' }])
            mockHandleFileUploads.mockResolvedValue(null) // Failure

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockCleanupOptimisticAttachments).toHaveBeenCalled()
            })
        })

        it('should call cacheAndAddMessage on successful submit', async () => {
            mockInput = 'Test message'
            mockMessages = [] // Fresh conversation, so new chat will be created

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockCacheAndAddMessage).toHaveBeenCalled()
            })
        })

        it('should handle submit error gracefully', async () => {
            mockInput = 'Test message'
            mockCreateNewChat.mockRejectedValue(new Error('Network error'))

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'error'
                    })
                )
            })
        })
    })

    describe('Error Handling (onError callback)', () => {
        it('should handle JSON error messages', () => {
            render(<ProjectView projectId="project-123" />)

            const jsonError = new Error(JSON.stringify({ error: 'Rate limited' }))
            mockOnError?.(jsonError)

            expect(mockToast).toHaveBeenCalledWith({
                title: 'Rate limited',
                status: 'error'
            })
        })

        it('should handle plain error messages', () => {
            render(<ProjectView projectId="project-123" />)

            const plainError = new Error('Something failed')
            mockOnError?.(plainError)

            expect(mockToast).toHaveBeenCalledWith({
                title: 'Something failed',
                status: 'error'
            })
        })

        it('should use default message for empty errors', () => {
            render(<ProjectView projectId="project-123" />)

            const emptyError = new Error('')
            mockOnError?.(emptyError)

            expect(mockToast).toHaveBeenCalledWith({
                title: 'Something went wrong.',
                status: 'error'
            })
        })
    })

    describe('Reload Functionality', () => {
        it('should call reload with correct options', async () => {
            mockPathname = '/c/some-chat' // Not on project page, shows conversation
            mockMessages = [{ id: '1', content: 'Hello', role: 'user' }]

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnReload?.()
            })

            expect(mockReload).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        userId: 'user-1',
                        model: 'gpt-4',
                        isAuthenticated: true
                    })
                })
            )
        })

        it('should not reload when user is null', async () => {
            mockUser = null
            mockPathname = '/c/some-chat'
            mockMessages = [{ id: '1', content: 'Hello', role: 'user' }]

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnReload?.()
            })

            expect(mockReload).not.toHaveBeenCalled()
        })
    })

    describe('Input Change', () => {
        it('should call setInput when input changes', async () => {
            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnValueChange?.('New input value')
            })

            expect(mockSetInput).toHaveBeenCalledWith('New input value')
        })
    })

    describe('Conversation Mode', () => {
        it('should show conversation when not on project page', () => {
            mockPathname = '/c/chat-123'
            mockMessages = [{ id: '1', role: 'user', content: 'Hello' }]

            render(<ProjectView projectId="project-123" />)

            expect(screen.getByTestId('conversation')).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('should handle null project data', () => {
            mockProjectData = null
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByTestId('chat-input')).toBeInTheDocument()
        })

        it('should handle empty project name', () => {
            mockProjectData = { name: '' }
            render(<ProjectView projectId="project-123" />)
            expect(screen.getByTestId('chat-input')).toBeInTheDocument()
        })

        it('should handle createNewChat returning null', async () => {
            mockInput = 'Test message'
            mockCreateNewChat.mockResolvedValue(null)

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockCleanupOptimisticAttachments).toHaveBeenCalled()
            })
        })

        it('should handle createNewChat throwing with JSON error', async () => {
            mockInput = 'Test message'
            mockCreateNewChat.mockRejectedValue(new Error(JSON.stringify({ error: 'Custom error' })))

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Custom error',
                    status: 'error'
                })
            })
        })

        it('should handle createNewChat throwing with plain error', async () => {
            mockInput = 'Test message'
            mockCreateNewChat.mockRejectedValue(new Error('Plain error message'))

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Plain error message',
                    status: 'error'
                })
            })
        })

        it('should handle generic submit exception', async () => {
            mockInput = 'Test message'
            // Force an exception in the submit by making handleSubmit throw
            mockHandleSubmit.mockImplementation(() => {
                throw new Error('Unexpected error')
            })

            render(<ProjectView projectId="project-123" />)

            await act(async () => {
                capturedOnSend?.()
            })

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Failed to send message',
                    status: 'error'
                })
            })

            // Reset mock
            mockHandleSubmit.mockImplementation(jest.fn())
        })
    })
})

