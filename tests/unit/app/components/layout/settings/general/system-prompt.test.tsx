import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SystemPromptSection } from '@/app/components/layout/settings/general/system-prompt'
import { toast } from '@/components/ui/toast'
import userEvent from '@testing-library/user-event'

// Mock dependencies
const mockUpdateUser = jest.fn()
const mockUser = {
    id: 'user-123',
    system_prompt: 'Initial system prompt',
}

let useUserReturnValue = {
    user: mockUser as any,
    updateUser: mockUpdateUser,
}

jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => useUserReturnValue,
}))

jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

// Mock motion/react
jest.mock('motion/react', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>,
    },
}))

describe('SystemPromptSection Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useUserReturnValue = {
            user: mockUser,
            updateUser: mockUpdateUser,
        }
    })

    test('renders correctly with initial prompt', () => {
        render(<SystemPromptSection />)

        expect(screen.getByText('Default system prompt')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter a default system prompt for new conversations')).toHaveValue('Initial system prompt')
        expect(screen.getByText('This prompt will be used for new chats.')).toBeInTheDocument()
        // Save button should not be visible initially
        expect(screen.queryByRole('button', { name: /save prompt/i })).not.toBeInTheDocument()
    })

    test('shows save button when prompt is changed', async () => {
        const user = userEvent.setup()
        render(<SystemPromptSection />)

        const textarea = screen.getByPlaceholderText('Enter a default system prompt for new conversations')
        await user.clear(textarea)
        await user.type(textarea, 'New system prompt')

        expect(textarea).toHaveValue('New system prompt')
        expect(screen.getByRole('button', { name: /save prompt/i })).toBeInTheDocument()
    })

    test('saves prompt successfully', async () => {
        const user = userEvent.setup()

        // Delay mock resolution to catch loading state
        mockUpdateUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(<SystemPromptSection />)

        const textarea = screen.getByPlaceholderText('Enter a default system prompt for new conversations')
        await user.clear(textarea)
        await user.type(textarea, 'New system prompt')

        const saveButton = screen.getByRole('button', { name: /save prompt/i })
        await user.click(saveButton)

        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()

        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith({ system_prompt: 'New system prompt' })
        })

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith({
                title: 'Prompt saved',
                description: "It'll be used for new chats.",
                status: 'success',
            })
        })
    })

    test('handles save failure', async () => {
        const user = userEvent.setup()
        const error = new Error('Update failed')
        mockUpdateUser.mockRejectedValueOnce(error)
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        render(<SystemPromptSection />)

        const textarea = screen.getByPlaceholderText('Enter a default system prompt for new conversations')
        await user.clear(textarea)
        await user.type(textarea, 'New system prompt')

        const saveButton = screen.getByRole('button', { name: /save prompt/i })
        await user.click(saveButton)

        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalledWith('Error saving system prompt:', error)
            expect(toast).toHaveBeenCalledWith({
                title: 'Failed to save',
                description: "Couldn't save your system prompt. Please try again.",
                status: 'error',
            })
        })

        consoleSpy.mockRestore()
    })

    test('does not save if user id is missing', async () => {
        // Modify mock return for this test
        useUserReturnValue = {
            user: null,
            updateUser: mockUpdateUser,
        }

        const user = userEvent.setup()
        render(<SystemPromptSection />)

        const textarea = screen.getByPlaceholderText('Enter a default system prompt for new conversations')
        // Since user is null, effectivePrompt is ""
        expect(textarea).toHaveValue('')

        await user.type(textarea, 'New system prompt')

        const saveButton = screen.getByRole('button', { name: /save prompt/i })
        await user.click(saveButton)

        expect(mockUpdateUser).not.toHaveBeenCalled()
    })
})
