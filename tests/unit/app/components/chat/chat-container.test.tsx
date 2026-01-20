/**
 * Unit Tests: ChatContainer Component
 * Tests for the main ChatContainer component that switches between single and multi-chat modes
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChatContainer } from '@/app/components/chat/chat-container'

// Mock dependencies
jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: jest.fn(),
}))

jest.mock('@/app/components/multi-chat/multi-chat', () => ({
    MultiChat: () => <div data-testid="multi-chat">MultiChat Component</div>,
}))

jest.mock('@/app/components/chat/chat', () => ({
    Chat: () => <div data-testid="single-chat">Chat Component</div>,
}))

// Import mock after mocking
import { useUserPreferences } from '@/lib/user-preference-store/provider'

const mockUseUserPreferences = useUserPreferences as jest.MockedFunction<typeof useUserPreferences>

describe('ChatContainer Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render Chat component when multiModelEnabled is false', () => {
        mockUseUserPreferences.mockReturnValue({
            preferences: {
                multiModelEnabled: false,
                promptSuggestions: true,
                showToolInvocations: true,
            },
            setPreferences: jest.fn(),
            isLoaded: true,
        } as any)

        render(<ChatContainer />)
        expect(screen.getByTestId('single-chat')).toBeInTheDocument()
    })

    it('should render MultiChat component when multiModelEnabled is true', () => {
        mockUseUserPreferences.mockReturnValue({
            preferences: {
                multiModelEnabled: true,
                promptSuggestions: true,
                showToolInvocations: true,
            },
            setPreferences: jest.fn(),
            isLoaded: true,
        } as any)

        render(<ChatContainer />)
        expect(screen.getByTestId('multi-chat')).toBeInTheDocument()
    })

    it('should default to Chat component when preferences are undefined', () => {
        mockUseUserPreferences.mockReturnValue({
            preferences: {},
            setPreferences: jest.fn(),
            isLoaded: true,
        } as any)

        render(<ChatContainer />)
        expect(screen.getByTestId('single-chat')).toBeInTheDocument()
    })
})
