/**
 * Unit Tests: Markdown Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Markdown } from '@/components/prompt-kit/markdown'

// Mock the ESM dependencies to avoid Jest issues
jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children, components }: any) => {
        // We can simulate some basic rendering or use the components if provided
        // For testing purposes, we just render the raw children in a div, 
        // effectively stripping markdown processing but verifying the component flow.

        // If code component is used in Markdown.tsx, we can't easily simulate it here 
        // without complex mocking, so we just render text.
        return <div data-testid="react-markdown">{children}</div>
    }
}))

jest.mock('remark-gfm', () => ({}))
jest.mock('remark-breaks', () => ({}))
jest.mock('marked', () => ({
    marked: {
        lexer: (text: string) => [{ raw: text }] // Simple mock to return the text as a single block
    }
}))

// Mock other components used inside Markdown
jest.mock('@/app/components/chat/link-markdown', () => ({
    LinkMarkdown: ({ children }: any) => <a>{children}</a>
}))

jest.mock('@/components/prompt-kit/code-block', () => ({
    CodeBlock: ({ children }: any) => <div>{children}</div>,
    CodeBlockGroup: ({ children }: any) => <div>{children}</div>,
    CodeBlockCode: ({ code }: any) => <code>{code}</code>
}))

jest.mock('@/components/common/button-copy', () => ({
    ButtonCopy: () => <button>Copy</button>
}))

describe('Markdown Component', () => {
    it('should render markdown content', () => {
        render(<Markdown># Hello World</Markdown>)
        expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Hello World')
    })

    it('should handle complex content', () => {
        const content = `
        # Title
        
        - Item 1
        - Item 2
        `
        render(<Markdown>{content}</Markdown>)
        expect(screen.getByTestId('react-markdown')).toHaveTextContent('Title')
    })
})
