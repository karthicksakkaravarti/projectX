/**
 * Unit Tests: Loader Component
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Loader } from '@/components/prompt-kit/loader'

describe('Loader Component', () => {
    it('should render without crashing', () => {
        const { container } = render(<Loader />)
        // Should have 3 dots
        // The container creates a flex div
        expect(container.firstChild).toHaveClass('flex')
        // The dots are motion divs, they should be present
        expect(container.querySelectorAll('.rounded-full')).toHaveLength(3)
    })
})
