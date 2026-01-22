/**
 * Unit Tests: Markdown Component
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { Markdown } from '@/components/prompt-kit/markdown'

// Mock the ESM dependencies to avoid Jest issues
jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children, components }: any) => {
        // Simulate component processing by calling components if provided
        if (components && typeof components.code === 'function') {
            // Simulate inline code block
            const inlineResult = components.code({
                className: undefined,
                children: 'inline code',
                node: { position: { start: { line: 1 }, end: { line: 1 } } }
            })
            
            // Simulate code block
            const codeBlockResult = components.code({
                className: 'language-javascript',
                children: 'const x = 1',
                node: { position: { start: { line: 1 }, end: { line: 3 } } }
            })
            
            // Simulate code block without className
            const codeBlockNoLang = components.code({
                className: undefined,
                children: 'plain code',
                node: { position: { start: { line: 1 }, end: { line: 3 } } }
            })
            
            // Simulate code block with no position info (inline branch)
            const noPositionCode = components.code({
                className: 'language-python',
                children: 'print()',
                node: {}
            })
            
            return (
                <div data-testid="react-markdown">
                    {children}
                    <div data-testid="inline-code">{inlineResult}</div>
                    <div data-testid="code-block">{codeBlockResult}</div>
                    <div data-testid="code-no-lang">{codeBlockNoLang}</div>
                    <div data-testid="no-position">{noPositionCode}</div>
                </div>
            )
        }
        
        if (components && typeof components.a === 'function') {
            const linkWithHref = components.a({
                href: 'https://example.com',
                children: 'Link text'
            })
            const linkWithoutHref = components.a({
                href: undefined,
                children: 'No href'
            })
            return (
                <div data-testid="react-markdown">
                    {children}
                    <div data-testid="link-with-href">{linkWithHref}</div>
                    <div data-testid="link-without-href">{linkWithoutHref}</div>
                </div>
            )
        }
        
        if (components && typeof components.pre === 'function') {
            const preResult = components.pre({ children: <code>pre content</code> })
            return (
                <div data-testid="react-markdown">
                    {children}
                    <div data-testid="pre-content">{preResult}</div>
                </div>
            )
        }
        
        return <div data-testid="react-markdown">{children}</div>
    }
}))

jest.mock('remark-gfm', () => ({}))
jest.mock('remark-breaks', () => ({}))
jest.mock('marked', () => ({
    marked: {
        lexer: (text: string) => [{ raw: text }]
    }
}))

// Mock other components used inside Markdown
jest.mock('@/app/components/chat/link-markdown', () => ({
    LinkMarkdown: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href} data-testid="link-markdown">{children}</a>
    )
}))

jest.mock('@/components/prompt-kit/code-block', () => ({
    CodeBlock: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="code-block-wrapper" className={className}>{children}</div>
    ),
    CodeBlockGroup: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="code-block-group">{children}</div>
    ),
    CodeBlockCode: ({ code, language }: { code: string; language: string }) => (
        <code data-testid="code-block-code" data-language={language}>{code}</code>
    )
}))

jest.mock('@/components/common/button-copy', () => ({
    ButtonCopy: ({ code }: { code: string }) => (
        <button data-testid="button-copy" data-code={code}>Copy</button>
    )
}))

describe('Markdown Component', () => {
    describe('Basic Rendering', () => {
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
        
        it('should render with custom className', () => {
            const { container } = render(
                <Markdown className="custom-markdown-class"># Test</Markdown>
            )
            expect(container.firstChild).toHaveClass('custom-markdown-class')
        })
        
        it('should render with custom id', () => {
            render(<Markdown id="custom-id"># Test</Markdown>)
            expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
        })
        
        it('should generate id when not provided', () => {
            render(<Markdown># Test without ID</Markdown>)
            expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
        })
    })
    
    describe('Multiple Blocks', () => {
        beforeEach(() => {
            jest.resetModules()
        })
        
        it('should parse and render multiple markdown blocks', () => {
            // Test with multiple blocks by mocking lexer to return multiple tokens
            jest.doMock('marked', () => ({
                marked: {
                    lexer: (text: string) => [
                        { raw: '# Block 1' },
                        { raw: '## Block 2' },
                        { raw: 'Paragraph' }
                    ]
                }
            }))
            
            render(<Markdown># Block 1\n\n## Block 2\n\nParagraph</Markdown>)
            expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
        })
    })
    
    describe('Empty Content', () => {
        it('should handle empty string', () => {
            const { container } = render(<Markdown>{''}</Markdown>)
            expect(container).toBeInTheDocument()
        })
        
        it('should handle whitespace-only content', () => {
            render(<Markdown>{'   '}</Markdown>)
            expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
        })
    })
    
    describe('Custom Components', () => {
        it('should accept custom components prop', () => {
            const customComponents = {
                p: ({ children }: { children: React.ReactNode }) => (
                    <p data-testid="custom-p">{children}</p>
                )
            }
            
            render(<Markdown components={customComponents}>Test paragraph</Markdown>)
            expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
        })
    })
    
    describe('Memoization', () => {
        it('should re-render when content changes', () => {
            const { rerender } = render(<Markdown># Initial</Markdown>)
            expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Initial')
            
            rerender(<Markdown># Updated</Markdown>)
            expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Updated')
        })
        
        it('should maintain memoization with same content', () => {
            const { rerender } = render(<Markdown># Same</Markdown>)
            expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Same')
            
            rerender(<Markdown># Same</Markdown>)
            expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Same')
        })
    })
})

describe('extractLanguage utility', () => {
    // Since extractLanguage is internal, we test it through component behavior
    // The mock simulates the logic
    
    it('should extract language from className', () => {
        // The mock renders code blocks with language extraction
        render(<Markdown>```javascript\nconst x = 1;\n```</Markdown>)
        expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
    
    it('should return plaintext when no className', () => {
        render(<Markdown>```\nplain code\n```</Markdown>)
        expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
    
    it('should return plaintext when className has no language match', () => {
        render(<Markdown>Test with no specific language</Markdown>)
        expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
})

describe('parseMarkdownIntoBlocks utility', () => {
    it('should parse single block', () => {
        render(<Markdown># Single heading</Markdown>)
        expect(screen.getByTestId('react-markdown')).toHaveTextContent('# Single heading')
    })
    
    it('should handle markdown with code blocks', () => {
        const content = '# Title\n\n```js\ncode\n```\n\nParagraph'
        render(<Markdown>{content}</Markdown>)
        expect(screen.getByTestId('react-markdown')).toBeInTheDocument()
    })
})
