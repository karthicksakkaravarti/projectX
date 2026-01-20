/**
 * Unit Tests: SubMenu Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SubMenu } from '@/components/common/model-selector/sub-menu'
import { ModelConfig } from '@/lib/models/types'

// Mock providers since it imports PROVIDERS
jest.mock('@/lib/providers', () => ({
    PROVIDERS: [
        { id: 'openai', icon: () => <svg data-testid="openai-icon" /> }
    ]
}))

// Mock chat utils
jest.mock('@/app/components/chat/utils', () => ({
    addUTM: (url: string) => url,
}))

const mockModel: ModelConfig = {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Powerful model',
    icon: 'openai',
    provider: 'OpenAI',
    contextWindow: 128000,
    inputCost: 10,
    outputCost: 30,
    vision: true,
    tools: true,
    reasoning: true,
    webSearch: true,
    accessible: true,
    apiDocs: 'https://api.docs',
    modelPage: 'https://model.page'
}

describe('SubMenu Component', () => {
    it('should render model details', () => {
        render(<SubMenu hoveredModelData={mockModel} />)

        expect(screen.getByText('GPT-4')).toBeInTheDocument()
        expect(screen.getByText('Powerful model')).toBeInTheDocument()
        expect(screen.getByText('Vision')).toBeInTheDocument()
        expect(screen.getByText('Tools')).toBeInTheDocument()
        expect(screen.getByText('Reasoning')).toBeInTheDocument()
        expect(screen.getByText('Web Search')).toBeInTheDocument()

        // Check provider name
        expect(screen.getByText('OpenAI')).toBeInTheDocument()
    })

    it('should render context window tokens', () => {
        render(<SubMenu hoveredModelData={mockModel} />)
        // The component uses fr-FR locale which uses spaces as separators
        // This renders as "128 000 tokens" with non-breaking space
        expect(screen.getByText(/128.*000.*tokens/)).toBeInTheDocument()
    })

    it('should render links', () => {
        render(<SubMenu hoveredModelData={mockModel} />)
        expect(screen.getByText('API Docs')).toBeInTheDocument()
        expect(screen.getByText('Model Page')).toBeInTheDocument()
    })
})
