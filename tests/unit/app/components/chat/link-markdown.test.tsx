/**
 * Unit Tests: LinkMarkdown Component
 * Tests for the LinkMarkdown component that renders styled links in markdown
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { LinkMarkdown } from '@/app/components/chat/link-markdown'

describe('LinkMarkdown Component', () => {
    describe('rendering', () => {
        it('should render a link with valid href', () => {
            render(<LinkMarkdown href="https://example.com">Example</LinkMarkdown>)

            const link = screen.getByRole('link')
            expect(link).toHaveAttribute('href', 'https://example.com')
            expect(link).toHaveAttribute('target', '_blank')
            expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        })

        it('should render span when href is not provided', () => {
            render(<LinkMarkdown>No link</LinkMarkdown>)

            expect(screen.queryByRole('link')).not.toBeInTheDocument()
            expect(screen.getByText('No link')).toBeInTheDocument()
        })

        it('should render span when href is empty string', () => {
            render(<LinkMarkdown href="">Empty href</LinkMarkdown>)

            expect(screen.queryByRole('link')).not.toBeInTheDocument()
            expect(screen.getByText('Empty href')).toBeInTheDocument()
        })

        it('should render span when href is undefined', () => {
            render(<LinkMarkdown href={undefined}>Undefined href</LinkMarkdown>)

            expect(screen.queryByRole('link')).not.toBeInTheDocument()
            expect(screen.getByText('Undefined href')).toBeInTheDocument()
        })

        it('should display domain name for valid URLs', () => {
            render(<LinkMarkdown href="https://www.example.com/page">Click</LinkMarkdown>)

            // Should show domain without www
            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should render favicon image', () => {
            render(<LinkMarkdown href="https://example.com">Link</LinkMarkdown>)

            const img = screen.getByRole('img')
            expect(img).toHaveAttribute('alt', 'favicon')
            expect(img.getAttribute('src')).toContain('google.com/s2/favicons')
        })
    })

    describe('URL handling', () => {
        it('should handle URLs with paths', () => {
            render(<LinkMarkdown href="https://example.com/path/to/page">Link</LinkMarkdown>)

            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should handle URLs with query parameters', () => {
            render(<LinkMarkdown href="https://example.com?query=value">Link</LinkMarkdown>)

            const link = screen.getByRole('link')
            expect(link).toHaveAttribute('href', 'https://example.com?query=value')
        })

        it('should handle relative paths as href', () => {
            render(<LinkMarkdown href="/relative/path">Link</LinkMarkdown>)

            // For invalid URLs, should extract last segment
            expect(screen.getByText('path')).toBeInTheDocument()
        })

        it('should handle relative path with single segment', () => {
            render(<LinkMarkdown href="/page">Link</LinkMarkdown>)

            expect(screen.getByText('page')).toBeInTheDocument()
        })

        it('should handle simple relative path', () => {
            render(<LinkMarkdown href="page">Link</LinkMarkdown>)

            expect(screen.getByText('page')).toBeInTheDocument()
        })

        it('should handle empty path segments', () => {
            render(<LinkMarkdown href="/">Link</LinkMarkdown>)

            // Should fallback to href itself when split produces empty
            const link = screen.getByRole('link')
            expect(link).toBeInTheDocument()
        })

        it('should handle subdomains', () => {
            render(<LinkMarkdown href="https://blog.example.com">Link</LinkMarkdown>)

            expect(screen.getByText('blog.example.com')).toBeInTheDocument()
        })

        it('should handle URLs with ports', () => {
            render(<LinkMarkdown href="https://example.com:8080/page">Link</LinkMarkdown>)

            // hostname from URL doesn't include port, so it should be just the hostname
            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should handle http URLs', () => {
            render(<LinkMarkdown href="http://example.com">Link</LinkMarkdown>)

            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should handle URLs with fragments', () => {
            render(<LinkMarkdown href="https://example.com#section">Link</LinkMarkdown>)

            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should encode special characters in favicon URL', () => {
            render(<LinkMarkdown href="https://example.com/path?query=test&other=value">Link</LinkMarkdown>)

            const img = screen.getByRole('img')
            // The URL should be percent-encoded in the src attribute
            expect(img.getAttribute('src')).toContain('example.com')
            expect(img.getAttribute('src')).toContain('%3F') // encoded ?
        })
    })

    describe('styling', () => {
        it('should apply correct CSS classes', () => {
            render(<LinkMarkdown href="https://example.com">Link</LinkMarkdown>)

            const link = screen.getByRole('link')
            expect(link).toHaveClass('bg-muted')
            expect(link).toHaveClass('rounded-full')
            expect(link).toHaveClass('no-underline')
        })

        it('should apply inline-flex class', () => {
            render(<LinkMarkdown href="https://example.com">Link</LinkMarkdown>)

            const link = screen.getByRole('link')
            expect(link).toHaveClass('inline-flex')
        })
    })

    describe('children handling', () => {
        it('should pass children through correctly', () => {
            render(<LinkMarkdown href="https://example.com"><strong>Bold Link</strong></LinkMarkdown>)

            expect(screen.getByText('example.com')).toBeInTheDocument()
        })

        it('should handle empty children', () => {
            render(<LinkMarkdown href="https://example.com">{''}</LinkMarkdown>)

            const link = screen.getByRole('link')
            expect(link).toBeInTheDocument()
        })

        it('should handle multiple children', () => {
            render(
                <LinkMarkdown href="https://example.com">
                    <span>First</span>
                    <span>Second</span>
                </LinkMarkdown>
            )

            const link = screen.getByRole('link')
            expect(link).toBeInTheDocument()
        })
    })

    describe('props passing', () => {
        it('should pass additional props to span when no href', () => {
            render(<LinkMarkdown data-testid="custom-span" className="custom-class">Text</LinkMarkdown>)

            const span = screen.getByTestId('custom-span')
            expect(span).toHaveClass('custom-class')
        })
    })
})
