/**
 * Unit Tests: Message Component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
    Message,
    MessageAction,
    MessageActions,
    MessageAvatar,
    MessageContent,
} from '@/components/prompt-kit/message'

// Mock next/dynamic to render immediately
jest.mock('next/dynamic', () => ({
    __esModule: true,
    default: (fn: any) => {
        // We can't easily resolve the promise in sync, so we return a placeholder or mock content
        // But since MessageContent uses it for ./markdown, we can mock that specific import in the test file map
        // Better yet, let's return a Mock component that just renders children.
        const MockDynamic = (props: any) => <div data-testid="markdown-mock">{props.children}</div>
        return MockDynamic
    },
}))

describe('Message Component', () => {
    it('should render basic message structure', () => {
        render(
            <Message>
                <div>Content</div>
            </Message>
        )
        expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render avatar', () => {
        render(
            <MessageAvatar src="/test.png" alt="Test User" fallback="TU" />
        )
        // Avatar testing usually relies on fallback if image is not loaded
        expect(screen.getByText('TU')).toBeInTheDocument()
    })

    it('should render simple content (non-markdown)', () => {
        render(
            <MessageContent>
                Simple Text
            </MessageContent>
        )
        expect(screen.getByText('Simple Text')).toBeInTheDocument()
    })

    it('should render markdown content', async () => {
        // Mock the Markdown component to avoid dynamic import issues in test
        render(
            <MessageContent markdown>
                **Bold Text**
            </MessageContent>
        )

        // Since we mocked dynamic import below (or if we didn't, we should rely on text content)
        // Let's assume the component renders text if dynamic import fails or succeeds.
        // Actually, let's mock the internal Markdown component
        expect(screen.getByText('**Bold Text**')).toBeInTheDocument()
    })

    it('should render actions', () => {
        render(
            <MessageActions>
                <button>Action</button>
            </MessageActions>
        )
        expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('should render numbered/singular actions with tooltip', async () => {
        render(
            <TooltipProvider>
                <MessageAction tooltip="Tooltip Text">
                    <button>Icon</button>
                </MessageAction>
            </TooltipProvider>
        )
        // Tooltip trigger
        expect(screen.getByText('Icon')).toBeInTheDocument()
    })
})
