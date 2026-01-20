import { render, screen, fireEvent } from '@testing-library/react'
import { InteractionPreferences } from '@/app/components/layout/settings/appearance/interaction-preferences'
import { useUserPreferences } from '@/lib/user-preference-store/provider'

// Mock the user preferences hook
jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: jest.fn(),
}))

describe('InteractionPreferences', () => {
    const mockSetPromptSuggestions = jest.fn()
    const mockSetShowToolInvocations = jest.fn()
    const mockSetShowConversationPreviews = jest.fn()
    const mockSetMultiModelEnabled = jest.fn()

    const defaultPreferences = {
        promptSuggestions: false,
        showToolInvocations: false,
        showConversationPreviews: false,
        multiModelEnabled: false,
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: defaultPreferences,
            setPromptSuggestions: mockSetPromptSuggestions,
            setShowToolInvocations: mockSetShowToolInvocations,
            setShowConversationPreviews: mockSetShowConversationPreviews,
            setMultiModelEnabled: mockSetMultiModelEnabled,
        })
    })

    test('renders all preference sections', () => {
        render(<InteractionPreferences />)

        expect(screen.getByText('Prompt suggestions')).toBeInTheDocument()
        expect(screen.getByText('Show suggested prompts when starting a new conversation')).toBeInTheDocument()

        expect(screen.getByText('Tool invocations')).toBeInTheDocument()
        expect(screen.getByText('Show tool execution details in conversations')).toBeInTheDocument()

        expect(screen.getByText('Conversation previews')).toBeInTheDocument()
        expect(screen.getByText('Show conversation previews in history')).toBeInTheDocument()

        expect(screen.getByText('Multi-model chat')).toBeInTheDocument()
        expect(screen.getByText('Send prompts to multiple models at once')).toBeInTheDocument()
    })

    test('toggles prompt suggestions', () => {
        render(<InteractionPreferences />)
        const switches = screen.getAllByRole('switch')
        // Order: Prompt, Tool, Previews, Multi-model
        fireEvent.click(switches[0])
        expect(mockSetPromptSuggestions).toHaveBeenCalled()
    })

    test('toggles tool invocations', () => {
        render(<InteractionPreferences />)
        const switches = screen.getAllByRole('switch')
        fireEvent.click(switches[1])
        expect(mockSetShowToolInvocations).toHaveBeenCalled()
    })

    test('toggles conversation previews', () => {
        render(<InteractionPreferences />)
        const switches = screen.getAllByRole('switch')
        fireEvent.click(switches[2])
        expect(mockSetShowConversationPreviews).toHaveBeenCalled()
    })

    test('toggles multi-model chat', () => {
        render(<InteractionPreferences />)
        const switches = screen.getAllByRole('switch')
        fireEvent.click(switches[3])
        expect(mockSetMultiModelEnabled).toHaveBeenCalled()
    })

    test('displays correct initial state for switches', () => {
        (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: {
                promptSuggestions: true,
                showToolInvocations: true,
                showConversationPreviews: false,
                multiModelEnabled: false,
            },
            setPromptSuggestions: mockSetPromptSuggestions,
            setShowToolInvocations: mockSetShowToolInvocations,
            setShowConversationPreviews: mockSetShowConversationPreviews,
            setMultiModelEnabled: mockSetMultiModelEnabled,
        })

        render(<InteractionPreferences />)
        const switches = screen.getAllByRole('switch')

        expect(switches[0]).toBeChecked() // promptSuggestions: true
        expect(switches[1]).toBeChecked() // showToolInvocations: true
        expect(switches[2]).not.toBeChecked() // showConversationPreviews: false
        expect(switches[3]).not.toBeChecked() // multiModelEnabled: false
    })
})
