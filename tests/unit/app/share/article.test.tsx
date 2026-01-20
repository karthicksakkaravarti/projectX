/**
 * Unit Tests: Share Article Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import Article from '@/app/share/[chatId]/article'

// Mock dependencies
jest.mock('@/app/share/[chatId]/header', () => ({
    Header: () => <div data-testid="header">Header</div>
}))

jest.mock('@/components/prompt-kit/message', () => ({
    Message: ({ children }: any) => <div data-testid="message">{children}</div>,
    MessageContent: ({ children }: any) => <div data-testid="message-content">{children}</div>
}))

jest.mock('@/app/components/chat/get-sources', () => ({
    getSources: () => []
}))
jest.mock('@/app/components/chat/sources-list', () => ({
    SourcesList: () => <div>Sources</div>
}))

const mockMessages: any[] = [
    { id: '1', role: 'user', content: 'Hello', parts: [], created_at: '2023-01-01' },
    { id: '2', role: 'assistant', content: 'Hi there', parts: [], created_at: '2023-01-01' },
]

describe('Article Component', () => {
    it('should render article details', () => {
        render(
            <Article
                date="2023-10-15"
                title="My Chat"
                subtitle="A conversation"
                messages={mockMessages}
            />
        )

        expect(screen.getByText('My Chat')).toBeInTheDocument()
        expect(screen.getByText('A conversation')).toBeInTheDocument()
        // Date formatting check might differ based on locale, just checking existence of some part
        expect(screen.getByText(/October/)).toBeInTheDocument()

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getAllByTestId('message')).toHaveLength(2)
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(screen.getByText('Hi there')).toBeInTheDocument()
    })
})
