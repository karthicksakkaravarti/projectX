/**
 * Unit Tests: Share Header Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from '@/app/share/[chatId]/header'

describe('Share Header Component', () => {
    it('should render header with link to home', () => {
        render(<Header />)
        const link = screen.getByRole('link', { name: 'ProjectX' })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/')
    })
})
