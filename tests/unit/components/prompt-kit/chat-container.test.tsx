/**
 * Unit Tests: ChatContainer Components
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import {
    ChatContainerRoot,
    ChatContainerContent,
    ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container'

// Mock use-stick-to-bottom
jest.mock('use-stick-to-bottom', () => {
    const FakeStickToBottom = ({ children, className, ...props }: any) => (
        <div data-testid="stick-to-bottom" className={className} {...props}>{children}</div>
    )
    FakeStickToBottom.Content = ({ children, className, ...props }: any) => (
        <div data-testid="stick-to-bottom-content" className={className} {...props}>{children}</div>
    )
    return {
        StickToBottom: FakeStickToBottom,
    }
})

describe('ChatContainer Components', () => {
    it('should render ChatContainerRoot', () => {
        render(
            <ChatContainerRoot>
                <div>Child</div>
            </ChatContainerRoot>
        )
        const root = screen.getByTestId('stick-to-bottom')
        expect(root).toBeInTheDocument()
        expect(screen.getByText('Child')).toBeInTheDocument()
        expect(root).toHaveAttribute('role', 'log')
    })

    it('should render ChatContainerContent', () => {
        render(
            <ChatContainerContent>
                <div>Content</div>
            </ChatContainerContent>
        )
        const content = screen.getByTestId('stick-to-bottom-content')
        expect(content).toBeInTheDocument()
        expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render ChatContainerScrollAnchor', () => {
        const { container } = render(<ChatContainerScrollAnchor />)
        // It's a div with mostly style classes
        expect(container.firstChild).toHaveClass('h-px')
        expect(container.firstChild).toHaveClass('w-full')
    })
})
