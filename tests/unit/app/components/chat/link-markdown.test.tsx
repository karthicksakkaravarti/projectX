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

        it('should handle subdomains', () => {
            render(<LinkMarkdown href="https://blog.example.com">Link</LinkMarkdown>)

            expect(screen.getByText('blog.example.com')).toBeInTheDocument()
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
    })
})
