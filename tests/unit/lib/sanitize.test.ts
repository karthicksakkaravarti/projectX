/**
 * Unit Tests: Sanitize Module
 */

import { sanitizeUserInput } from '@/lib/sanitize'

describe('lib/sanitize', () => {
    describe('sanitizeUserInput', () => {
        it('should return clean text as-is', () => {
            const input = 'This is clean text'
            const result = sanitizeUserInput(input)

            expect(result).toBe(input)
        })

        it('should remove script tags', () => {
            const input = '<script>alert("xss")</script>Hello'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<script>')
            expect(result).not.toContain('alert')
            expect(result).toContain('Hello')
        })

        it('should remove inline JavaScript', () => {
            const input = '<img src=x onerror="alert(1)">'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('onerror')
            expect(result).not.toContain('alert')
        })

        it('should remove onclick handlers', () => {
            const input = '<button onclick="malicious()">Click me</button>'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('onclick')
            expect(result).not.toContain('malicious')
        })

        it('should remove javascript: protocol', () => {
            const input = '<a href="javascript:alert(1)">Click</a>'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('javascript:')
            expect(result).not.toContain('alert')
        })

        it('should allow safe HTML tags', () => {
            const input = '<p>Hello <strong>World</strong></p>'
            const result = sanitizeUserInput(input)

            expect(result).toContain('<p>')
            expect(result).toContain('<strong>')
            expect(result).toContain('Hello')
            expect(result).toContain('World')
        })

        it('should allow safe links', () => {
            const input = '<a href="https://example.com">Link</a>'
            const result = sanitizeUserInput(input)

            expect(result).toContain('href')
            expect(result).toContain('https://example.com')
            expect(result).toContain('Link')
        })

        it('should handle empty string', () => {
            const result = sanitizeUserInput('')

            expect(result).toBe('')
        })

        it('should handle strings with no HTML', () => {
            const input = 'Just plain text with no tags'
            const result = sanitizeUserInput(input)

            expect(result).toBe(input)
        })

        it('should remove iframe tags', () => {
            const input = '<iframe src="malicious.com"></iframe>Content'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<iframe>')
            expect(result).not.toContain('malicious.com')
            expect(result).toContain('Content')
        })

        it('should remove object tags', () => {
            const input = '<object data="malicious.swf"></object>Text'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<object>')
            expect(result).toContain('Text')
        })

        it('should remove embed tags', () => {
            const input = '<embed src="malicious.swf">Text'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<embed>')
            expect(result).toContain('Text')
        })

        it('should handle nested malicious tags', () => {
            const input =
                '<div><script>alert(1)</script><p>Safe</p></div>'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<script>')
            expect(result).not.toContain('alert')
            expect(result).toContain('Safe')
        })

        it('should handle multiple XSS attempts', () => {
            const input = `
                <script>alert(1)</script>
                <img src=x onerror="alert(2)">
                <a href="javascript:alert(3)">Link</a>
                Valid content
            `
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<script>')
            expect(result).not.toContain('onerror')
            expect(result).not.toContain('javascript:')
            expect(result).not.toContain('alert')
            expect(result).toContain('Valid content')
        })

        it('should handle encoded XSS attempts', () => {
            const input = '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;">'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('onerror')
        })

        it('should preserve safe markdown-like content', () => {
            const input = '**bold** and *italic* and `code`'
            const result = sanitizeUserInput(input)

            expect(result).toBe(input)
        })

        it('should handle very long strings', () => {
            const input = 'a'.repeat(10000) + '<script>alert(1)</script>'
            const result = sanitizeUserInput(input)

            expect(result).not.toContain('<script>')
            expect(result).not.toContain('alert')
        })

        it('should handle special characters', () => {
            const input = 'Hello & goodbye < > " \' /'
            const result = sanitizeUserInput(input)

            expect(result).toContain('Hello')
            expect(result).toContain('goodbye')
        })
    })
})
